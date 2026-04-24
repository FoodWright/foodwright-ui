<template>
  <q-page class="q-pa-md">
    <div style="max-width: 700px; margin: 0 auto">
      <h4 class="text-h4 q-mt-none q-mb-md">Your Feed</h4>

      <!-- Tab switcher: Following / Explore -->
      <q-tabs
        v-model="tab"
        class="q-mb-md"
        active-color="primary"
        indicator-color="primary"
        align="left"
      >
        <q-tab v-if="authStore.user" name="following" label="Following" />
        <q-tab name="explore" label="Explore" />
      </q-tabs>

      <q-tab-panels v-model="tab" animated>
        <!-- Following Tab -->
        <q-tab-panel v-if="authStore.user" name="following" class="q-pa-none">

          <!-- Empty state -->
          <q-card v-if="!loading && followingFeed.length === 0" flat bordered class="q-pa-lg text-center">
            <q-icon name="people_outline" size="64px" color="grey-5" />
            <div class="text-h6 q-mt-md text-grey-7">No posts yet</div>
            <div class="text-body2 text-grey-6 q-mt-sm">
              Follow other users to see their cooking activity here!
            </div>
            <q-btn
              color="primary"
              label="Explore Recipes"
              class="q-mt-md"
              @click="tab = 'explore'"
            />
          </q-card>

          <!-- Feed posts -->
          <div v-else class="q-pt-md">
            <PostCard
              v-for="post in followingFeed"
              :key="post.id"
              :post="post"
              @like="handleLike"
              @repost="handleRepost"
              @delete="handleDelete"
            />

            <!-- Load more button -->
            <div v-if="hasMoreFollowing" class="q-mt-md text-center">
              <q-btn
                outline
                color="primary"
                label="Load More"
                @click="loadMoreFollowing"
                :loading="loadingMore"
              />
            </div>
          </div>

          <!-- Loading spinner -->
          <div v-if="loading" class="text-center q-pa-lg">
            <q-spinner-dots color="primary" size="50px" />
          </div>
        </q-tab-panel>

        <!-- Explore Tab -->
        <q-tab-panel name="explore" class="q-pa-none">
          <!-- Empty state -->
          <q-card v-if="!loading && exploreFeed.length === 0" flat bordered class="q-pa-lg text-center">
            <q-icon name="explore" size="64px" color="grey-5" />
            <div class="text-h6 q-mt-md text-grey-7">No posts yet</div>
            <div class="text-body2 text-grey-6 q-mt-sm">
              Be the first to share something!
            </div>
          </q-card>

          <!-- Feed posts -->
          <div v-else class="q-pt-md">
            <PostCard
              v-for="post in exploreFeed"
              :key="post.id"
              :post="post"
              @like="handleLike"
              @repost="handleRepost"
              @delete="handleDelete"
            />

            <!-- Load more button -->
            <div v-if="hasMoreExplore" class="q-mt-md text-center">
              <q-btn
                outline
                color="primary"
                label="Load More"
                @click="loadMoreExplore"
                :loading="loadingMore"
              />
            </div>
          </div>

          <!-- Loading spinner -->
          <div v-if="loading" class="text-center q-pa-lg">
            <q-spinner-dots color="primary" size="50px" />
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </div>

    <!-- Floating Action Button for Creating Posts -->
    <q-page-sticky v-if="authStore.user" position="bottom-right" :offset="[24, 24]">
      <q-btn fab icon="add" color="primary" @click="createPostDialog = true" size="1.2rem" shadow-3 />
    </q-page-sticky>

    <!-- Create Post Dialog -->
    <q-dialog v-model="createPostDialog" position="bottom">
      <div style="width: 100%; max-width: 600px; padding-bottom: env(safe-area-inset-bottom)">
        <CreatePostCard @posted="handlePostCreated" class="q-mb-none" style="border-radius: 24px 24px 0 0;" />
      </div>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useSocialStore } from 'stores/social'
import { useAuthStore } from 'stores/auth'
import { useQuasar } from 'quasar'
import PostCard from 'components/PostCard.vue'
import CreatePostCard from 'components/CreatePostCard.vue'

const socialStore = useSocialStore()
const authStore = useAuthStore()
const $q = useQuasar()

const tab = ref('explore')
const loading = ref(false)
const loadingMore = ref(false)
const createPostDialog = ref(false)

const followingFeed = computed(() => socialStore.followingFeed)
const exploreFeed = computed(() => socialStore.exploreFeed)
const hasMoreFollowing = computed(() => socialStore.hasMoreFollowing)
const hasMoreExplore = computed(() => socialStore.hasMoreExplore)

const handlePostCreated = () => {
  createPostDialog.value = false
  refreshFollowingFeed()
  // Switch to following tab to see the new post
  tab.value = 'following'
}

const loadFollowingFeed = async () => {
  if (!authStore.user) return
  loading.value = true
  try {
    await socialStore.fetchFeed(1)
  } catch (error) {
    console.error('Error loading following feed:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to load feed',
      position: 'top'
    })
  } finally {
    loading.value = false
  }
}

const loadExploreFeed = async () => {
  loading.value = true
  try {
    await socialStore.fetchExploreFeed(1)
  } catch (error) {
    console.error('Error loading explore feed:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to load feed',
      position: 'top'
    })
  } finally {
    loading.value = false
  }
}

const loadMoreFollowing = async () => {
  loadingMore.value = true
  try {
    await socialStore.fetchFeed(socialStore.feedPage + 1)
  } catch (error) {
    console.error('Error loading more:', error)
  } finally {
    loadingMore.value = false
  }
}

const loadMoreExplore = async () => {
  loadingMore.value = true
  try {
    await socialStore.fetchExploreFeed(socialStore.explorePage + 1)
  } catch (error) {
    console.error('Error loading more:', error)
  } finally {
    loadingMore.value = false
  }
}

const refreshFollowingFeed = async () => {
  await socialStore.fetchFeed(1)
}

const handleLike = async (postId) => {
  if (!authStore.user) {
    $q.notify({ color: 'warning', message: 'Please log in to like posts' })
    return
  }
  try {
    await socialStore.likePost(postId)
  } catch (error) {
    console.error('Error liking post:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to like post',
      position: 'top'
    })
  }
}

const handleRepost = async (postId) => {
  if (!authStore.user) {
    $q.notify({ color: 'warning', message: 'Please log in to repost' })
    return
  }
  try {
    await socialStore.repostToFeed(postId)
    $q.notify({
      type: 'positive',
      message: 'Post shared to your feed!',
      position: 'top',
      timeout: 2000
    })
  } catch (error) {
    console.error('Error reposting:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to share post',
      position: 'top'
    })
  }
}

const handleDelete = async (postId) => {
  $q.dialog({
    title: 'Delete Post',
    message: 'Are you sure you want to delete this post?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await socialStore.deletePost(postId)
      $q.notify({
        type: 'positive',
        message: 'Post deleted',
        position: 'top',
        timeout: 2000
      })
    } catch (error) {
      console.error('Error deleting post:', error)
      $q.notify({
        type: 'negative',
        message: 'Failed to delete post',
        position: 'top'
      })
    }
  })
}

watch(() => authStore.authReady, (isReady) => {
  if (isReady) {
    if (authStore.user) {
      tab.value = 'following'
      loadFollowingFeed()
    } else {
      tab.value = 'explore'
    }
    loadExploreFeed()
  }
}, { immediate: true })
</script>
