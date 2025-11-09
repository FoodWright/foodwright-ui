<template>
  <q-page class="q-pa-md" style="max-width: 700px; margin: 0 auto">
    <h4 class="text-h4 q-mt-none q-mb-md">Submit Your Recipe</h4>
    <p class="text-body1 text-grey-8 q-mb-lg">
      Share your craft with the Guild. Submissions will be reviewed by a Master
      Foodwright. If approved, you'll earn a large XP reward!
    </p>

    <q-form @submit="handleSubmit" class="q-gutter-md">
      <q-card flat bordered>
        <q-card-section>
          <q-input v-model="form.title" label="Recipe Title *"
            :rules="[(val) => (val && val.length > 0) || 'Title is required']" lazy-rules outlined />

          <q-input v-model="form.description" label="Description *" type="textarea" :rules="[
            (val) => (val && val.length > 0) || 'Description is required',
          ]" lazy-rules outlined autogrow class="q-mt-md" />

          <q-input v-model="form.tags" label="Tags (comma separated, e.g. baking, bread)"
            hint="Enter a few tags to help categorize your recipe." outlined class="q-mt-md" />

          <q-input v-model.number="form.xp" label="Suggested XP *" type="number" :rules="[
            (val) => (val && val > 0) || 'Suggest a fair XP value',
            (val) => val <= 100 || 'Max suggested XP is 100',
          ]" lazy-rules outlined class="q-mt-md" hint="How much XP should this be worth? (10-100)" />
        </q-card-section>
        <q-separator />
        <q-card-actions class="q-pa-md">
          <q-btn label="Submit for Review" type="submit" color="primary" size="lg" class="full-width"
            :loading="isSubmitting" />
        </q-card-actions>
      </q-card>
    </q-form>
  </q-page>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useAuthStore } from 'stores/auth';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const $q = useQuasar();
const router = useRouter();

const isSubmitting = ref(false);
const form = reactive({
  title: '',
  description: '',
  tags: '',
  xp: 10,
});

// --- API Fetch Helper ---
const API_URL = 'http://localhost:8080/api';
const fetchWithAuth = async (endpoint, options = {}) => {
  const token = authStore.token;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      errData.message || `Server responded with ${response.status}`
    );
  }
  return response.json();
};
// --- End API Helper ---

const handleSubmit = async () => {
  isSubmitting.value = true;
  try {
    // Convert tags string to an array
    const tagsArray = form.tags
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0);

    const newRecipe = {
      title: form.title,
      description: form.description,
      xp: form.xp,
      tags: tagsArray,
    };

    await fetchWithAuth('/recipes', {
      method: 'POST',
      body: JSON.stringify(newRecipe),
    });

    $q.notify({
      color: 'positive',
      icon: 'check_circle',
      message: 'Recipe submitted for review!',
      timeout: 3000,
    });

    // Push user to their "My Submissions" page after success
    router.push('/my-submissions');
  } catch (err) {
    console.error('Failed to submit recipe:', err);
    $q.notify({
      color: 'negative',
      message: `Submission failed: ${err.message}`,
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>
