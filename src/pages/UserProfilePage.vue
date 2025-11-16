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
            <div class-="text-subtitle1 text-grey-8">
              Member Since: {{ formatJoinDate(profile.created_at) }}
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <q-list dense>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="badge" />
                </q-item-section>
                <q-item-section>
                  <q-item-label overline>Rank</q-item-label>
                  <q-item-label class="text-weight-bold">{{
                    profile.rank
                    }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="trending_up" />
                </q-item-section>
                <q-item-section>
                  <q-item-label overline>XP</q-item-label>
                  <q-item-label class="text-weight-bold">{{
                    profile.xp
                    }}</q-item-label>
                </q-item-section>
              </q-item>

              <!-- === MODIFIED: Badges Section === -->
              <q-item>
                <q-item-section avatar>
                  <q-icon name="military_tech" />
                </q-item-section>
                <q-item-section>
                  <q-item-label overline>Badges</q-item-label>
                  <q-item-label v-if="profile.badges && profile.badges.length" class="row items-center q-gutter-sm">
                    <!-- === MODIFIED: Refactored Badge Logic === -->
                    <div v-for="badge in profile.badges" :key="badge.id" class="badge-avatar-wrapper cursor-pointer"
                      @click="openZoomDialog(badge)">
                      <!-- Case 1: It's an HTTP URL (render <q-img> inside) -->
                      <q-avatar v-if="
                        badge.icon_url.Valid &&
                        badge.icon_url.String.startsWith('http')
                      " size="36px" color="white">
                        <q-img :src="badge.icon_url.String" referrerpolicy="no-referrer" fit="contain"
                          style="height: 36px" />
                      </q-avatar>

                      <!-- Case 2: It's a FontAwesome icon or fallback -->
                      <q-avatar v-else size="36px" font-size="20px" color="secondary" text-color="white" :icon="badge.icon_url.Valid
                          ? badge.icon_url.String
                          : 'military_tech'
                        ">
                      </q-avatar>

                      <!-- Tooltip (applied to the wrapper div) -->
                      <q-tooltip class="bg-black text-body2" :offset="[10, 10]">
                        <div class="text-weight-bold">{{ badge.name }}</div>
                        <div>{{ badge.description }}</div>
                        <div class="text-caption q-mt-sm">
                          Earned: {{ formatJoinDate(badge.earned_at.Time) }}
                        </div>
                        <div class="text-caption text-italic q-mt-xs">
                          Click to zoom
                        </div>
                      </q-tooltip>
                    </div>
                    <!-- === END MODIFICATION === -->
                  </q-item-label>
                  <q-item-label v-else class="text-caption text-grey-7">
                    No badges earned yet.
                  </q-item-label>
                </q-item-section>
              </q-item>
              <!-- === END MODIFICATION === -->
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <!-- Right Column: Activity / Settings -->
      <div class="col-12 col-md-8">
        <!-- === NEW: Tab Layout === -->
        <q-tabs v-model="tab" dense class="text-grey" active-color="primary" indicator-color="primary" align="left"
          narrow-indicator>
          <q-tab name="activity" label="Recent Activity" />
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

            <q-list v-else separator>
              <q-item v-for="log in logs" :key="log.log_id" class="q-py-md">
                <q-item-section avatar>
                  <q-icon name="menu_book" color="primary" size="md" />
                </q-item-section>

                <q-item-section>
                  <q-item-label>
                    Logged a cook for
                    <router-link :to="`/recipe/${log.recipe_id}-${log.recipe_slug}`"
                      class="text-weight-bold text-primary">
                      {{ log.recipe_title }}
                    </router-link>
                  </q-item-label>

                  <q-item-label v-if="log.rating" class="q-mt-xs">
                    <q-rating :model-value="log.rating" color="orange" icon="star" size="xs" readonly />
                  </q-item-label>

                  <q-item-label v-if="log.notes" caption class="q-mt-xs text-italic">
                    "{{ log.notes }}"
                  </q-item-label>

                  <q-item-label caption class="q-mt-sm">
                    {{ formatTimeAgo(log.logged_at) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
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
import { ref, reactive, onMounted, watch, computed } from 'vue'; // <-- ADDED computed
import { useRoute } from 'vue-router';
import { useUserStore } from 'stores/user';
import { useAuthStore } from 'stores/auth'; // <-- NEW
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar'; // <-- NEW

const route = useRoute();
const userStore = useUserStore();
const authStore = useAuthStore(); // <-- NEW
const $q = useQuasar(); // <-- NEW
// --- MODIFIED: Use local state ---
const profile = ref(null);
const logs = ref([]);
// Get the LOGGED IN user's profile for settings
const { profile: loggedInUserProfile } = storeToRefs(userStore);
// ---

const userId = ref(route.params.id);
const tab = ref('activity'); // <-- NEW

const loading = reactive({ profile: false, logs: false });
const error = reactive({ profile: null, logs: null });

// --- NEW: Check if this is the logged-in user's profile ---
const isMyProfile = computed(() => {
  return authStore.user && authStore.user.uid === userId.value;
});
// ---

// --- NEW: Badge Zoom State ---
const showZoomDialog = ref(false);
const zoomedBadge = ref(null);

const openZoomDialog = (badge) => {
  zoomedBadge.value = badge;
  showZoomDialog.value = true;
};
// ---

// --- MODIFIED: Use local state ---
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
// ---

// --- NEW: Handle preference change ---
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
    // Revert on failure
    loggedInUserProfile.value.unit_preference =
      value === 'metric' ? 'imperial' : 'metric';
  }
};
// ---

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
});

watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      userId.value = newId;
      tab.value = 'activity'; // Reset to first tab on nav
      fetchProfile(newId);
      fetchLogs(newId);
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
</style>
