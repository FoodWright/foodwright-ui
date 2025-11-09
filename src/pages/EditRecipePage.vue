<template>
  <q-page class="q-pa-md" style="max-width: 700px; margin: 0 auto">
    <h4 class="text-h4 q-mt-none q-mb-md">
      {{ isEditMode ? 'Edit Private Recipe' : 'Create Private Recipe' }}
    </h4>
    <p class="text-body1 text-grey-8 q-mb-lg">
      This recipe will be saved to your private cookbook and will not be
      submitted to the Guild.
    </p>

    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner-dots color="primary" size="3em" />
    </div>

    <div v-if="error" class="q-pa-md">
      <q-banner rounded class="bg-red-1 text-red-8">
        <template v-slot:avatar>
          <q-icon name="error" />
        </template>
        <strong>Error:</strong> {{ error }}
      </q-banner>
    </div>

    <q-form v-if="!loading && !error" @submit="handleSubmit" class="q-gutter-md">
      <!-- Section 1: Basic Info -->
      <q-card flat bordered>
        <q-card-section>
          <div class="text-h6 q-mb-sm">Basic Info</div>
          <q-input v-model="form.title" label="Recipe Title *"
            :rules="[(val) => (val && val.length > 0) || 'Title is required']" lazy-rules outlined />

          <q-input v-model="form.description" label="Description" type="textarea" outlined autogrow class="q-mt-md" />

          <q-input v-model="form.tags" label="Tags (comma separated, e.g. personal, quick)"
            hint="Enter tags to help you categorize." outlined class="q-mt-md" />

          <!-- XP is not relevant for private recipes -->
          <q-input v-model.number="form.xp" type="number" label="XP" outlined class="q-mt-md" readonly disable
            hint="XP is not applicable for private recipes." />
        </q-card-section>
      </q-card>

      <!-- Section 2: Ingredients -->
      <q-card flat bordered>
        <q-card-section>
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-h6">Ingredients</div>
            <q-btn label="Add Ingredient" @click="addIngredient" color="primary" flat icon="add" />
          </div>

          <div v-for="(ingredient, index) in form.ingredients" :key="index"
            class="row items-center q-gutter-sm q-mb-sm">
            <q-input v-model="ingredient.quantity" label="Quantity (e.g. 1 cup)" outlined dense class="col" />
            <q-input v-model="ingredient.name" label="Name (e.g. Flour)" outlined dense class="col-6" />
            <q-btn @click="removeIngredient(index)" flat round dense color="negative" icon="remove_circle_outline" />
          </div>
          <div v-if="form.ingredients.length === 0" class="text-grey-7 q-pa-md text-center">
            Add your first ingredient.
          </div>
        </q-card-section>
      </q-card>

      <!-- Section 3: Instructions -->
      <q-card flat bordered>
        <q-card-section>
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-h6">Instructions</div>
            <q-btn label="Add Step" @click="addInstruction" color="primary" flat icon="add" />
          </div>

          <div v-for="(instruction, index) in form.instructions" :key="index"
            class="row items-center q-gutter-sm q-mb-sm">
            <div class="text-h6 text-grey-5 q-mr-sm">{{ index + 1 }}.</div>
            <q-input v-model="instruction.step" :label="`Step ${index + 1}`" type="textarea" outlined dense autogrow
              class="col" />
            <q-btn @click="removeInstruction(index)" flat round dense color="negative" icon="remove_circle_outline" />
          </div>
          <div v-if="form.instructions.length === 0" class="text-grey-7 q-pa-md text-center">
            Add your first instruction.
          </div>
        </q-card-section>
      </q-card>

      <!-- Submit Button -->
      <q-btn :label="isEditMode ? 'Save Changes' : 'Save to Cookbook'" type="submit" color="primary" size="lg"
        class="full-width q-mt-md" :loading="isSubmitting" />
    </q-form>
  </q-page>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue';
import { useAuthStore } from 'stores/auth';
import { useQuasar } from 'quasar';
import { useRouter, useRoute } from 'vue-router';

const authStore = useAuthStore();
const $q = useQuasar();
const router = useRouter();
const route = useRoute();

const isSubmitting = ref(false);
const loading = ref(false);
const error = ref(null);
const recipeId = ref(route.params.id || null);

const isEditMode = computed(() => !!recipeId.value);

const form = reactive({
  title: '',
  description: '',
  tags: '',
  xp: 0, // Not used for private
  ingredients: [],
  instructions: [],
});

// --- Ingredients Functions ---
const addIngredient = () => {
  form.ingredients.push({ quantity: '', name: '' });
};
const removeIngredient = (index) => {
  form.ingredients.splice(index, 1);
};

// --- Instructions Functions ---
const addInstruction = () => {
  form.instructions.push({ step: '' });
};
const removeInstruction = (index) => {
  form.instructions.splice(index, 1);
};

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

const fetchRecipeForEdit = async () => {
  if (!isEditMode.value) return;
  loading.value = true;
  error.value = null;
  try {
    const recipe = await fetchWithAuth(`/recipes/${recipeId.value}`);
    // Security check: Make sure this user owns this recipe
    if (recipe.submitted_by_user_id.String !== authStore.user.uid) {
      throw new Error("You do not have permission to edit this recipe.");
    }
    // Load data into the form
    form.title = recipe.title;
    form.description = recipe.description;
    form.tags = (recipe.tags || []).join(', ');
    form.xp = recipe.xp;
    form.ingredients = recipe.ingredients || [];
    form.instructions = recipe.instructions || [];
  } catch (err) {
    console.error('Failed to fetch recipe for edit:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  isSubmitting.value = true;
  try {
    const tagsArray = form.tags
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0);

    const cleanIngredients = form.ingredients.filter(i => i.name && i.name.trim() !== '');
    const cleanInstructions = form.instructions.filter(i => i.step && i.step.trim() !== '');

    const payload = {
      title: form.title,
      description: form.description,
      tags: tagsArray,
      ingredients: cleanIngredients,
      instructions: cleanInstructions,
    };

    if (isEditMode.value) {
      // --- UPDATE (PUT) ---
      await fetchWithAuth(`/recipes/private/${recipeId.value}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      $q.notify({
        color: 'positive',
        message: 'Recipe updated!',
      });
    } else {
      // --- CREATE (POST) ---
      await fetchWithAuth('/recipes/private', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      $q.notify({
        color: 'positive',
        message: 'Recipe saved to your private cookbook!',
      });
    }

    router.push('/my-cookbook?tab=private');

  } catch (err) {
    console.error('Failed to save recipe:', err);
    $q.notify({
      color: 'negative',
      message: `Failed to save: ${err.message}`,
    });
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  fetchRecipeForEdit();
});

</script>
