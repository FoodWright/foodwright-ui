<template>
  <q-page class="q-pa-md" style="max-width: 900px; margin: 0 auto">
    <!-- Loading Spinner -->
    <div v-if="loading.profile" class="text-center q-pa-xl">
      <q-spinner-dots color="primary" size="3em" />
    </div>

    <!-- Error Message -->
    <div v-if="error.profile" class="q-pa-md">
      <q-banner rounded class="bg-red-1 text-red-8">
        <template v-slot:avatar>
          <q-icon name="error" />
        </template>
        <strong>Error fetching profile:</strong> {{ error.profile }}
        <p>This guild member may not exist.</p>
      </q-banner>
    </div>

    <!-- Profile Content -->
    <div v-if="profile" class="row q-col-gutter-lg">
      <!-- Left Column: Profile Card -->
      <div class="col-12 col-md-4">
        <q-card class="bg-grey-2" flat>
          <q-card-section class="text-center">
            <q-avatar size="80px" class="q-mb-md" icon="person" color="primary" text-color="white" />
            <div class="text-h6">{{ profile.username }}</div>
            <div class="text-subtitle1 text-grey-8">
              Member Since: {{ formatJoinDate(profile.created_at) }}
            </div>

            <div class="row justify-center q-mt-md q-gutter-x-lg">
              <div>
                <div class="text-weight-bold text-h6">{{ profile.follower_count }}</div>
                <div class="text-caption text-grey-7 text-uppercase">Followers</div>
              </div>
              <div>
                <div class="text-weight-bold text-h6">{{ profile.following_count }}</div>
                <div class="text-caption text-grey-7 text-uppercase">Following</div>
              </div>
            </div>

            <div v-if="!isMyProfile && authStore.user" class="q-mt-lg">
              <q-btn
                :color="isFollowing ? 'grey-3' : 'primary'"
                :text-color="isFollowing ? 'dark' : 'white'"
                :label="isFollowing ? 'Following' : 'Follow'"
                :icon="isFollowing ? 'check' : 'person_add'"
                unelevated
                rounded
                class="full-width text-weight-bold"
                @click="toggleFollow"
                :loading="followLoading"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Right Column: Activity / Settings -->
      <div class="col-12 col-md-8">
        <!-- === NEW: Tab Layout === -->
        <q-tabs v-model="tab" dense class="text-grey" active-color="primary" indicator-color="primary" align="left"
          narrow-indicator>
          <q-tab name="activity" label="Recent Activity" />
          <q-tab name="badges" label="Badges" icon="military_tech" />
          <q-tab v-if="isMyProfile" name="settings" label="Settings" icon="settings" />
        </q-tabs>
        <q-separator />

        <q-tab-panels v-model="tab" animated>
          <!-- Activity Panel -->
          <q-tab-panel name="activity" class="q-pa-none q-pt-md">
            <h5 class="text-h5 q-mt-none q-mb-md">Recent Activity</h5>
            <div v-if="loading.logs" class="text-center q-pa-md">
              <q-spinner-dots color="primary" size="2em" />
            </div>
            <div v-if="error.logs" class="text-red">
              Error fetching activity: {{ error.logs }}
            </div>

            <div v-if="logs.length === 0 && !loading.logs" class="text-center text-grey-7 q-pa-md">
              <q-icon name="history" size="2em" class="q-mb-sm" />
              <div>No recent activity.</div>
            </div>

            <div v-else>
              <q-card v-for="log in logs" :key="log.log_id" flat bordered class="q-mb-md">
                <q-card-section>
                  <div class="row items-center justify-between">
                    <div>
                      <div class="text-subtitle1 text-weight-bold">
                        Cooked: <router-link :to="`/recipe/${log.recipe_id}`" class="text-primary text-decoration-none">{{ log.recipe_title }}</router-link>
                      </div>
                      <div class="text-caption text-grey-7">{{ formatTimeAgo(log.logged_at) }}</div>
                    </div>
                    <q-rating v-if="log.rating" :model-value="log.rating" size="14px" color="orange" readonly />
                  </div>
                  <div v-if="log.notes" class="q-mt-sm text-body2 text-grey-9 pre-wrap">{{ log.notes }}</div>
                  <q-img v-if="log.image_url" :src="log.image_url" class="q-mt-md rounded-borders shadow-1" :ratio="16/9" fit="cover" />
                </q-card-section>
              </q-card>
            </div>
          </q-tab-panel>

          <!-- Badges Panel -->
          <q-tab-panel name="badges" class="q-pa-none q-pt-md">
            <h5 class="text-h5 q-mt-none q-mb-md">Trophies & Badges</h5>
            <div v-if="profile.badges && profile.badges.length" class="row q-col-gutter-md">
              <div v-for="badge in profile.badges" :key="badge.id" class="col-6 col-sm-4 col-md-3 text-center">
                <div class="cursor-pointer" @click="openZoomDialog(badge)">
                  <q-avatar v-if="badge.icon_url.Valid && badge.icon_url.String.startsWith('http')" size="80px" color="white" class="shadow-1">
                    <q-img :src="badge.icon_url.String" referrerpolicy="no-referrer" fit="contain" />
                  </q-avatar>
                  <q-avatar v-else size="80px" font-size="40px" color="secondary" text-color="white" :icon="badge.icon_url.Valid ? badge.icon_url.String : 'military_tech'" class="shadow-1" />
                  <div class="text-subtitle2 q-mt-sm">{{ badge.name }}</div>
                  <div class="text-caption text-grey-7">{{ formatJoinDate(badge.earned_at.Time) }}</div>
                  <q-tooltip class="bg-black text-body2" :offset="[10, 10]">
                    <div class="text-weight-bold">{{ badge.name }}</div>
                    <div>{{ badge.description }}</div>
                  </q-tooltip>
                </div>
              </div>
            </div>
            <div v-else class="text-center q-pa-xl text-grey-6">
              <q-icon name="military_tech" size="64px" color="grey-4" />
              <div class="text-h6 q-mt-md">No badges earned yet.</div>
            </div>
          </q-tab-panel>

          <!-- Settings Panel -->
          <q-tab-panel name="settings" class="q-pa-none q-pt-md">
            <h5 class="text-h5 q-mt-none q-mb-md">My Settings</h5>
            <q-card flat bordered>
              <q-card-section>
                <div class="text-h6 q-mb-xs">Unit Preference</div>
                <p class="text-body2 text-grey-8">
                  Choose your default measurement system for viewing recipes.
                </p>
                <q-btn-toggle v-if="loggedInUserProfile" v-model="loggedInUserProfile.unit_preference"
                  @update:model-value="onPreferenceChange" spread toggle-color="primary" :options="[
                    { label: 'Imperial (cups, oz)', value: 'imperial' },
                    { label: 'Metric (grams, ml)', value: 'metric' },
                  ]" />
              </q-card-section>
            </q-card>
          </q-tab-panel>
        </q-tab-panels>
        <!-- === END NEW === -->
      </div>
    </div>

    <!-- === NEW: Badge Zoom Dialog === -->
    <q-dialog v-model="showZoomDialog">
      <q-card v-if="zoomedBadge" style="width: 300px">
        <q-card-section class="text-center q-pb-none">
          <!-- Case 1: Image URL -->
          <q-img v-if="
            zoomedBadge.icon_url.Valid &&
            zoomedBadge.icon_url.String.startsWith('http')
          " :src="zoomedBadge.icon_url.String" referrerpolicy="no-referrer" fit="contain"
            style="max-width: 250px; height: 250px" />
          <!-- Case 2: Icon -->
          <q-icon v-else :name="zoomedBadge.icon_url.Valid
              ? zoomedBadge.icon_url.String
              : 'military_tech'
            " color="secondary" size="250px" />
        </q-card-section>

        <q-card-section>
          <div class="text-h6 text-center">{{ zoomedBadge.name }}</div>
          <p class="text-body2 text-center text-grey-8 q-mt-sm">
            {{ zoomedBadge.description }}
          </p>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- === END NEW === -->
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue'; 
import { useRoute } from 'vue-router';
import { useUserStore } from 'stores/user';
import { useAuthStore } from 'stores/auth';
import { useSocialStore } from 'stores/social';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';

const route = useRoute();
const userStore = useUserStore();
const authStore = useAuthStore();
const socialStore = useSocialStore();
const $q = useQuasar();

const profile = ref(null);
const logs = ref([]);
const isFollowing = ref(false);
const followLoading = ref(false);

const { profile: loggedInUserProfile } = storeToRefs(userStore);

const userId = ref(route.params.id);
const tab = ref('activity');

const loading = reactive({ profile: false, logs: false });
const error = reactive({ profile: null, logs: null });

const isMyProfile = computed(() => {
  return authStore.user && authStore.user.uid === userId.value;
});

const showZoomDialog = ref(false);
const zoomedBadge = ref(null);

const openZoomDialog = (badge) => {
  zoomedBadge.value = badge;
  showZoomDialog.value = true;
};

const fetchProfile = async (id) => {
  loading.profile = true;
  error.profile = null;
  try {
    profile.value = await userStore.fetchPublicProfile(id);
  } catch (err) {
    error.profile = err.message;
    console.error(err);
  } finally {
    loading.profile = false;
  }
};

const fetchLogs = async (id) => {
  loading.logs = true;
  error.logs = null;
  try {
    logs.value = await userStore.fetchUserLogs(id);
  } catch (err) {
    error.logs = err.message;
    console.error(err);
  } finally {
    loading.logs = false;
  }
};

const checkFollow = async (id) => {
  if (authStore.user && !isMyProfile.value) {
    try {
      isFollowing.value = await socialStore.checkFollowStatus(id);
    } catch (err) {
      console.error('Error checking follow status:', err);
    }
  }
};

const toggleFollow = async () => {
  followLoading.value = true;
  try {
    if (isFollowing.value) {
      await socialStore.unfollowUser(userId.value);
      isFollowing.value = false;
      if (profile.value) profile.value.follower_count = Math.max(0, profile.value.follower_count - 1);
    } else {
      await socialStore.followUser(userId.value);
      isFollowing.value = true;
      if (profile.value) profile.value.follower_count++;
    }
  } catch (error) {
    console.error('Failed to update follow status:', error);
    $q.notify({
      color: 'negative',
      message: 'Failed to update follow status.'
    });
  } finally {
    followLoading.value = false;
  }
};

const onPreferenceChange = async (value) => {
  try {
    await userStore.updatePreferences({ unit_preference: value });
    $q.notify({
      color: 'positive',
      icon: 'check',
      message: 'Preference saved!',
    });
  } catch (err) {
    console.error('Failed to save preference:', err);
    $q.notify({
      color: 'negative',
      message: `Failed to save: ${err.message}`,
    });
    loggedInUserProfile.value.unit_preference =
      value === 'metric' ? 'imperial' : 'metric';
  }
};

const formatJoinDate = (isoString) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTimeAgo = (isoString) => {
  const date = new Date(isoString);
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  return Math.floor(seconds) + ' seconds ago';
};

onMounted(() => {
  fetchProfile(userId.value);
  fetchLogs(userId.value);
  checkFollow(userId.value);
});

watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      userId.value = newId;
      tab.value = 'activity'; 
      fetchProfile(newId);
      fetchLogs(newId);
      checkFollow(newId);
    }
  }
);
</script>

<style scoped>
.text-h5 {
  font-weight: 600;
}

.text-primary {
  color: var(--q-primary) !important;
  text-decoration: none;
}

.text-primary:hover {
  text-decoration: underline;
}

.rounded-borders {
  border-radius: 12px;
}
</style>
