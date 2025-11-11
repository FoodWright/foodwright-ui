<template>
  <q-page class="q-pa-md" style="max-width: 700px; margin: 0 auto">
    <h4 class="text-h4 q-mt-none q-mb-md">Submit Your Recipe</h4>
    <p class="text-body1 text-grey-8 q-mb-lg">
      Share your craft with the Guild. Submissions will be reviewed by a Master
      Foodwright. If approved, you'll earn a large XP reward!
    </p>

    <q-form @submit="handleSubmit" class="q-gutter-md">
      <!-- Section 1: Basic Info -->
      <q-card flat bordered>
        <q-card-section>
          <div class="text-h6 q-mb-sm">Basic Info</div>
          <q-input v-model="form.title" label="Recipe Title *"
            :rules="[(val) => (val && val.length > 0) || 'Title is required']" lazy-rules outlined />

          <q-input v-model="form.description" label="Description *" type="textarea" :rules="[
            (val) => (val && val.length > 0) || 'Description is required',
          ]" lazy-rules outlined autogrow class="q-mt-md" />

          <!-- === NEW: q-file component === -->
          <div class="text-h6 q-mb-sm q-mt-md">Recipe Image</div>
          <q-file v-model="imageFile" @update:model-value="handleFileUpload" @clear="handleRemoveImage"
            label="Upload an image (Max 5MB)" accept="image/*" max-file-size="5242880" @rejected="handleUploadError"
            outlined :loading="isUploading">
            <template v-slot:prepend>
              <q-icon name="image" />
            </template>
            <template v-slot:append>
              <q-icon v-if="imageFile" name="cancel" @click.stop.prevent="handleRemoveImage" class="cursor-pointer" />
            </template>
          </q-file>

          <!-- Image Preview -->
          <q-img v-if="form.image_url" :src="form.image_url" ratio="1.9" class="rounded-borders q-mt-md">
            <q-btn flat round color="white" icon="delete" class="absolute-top-right q-ma-xs" @click="handleRemoveImage">
              <q-tooltip>Remove Image</q-tooltip>
            </q-btn>
          </q-img>
          <!-- === -->

          <q-input v-model="form.tags" label="Tags (comma separated, e.g. baking, bread)"
            hint="Enter a few tags to help categorize your recipe." outlined class="q-mt-md" />

          <q-input v-model.number="form.xp" label="Suggested XP *" type="number" :rules="[
            (val) => (val && val > 0) || 'Suggest a fair XP value',
            (val) => val <= 100 || 'Max suggested XP is 100',
          ]" lazy-rules outlined class="q-mt-md" hint="How much XP should this be worth? (10-100)" />
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
      <q-btn label="Submit for Review" type="submit" color="primary" size="lg" class="full-width q-mt-md"
        :loading="isSubmitting" />
    </q-form>
  </q-page>
</template>

<script setup>
import { reactive, ref, getCurrentInstance } from 'vue';
import { useAuthStore } from 'stores/auth';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';

const authStore = useAuthStore();
const $q = useQuasar();
const router = useRouter();

const { proxy } = getCurrentInstance();
const $firebaseStorage = proxy.$firebaseStorage;

const isSubmitting = ref(false);
const isUploading = ref(false); // <-- NEW for q-file
const imageFile = ref(null); // <-- NEW for q-file

const form = reactive({
  title: '',
  description: '',
  tags: '',
  xp: 10,
  ingredients: [{ quantity: '', name: '' }],
  instructions: [{ step: '' }],
  image_url: '',
});

// ... (ingredients/instructions functions are unchanged) ...
const addIngredient = () => {
  form.ingredients.push({ quantity: '', name: '' });
};
const removeIngredient = (index) => {
  form.ingredients.splice(index, 1);
};
const addInstruction = () => {
  form.instructions.push({ step: '' });
};
const removeInstruction = (index) => {
  form.instructions.splice(index, 1);
};


// --- API Fetch Helper ---
const API_URL = import.meta.env.VITE_API_SERVER + '/api' || 'http://localhost:8080/api';
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

// --- NEW: Firebase Uploader Functions ---
const handleFileUpload = (file) => {
  if (!file) {
    return;
  }
  if (!authStore.user) {
    $q.notify({ color: 'negative', message: 'You must be logged in to upload images.' });
    imageFile.value = null;
    return;
  }

  isUploading.value = true;
  const fileExt = file.name.split('.').pop();
  const fileName = `${authStore.user.uid}-${Date.now()}.${fileExt}`;
  const sRef = storageRef($firebaseStorage, `recipe_images/${fileName}`);

  const uploadTask = uploadBytesResumable(sRef, file);

  uploadTask.on(
    'state_changed',
    () => { /* Handle progress */ },
    (error) => {
      console.error('Upload failed:', error);
      $q.notify({ color: 'negative', message: 'Image upload failed.' });
      isUploading.value = false;
      imageFile.value = null;
    },
    async () => {
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      form.image_url = downloadURL; // <-- SET THE URL
      $q.notify({ color: 'positive', message: 'Image uploaded!' });
      isUploading.value = false;
    }
  );
};

const handleUploadError = () => {
  $q.notify({ color: 'negative', message: 'Image upload failed. File may be too large or not an image.' });
};

const handleRemoveImage = () => {
  form.image_url = '';
  imageFile.value = null;
  // We don't delete from storage, just clear the URL.
  $q.notify({ color: 'info', message: 'Image selection cleared.' });
};
// --- End Uploader Functions ---

const handleSubmit = async () => {
  if (isUploading.value) {
    $q.notify({ color: 'warning', message: 'Please wait for image to finish uploading.' });
    return;
  }

  isSubmitting.value = true;
  try {
    const tagsArray = form.tags
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0);

    const cleanIngredients = form.ingredients.filter(i => i.name && i.name.trim() !== '');
    const cleanInstructions = form.instructions.filter(i => i.step && i.step.trim() !== '');

    const newRecipe = {
      title: form.title,
      description: form.description,
      xp: form.xp,
      tags: tagsArray,
      ingredients: cleanIngredients,
      instructions: cleanInstructions,
      image_url: form.image_url, // <-- NEW
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
