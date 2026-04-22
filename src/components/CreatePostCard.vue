<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section>
      <div class="row items-center q-mb-md">
        <q-avatar size="40px" color="primary" text-color="white">
          {{ userInitial }}
        </q-avatar>
        <div class="q-ml-sm text-subtitle1 text-weight-medium">
          What are you cooking?
        </div>
      </div>

      <q-input
        v-model="postContent"
        type="textarea"
        placeholder="Share your cooking thoughts..."
        outlined
        counter
        maxlength="500"
        autogrow
        :rows="3"
      />

      <div class="q-mt-md row justify-end">
        <q-btn
          color="primary"
          label="Post"
          icon="send"
          @click="createPost"
          :disable="!postContent.trim() || posting"
          :loading="posting"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSocialStore } from '@/stores/social'
import { useQuasar } from 'quasar'

export default {
  name: 'CreatePostCard',
  emits: ['posted'],
  setup(props, { emit }) {
    const authStore = useAuthStore()
    const socialStore = useSocialStore()
    const $q = useQuasar()

    const postContent = ref('')
    const posting = ref(false)

    const userInitial = computed(() => {
      if (authStore.user && authStore.user.displayName) {
        return authStore.user.displayName[0].toUpperCase()
      }
      return '?'
    })

    const createPost = async () => {
      if (!postContent.value.trim()) return

      posting.value = true
      try {
        await socialStore.createQuickPost(postContent.value.trim())
        postContent.value = ''
        $q.notify({
          type: 'positive',
          message: 'Post created successfully!',
          position: 'top',
          timeout: 2000
        })
        emit('posted')
      } catch (error) {
        console.error('Error creating post:', error)
        $q.notify({
          type: 'negative',
          message: 'Failed to create post. Please try again.',
          position: 'top'
        })
      } finally {
        posting.value = false
      }
    }

    return {
      postContent,
      posting,
      userInitial,
      createPost
    }
  }
}
</script>
