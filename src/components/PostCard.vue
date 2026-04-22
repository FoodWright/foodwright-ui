<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section>
      <!-- User header -->
      <div class="row items-center">
        <q-avatar size="40px" color="primary" text-color="white">
          {{ post.username ? post.username[0].toUpperCase() : '?' }}
        </q-avatar>
        <div class="q-ml-sm">
          <router-link :to="`/profile/${post.user_id}`" class="text-primary text-weight-bold">
            {{ post.username }}
          </router-link>
          <div class="text-caption text-grey-7">
            {{ post.user_rank }} • {{ formatDate(post.created_at) }}
          </div>
        </div>
        <q-space />
        <!-- Delete button if own post -->
        <q-btn v-if="isOwnPost && post.post_type !== 'cook_log'" flat round icon="more_vert">
          <q-menu>
            <q-list>
              <q-item clickable @click="handleDelete">
                <q-item-section>Delete</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>

      <!-- Post content based on type -->
      <div v-if="post.post_type === 'cook_log'" class="q-mt-md">
        <div class="text-body1">
          <q-icon name="restaurant" color="primary" size="sm" class="q-mr-xs" />
          Cooked:
          <router-link
            :to="`/recipe/${post.recipe_id}-${post.recipe_slug}`"
            class="text-primary text-weight-bold"
          >
            {{ post.recipe_title }}
          </router-link>
        </div>
        <q-rating
          v-if="post.rating"
          :model-value="post.rating"
          readonly
          size="sm"
          color="orange"
          icon="star"
          class="q-mt-xs"
        />
        <p v-if="post.notes" class="text-grey-8 q-mt-sm">{{ post.notes }}</p>
        <q-img
          v-if="post.recipe_image"
          :src="post.recipe_image"
          :ratio="16 / 9"
          class="q-mt-sm rounded-borders"
        />
      </div>

      <div v-else-if="post.post_type === 'recipe_share'" class="q-mt-md">
        <div class="text-body1">
          <q-icon name="share" color="primary" size="sm" class="q-mr-xs" />
          Shared:
          <router-link
            :to="`/recipe/${post.recipe_id}-${post.recipe_slug}`"
            class="text-primary text-weight-bold"
          >
            {{ post.recipe_title }}
          </router-link>
        </div>
        <q-img
          v-if="post.recipe_image"
          :src="post.recipe_image"
          :ratio="16 / 9"
          class="q-mt-sm rounded-borders"
        />
      </div>

      <div v-else-if="post.post_type === 'quick_post'" class="q-mt-md">
        <p class="text-body1">{{ post.content }}</p>
      </div>

      <!-- Engagement bar -->
      <q-separator class="q-my-md" />
      <div class="row q-gutter-md">
        <q-btn
          flat
          dense
          :color="post.is_liked ? 'red' : 'grey'"
          :icon="post.is_liked ? 'favorite' : 'favorite_border'"
          :label="post.like_count > 0 ? String(post.like_count) : ''"
          @click="emit('like', post.id)"
        />
        <q-btn
          flat
          dense
          color="grey"
          icon="repeat"
          :label="post.repost_count > 0 ? String(post.repost_count) : ''"
          @click="emit('repost', post.id)"
        />
        <q-btn
          v-if="post.recipe_id"
          flat
          dense
          color="grey"
          icon="comment"
          :to="`/recipe/${post.recipe_id}-${post.recipe_slug}`"
          label="View Recipe"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from 'stores/auth'
import { formatDistanceToNow } from 'date-fns'

const props = defineProps({
  post: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['like', 'repost', 'delete'])

const authStore = useAuthStore()

const isOwnPost = computed(() => {
  return authStore.user && authStore.user.uid === props.post.user_id
})

const formatDate = (dateString) => {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  } catch (e) {
    return dateString
  }
}

const handleDelete = () => {
  emit('delete', props.post.id)
}
</script>

<style scoped>
.rounded-borders {
  border-radius: 8px;
}
</style>
