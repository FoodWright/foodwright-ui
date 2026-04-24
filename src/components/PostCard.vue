<template>
  <q-card flat bordered class="q-mb-md post-card">
    <!-- Repost Header -->
    <q-card-section v-if="post.reposted_by" class="q-py-xs q-px-md bg-grey-1 text-grey-7 text-caption row items-center">
      <q-icon name="repeat" size="14px" class="q-mr-xs" />
      <span class="text-weight-bold">{{ post.reposted_by }}</span> reposted
    </q-card-section>

    <q-card-section>
      <!-- User header -->
      <div class="row items-center no-wrap">
        <q-avatar size="42px" color="primary" text-color="white" class="cursor-pointer" @click="goToProfile">
          <q-img v-if="post.user_photo" :src="post.user_photo" />
          <span v-else>{{ post.username ? post.username[0].toUpperCase() : '?' }}</span>
        </q-avatar>
        <div class="q-ml-sm overflow-hidden">
          <div class="row items-center no-wrap">
            <router-link :to="`/user/${post.user_id}`" class="text-subtitle1 text-weight-bold text-dark no-decoration ellipsis">
              {{ post.username }}
            </router-link>
            <q-badge color="orange-2" text-color="orange-9" label="Pro" class="q-ml-xs text-weight-bold" v-if="post.user_rank === 'Pro'" />
            <q-btn 
              v-if="!isOwnPost && authStore.user" 
              flat dense rounded 
              :color="isFollowing ? 'grey-6' : 'primary'" 
              :label="isFollowing ? 'Following' : 'Follow'" 
              class="q-ml-sm text-caption text-weight-bold" 
              style="padding: 2px 8px; min-height: 24px;"
              @click="handleFollow"
            />
          </div>
          <div class="text-caption text-grey-7">
            {{ post.user_rank }} • {{ formatDate(post.created_at) }}
          </div>
        </div>
        <q-space />
        <!-- Delete button if own post -->
        <q-btn v-if="isOwnPost && post.post_type !== 'cook_log'" flat round dense icon="more_horiz" color="grey-7">
          <q-menu auto-close>
            <q-list style="min-width: 100px">
              <q-item clickable @click="handleDelete" class="text-negative">
                <q-item-section avatar>
                  <q-icon name="delete" />
                </q-item-section>
                <q-item-section>Delete</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>

      <!-- Post content based on type -->
      <div v-if="post.post_type === 'cook_log'" class="q-mt-md">
        <div class="text-body1">
          <span class="text-weight-medium">Cooked:</span>
          <router-link :to="`/recipe/${post.recipe_id}-${post.recipe_slug}`" class="text-primary text-weight-bold q-ml-xs">
            {{ post.recipe_title }}
          </router-link>
        </div>
        <q-rating v-if="post.rating" :model-value="post.rating" readonly size="18px" color="orange" icon="star" class="q-mt-xs" />
        <p v-if="post.notes" class="text-body2 text-grey-9 q-mt-sm pre-wrap">{{ post.notes }}</p>
      </div>

      <div v-else-if="post.post_type === 'recipe_share'" class="q-mt-md">
        <div class="text-body1">
          <span class="text-weight-medium">Shared:</span>
          <router-link :to="`/recipe/${post.recipe_id}-${post.recipe_slug}`" class="text-primary text-weight-bold q-ml-xs">
            {{ post.recipe_title }}
          </router-link>
        </div>
      </div>

      <div v-else-if="post.post_type === 'quick_post'" class="q-mt-md">
        <div v-if="post.recipe_id" class="q-mb-sm">
           <q-badge outline color="primary" class="q-pa-xs">
             <q-icon name="restaurant" size="14px" class="q-mr-xs" />
             Cooking: {{ post.recipe_title }}
           </q-badge>
        </div>
        <div v-else-if="post.external_url" class="q-mb-sm">
           <q-btn 
             outline 
             color="secondary" 
             size="sm" 
             icon="link" 
             :label="'Cooking: ' + getDomain(post.external_url)" 
             :href="post.external_url" 
             target="_blank" 
             no-caps
           />
        </div>
        <p class="text-body1 text-grey-9 pre-wrap">{{ post.content }}</p>
      </div>

      <!-- Post Image (if any) -->
      <div v-if="post.image_url || (post.post_type !== 'quick_post' && post.recipe_image)" class="q-mt-md rounded-borders overflow-hidden border-light">
        <q-img :src="post.image_url || post.recipe_image" :ratio="16 / 9" fit="cover" class="cursor-pointer" @click="viewImage" />
      </div>

      <!-- Engagement bar -->
      <div class="row q-gutter-x-sm q-mt-md">
        <q-btn flat dense rounded :color="post.is_liked ? 'red' : 'grey-7'" :icon="post.is_liked ? 'favorite' : 'favorite_border'"
          :label="post.like_count > 0 ? String(post.like_count) : ''" @click="emit('like', post.id)" class="engagement-btn" />
        
        <q-btn flat dense rounded color="grey-7" icon="chat_bubble_outline" label="" class="engagement-btn" v-if="post.recipe_id" :to="`/recipe/${post.recipe_id}-${post.recipe_slug}#comments`" />

        <q-btn flat dense rounded color="grey-7" icon="repeat" :label="post.repost_count > 0 ? String(post.repost_count) : ''"
          @click="emit('repost', post.id)" class="engagement-btn" />
        
        <q-space />
        
        <q-btn v-if="post.recipe_id" flat color="primary" dense label="View Recipe" icon-right="chevron_right"
          :to="`/recipe/${post.recipe_id}-${post.recipe_slug}`" no-caps />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAuthStore } from 'stores/auth'
import { useSocialStore } from 'stores/social'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'vue-router'

const props = defineProps({
  post: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['like', 'repost', 'delete'])
const router = useRouter()
const authStore = useAuthStore()
const socialStore = useSocialStore()

const isOwnPost = computed(() => {
  return authStore.user && authStore.user.uid === props.post.user_id
})

const isFollowing = computed(() => {
  return socialStore.followStatus[props.post.user_id] || false
})

const handleFollow = async () => {
  if (!authStore.user) return
  try {
    if (isFollowing.value) {
      await socialStore.unfollowUser(props.post.user_id)
    } else {
      await socialStore.followUser(props.post.user_id)
    }
  } catch (error) {
    console.error('Error toggling follow:', error)
  }
}

onMounted(() => {
  if (authStore.user && !isOwnPost.value && socialStore.followStatus[props.post.user_id] === undefined) {
    socialStore.checkFollowStatus(props.post.user_id)
  }
})

const formatDate = (dateString) => {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  } catch {
    return dateString
  }
}

const handleDelete = () => {
  emit('delete', props.post.id)
}

const goToProfile = () => {
  router.push(`/user/${props.post.user_id}`)
}

const getDomain = (url) => {
  try {
    const domain = new URL(url).hostname
    return domain.replace('www.', '')
  } catch {
    return 'External Recipe'
  }
}

const viewImage = () => {
  // Could implement a light-box here
}
</script>

<style scoped>
.post-card {
  border-radius: 12px;
  transition: transform 0.2s;
}
.post-card:hover {
  /* box-shadow: 0 4px 15px rgba(0,0,0,0.05) !important; */
}
.no-decoration {
  text-decoration: none;
}
.no-decoration:hover {
  text-decoration: underline;
}
.rounded-borders {
  border-radius: 12px;
}
.border-light {
  border: 1px solid #f0f0f0;
}
.pre-wrap {
  white-space: pre-wrap;
}
.engagement-btn {
  padding: 4px 12px;
}
</style>
