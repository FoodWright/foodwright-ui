<template>
  <q-card flat bordered class="q-mb-md overflow-hidden">
    <q-card-section class="q-pb-sm">
      <div class="row items-center q-mb-md">
        <q-avatar size="40px" color="primary" text-color="white">
          {{ userInitial }}
        </q-avatar>
        <div class="q-ml-sm text-subtitle1 text-weight-medium">
          What's on the menu?
        </div>
      </div>

      <q-input
        v-model="postContent"
        type="textarea"
        placeholder="How is the cook going?"
        outlined
        counter
        maxlength="500"
        autogrow
        :rows="3"
      />

      <div class="q-mt-md q-gutter-y-sm">
        <!-- Recipe Selector / URL Input -->
        <div class="q-gutter-y-sm">
          <q-select
            v-model="selectedRecipe"
            :options="recipeOptions"
            label="Food Wright Recipe"
            outlined
            dense
            use-input
            @filter="filterRecipes"
            emit-value
            map-options
            option-label="title"
            option-value="id"
            clearable
            hint="Link a recipe from your cookbook (optional)"
          >
            <template v-slot:prepend>
              <q-icon name="menu_book" />
            </template>
          </q-select>

          <div class="text-center text-caption text-grey-7 q-my-xs">OR</div>

          <q-input
            v-model="externalUrl"
            label="External Recipe Link"
            outlined
            dense
            placeholder="https://another-site.com/recipe"
            clearable
            hint="Paste any recipe URL here (optional)"
          >
            <template v-slot:prepend>
              <q-icon name="link" />
            </template>
          </q-input>
        </div>

        <!-- Image File Input -->
        <q-file
          v-model="imageFile"
          label="Attach a photo"
          outlined
          dense
          clearable
          accept="image/*"
          @update:model-value="onFileChange"
        >
          <template v-slot:prepend>
            <q-icon name="add_a_photo" />
          </template>
        </q-file>

        <!-- Image Preview -->
        <div v-if="imagePreviewUrl" class="q-mt-sm rounded-borders overflow-hidden relative-position">
          <q-img :src="imagePreviewUrl" :ratio="16/9" fit="cover">
            <template v-slot:error>
              <div class="absolute-full flex flex-center bg-negative text-white">
                Invalid Image
              </div>
            </template>
          </q-img>
          <q-btn
            round
            color="dark"
            icon="close"
            size="sm"
            class="absolute-top-right q-ma-sm"
            @click="clearImage"
          />
        </div>
      </div>

      <div class="q-mt-md row justify-between items-center">
        <q-btn flat color="grey-7" label="Cancel" v-close-popup />
        <q-btn
          color="primary"
          label="Post to Feed"
          icon="send"
          @click="handlePost"
          :disable="!canPost || posting"
          :loading="posting"
          unelevated
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from 'stores/auth'
import { useSocialStore } from 'stores/social'
import { useRecipeStore } from 'stores/recipes'
import { useQuasar } from 'quasar'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { firebaseStorage } from 'src/boot/firebase'

const emit = defineEmits(['posted'])

const authStore = useAuthStore()
const socialStore = useSocialStore()
const recipeStore = useRecipeStore()
const $q = useQuasar()

const postContent = ref('')
const imageFile = ref(null)
const imagePreviewUrl = ref('')
const selectedRecipe = ref(null)
const externalUrl = ref('')
const showOptions = ref(false)
const posting = ref(false)

const allRecipes = ref([])
const recipeOptions = ref([])

const userInitial = computed(() => {
  if (authStore.user && authStore.user.displayName) {
    return authStore.user.displayName[0].toUpperCase()
  }
  return '?'
})

const canPost = computed(() => {
  return postContent.value.trim() || imageFile.value || externalUrl.value.trim()
})

const onFileChange = (file) => {
  if (file) {
    imagePreviewUrl.value = URL.createObjectURL(file)
  } else {
    imagePreviewUrl.value = ''
  }
}

const clearImage = () => {
  imageFile.value = null
  imagePreviewUrl.value = ''
}

const resetForm = () => {
  postContent.value = ''
  externalUrl.value = ''
  clearImage()
  selectedRecipe.value = null
  showOptions.value = false
}

const filterRecipes = (val, update) => {
  if (val === '') {
    update(() => {
      recipeOptions.value = allRecipes.value
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    recipeOptions.value = allRecipes.value.filter(v => v.title.toLowerCase().indexOf(needle) > -1)
  })
}

const handlePost = async () => {
  if (!canPost.value) return

  posting.value = true
  try {
    let finalImageUrl = ''

    // Handle Image Upload to Firebase Storage
    if (imageFile.value) {
      const fileExt = imageFile.value.name.split('.').pop()
      const fileName = `posts/${authStore.user.uid}/${Date.now()}.${fileExt}`
      const sRef = storageRef(firebaseStorage, fileName)
      
      await uploadBytes(sRef, imageFile.value)
      finalImageUrl = await getDownloadURL(sRef)
    }

    const payload = {
      content: postContent.value.trim(),
      image_url: finalImageUrl,
      recipe_id: selectedRecipe.value ? selectedRecipe.value : null,
      external_url: externalUrl.value.trim()
    }

    await socialStore.createQuickPost(payload)
    resetForm()
    $q.notify({
      type: 'positive',
      message: 'Posted to your feed!',
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

onMounted(async () => {
  try {
    const [favorites, submissions] = await Promise.all([
      recipeStore.fetchMyCookbook(),
      recipeStore.fetchMySubmissions()
    ])
    // Combine and remove duplicates by ID
    const combined = [...favorites, ...submissions]
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values())
    allRecipes.value = unique
    recipeOptions.value = unique
  } catch (error) {
    console.error('Error fetching recipes for selection:', error)
  }
})
</script>

<style scoped>
.rounded-borders {
  border-radius: 8px;
}
</style>
