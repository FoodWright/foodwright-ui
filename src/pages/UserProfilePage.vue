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
                  <q-item-label class="text-weight-bold">{{ profile.rank }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="trending_up" />
                </q-item-section>
                <q-item-section>
                  <q-item-label overline>XP</q-item-label>
                  <q-item-label class="text-weight-bold">{{ profile.xp }}</q-item-label>
                </q-item-section>
              </q-item>

              <!-- === MODIFIED: Badges Section === -->
              <q-item>
                <q-item-section avatar>
                  <q-icon name="military_tech" />
                </q-item-section>
                <q-item-section>
                  <q-item-label overline>Badges</q-item-label>
                  <q-item-label v-if="profile.badges && profile.badges.length">
                    <q-chip v-for="badge in profile.badges" :key="badge.id" color="secondary" text-color="white"
                      size="sm" :label="badge.name" class="q-ma-xs">
                      <!-- === FIX: Use the working pattern from SiteAdminPage === -->
                      <template v-slot:prepend>
                        <q-avatar v-if="badge.icon_url.Valid">
                          <!-- Case 1: Icon is a URL -->
                          <q-img :src="badge.icon_url.String" v-if="badge.icon_url.String.startsWith('http')" />
                          <!-- Case 2: Icon is a FontAwesome name -->
                          <q-icon :name="badge.icon_url.String" v-else />
                        </q-avatar>
                        <!-- Case 3: No Icon (fallback) -->
                        <q-avatar v-else icon="military_tech" color="transparent" text-color="white" />
                      </template>
                      <!-- === END FIX === -->

                      <q-tooltip class="bg-black text-body2" :offset="[10, 10]">
                        <div class="text-weight-bold">{{ badge.name }}</div>
                        <div>{{ badge.description }}</div>
                        <div class="text-caption q-mt-sm">
                          Earned: {{ formatJoinDate(badge.earned_at.Time) }}
                        </div>
                      </q-tooltip>
                    </q-chip>
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

      <!-- Right Column: Recent Activity -->
      <div class="col-12 col-md-8">
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
                <router-link :to="`/recipe/${log.recipe_id}`" class="text-weight-bold text-primary">
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
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const API_URL = import.meta.env.VITE_API_SERVER + '/api' || 'http://localhost:8080/api';
const userId = ref(route.params.id);

const profile = ref(null);
const logs = ref([]);
const loading = reactive({ profile: false, logs: false });
const error = reactive({ profile: null, logs: null });

const fetchPublic = async (endpoint) => {
  const response = await fetch(`${API_URL}${endpoint}`);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      errData.message || `Server responded with ${response.status}`
    );
  }
  return response.json();
};

const fetchProfile = async (id) => {
  loading.profile = true;
  error.profile = null;
  profile.value = null;
  try {
    const data = await fetchPublic(`/profile/${id}`);
    profile.value = data;
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
  logs.value = [];
  try {
    const data = await fetchPublic(`/profile/${id}/logs`);
    logs.value = data || [];
  } catch (err) {
    error.logs = err.message;
    console.error(err);
  } finally {
    loading.logs = false;
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
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
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
