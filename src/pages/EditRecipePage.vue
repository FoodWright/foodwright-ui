<template>
  <q-page class="q-pa-md" style="max-width: 700px; margin: 0 auto">
    <div class="row items-center justify-between q-mb-md">
      <h4 class="text-h4 q-mt-none q-mb-none">
        {{ isEditMode ? 'Edit Private Recipe' : 'Create Private Recipe' }}
      </h4>
    </div>
    <p class="text-body1 text-grey-8 q-mb-lg">
      This recipe will be saved to your private cookbook and will not be
      submitted to the Guild unless you choose to.
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

          <div class="text-h6 q-mb-sm q-mt-md">Recipe Image</div>
          <q-file v-model="imageFile" @update:model-value="handleFileUpload" @clear="handleRemoveImage"
            label="Upload an image (Max 5MB)" accept="image/*" max-file-size="5242880" @rejected="handleUploadError"
            outlined :loading="isUploading">
            <template v-slot:prepend>
              <q-icon name="image" />
            </template>
            <template v-slot:append>
              <q-icon v-if="imageFile || form.image_url" name="cancel" @click.stop.prevent="handleRemoveImage"
                class="cursor-pointer" />
            </template>
          </q-file>

          <q-img v-if="form.image_url" :src="form.image_url" ratio="1.9" class="rounded-borders q-mt-md">
            <q-btn flat round color="white" icon="delete" class="absolute-top-right q-ma-xs" @click="handleRemoveImage">
              <q-tooltip>Remove Image</q-tooltip>
            </q-btn>
          </q-img>

          <!-- === MODIFIED: Tags Input === -->
          <q-select v-model="form.tags" label="Tags" hint="Select existing tags or type to create new ones." outlined
            multiple use-chips use-input @new-value="handleCreateTag" :options="availableTags" class="q-mt-md" />
          <!-- === END MODIFICATION === -->

          <q-input v-model.number="form.xp" type="number" label="XP" outlined class="q-mt-md" readonly disable
            hint="XP (10-100) will be assigned if you submit to the Guild." />
        </q-card-section>
      </q-card>

      <!-- Section 2: Ingredients -->
      <q-card flat bordered>
        <q-card-section>
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-h6">Ingredients</div>
            <div>
              <!-- === MODIFIED: Added two buttons === -->
              <q-btn label="Add Header" @click="addHeader" color="grey-7" flat icon="title" dense>
                <q-tooltip>Add a section header (e.g. "Filling")</q-tooltip>
              </q-btn>
              <q-btn label="Add Ingredient" @click="addIngredient" color="primary" flat icon="add" dense />
            </div>
          </div>

          <div v-for="(ingredient, index) in form.ingredients" :key="index"
            class="row items-center q-gutter-sm q-mb-sm">

            <!-- Case 1: Ingredient -->
            <template v-if="ingredient.type === 'ingredient' || !ingredient.type">
              <!-- Added !ingredient.type for backward compatibility before migration -->
              <q-input v-model="ingredient.quantity" label="Quantity (e.g. 1 cup)" outlined dense class="col" />
              <q-input v-model="ingredient.name" label="Name (e.g. Flour)" outlined dense class="col-6" />
            </template>

            <!-- Case 2: Header -->
            <template v-if="ingredient.type === 'header'">
              <q-input v-model="ingredient.name" label="Section Header (e.g. Filling)" outlined dense class="col"
                input-class="text-weight-bold text-primary" />
            </template>
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

      <!-- Action Buttons -->
      <div class="row q-gutter-md q-mt-md">
        <q-btn :label="isEditMode ? 'Save Changes' : 'Save to Cookbook'" type="submit" color="primary" size="lg"
          class="col" :loading="isSubmitting" />

        <q-btn v-if="isEditMode && form.status === 'private'" label="Submit to Guild" @click="handleSubmitToGuild"
          color="positive" outline size="lg" class="col" :loading="isSubmittingGuild" icon="fas fa-shield-alt">
          <q-tooltip>Submit this recipe for Guild review. It will become public if
            approved.</q-tooltip>
        </q-btn>
      </div>
    </q-form>
  </q-page>
</template>

<script setup>
import { reactive, ref, onMounted, computed, getCurrentInstance } from 'vue';
import { useAuthStore } from 'stores/auth';
import { useRecipeStore } from 'stores/recipes'; // <-- NEW
import { storeToRefs } from 'pinia'; // <-- NEW
import { useQuasar } from 'quasar';
import { useRouter, useRoute } from 'vue-router';
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';

const authStore = useAuthStore();
const recipeStore = useRecipeStore(); // <-- NEW
const { tags: availableTags } = storeToRefs(recipeStore); // <-- NEW
const $q = useQuasar();
const router = useRouter();
const route = useRoute();

const { proxy } = getCurrentInstance();
const $firebaseStorage = proxy.$firebaseStorage;

const isSubmitting = ref(false);
const isSubmittingGuild = ref(false);
const loading = ref(false);
const error = ref(null);
const recipeId = ref(route.params.id || null);
const isUploading = ref(false);
const imageFile = ref(null);

const isEditMode = computed(() => !!recipeId.value);

const form = reactive({
  title: '',
  description: '',
  tags: [],
  xp: 0,
  status: 'private',
  ingredients: [],
  instructions: [],
  image_url: '',
});

// ... (ingredients/instructions functions are unchanged) ...
const addIngredient = () => {
  form.ingredients.push({ type: 'ingredient', quantity: '', name: '' });
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

const addHeader = () => {
  form.ingredients.push({ type: 'header', name: '' });
};

// --- NEW: Handle Tag Creation ---
const handleCreateTag = (val, done) => {
  const newTag = val.trim().toLowerCase();
  if (newTag.length > 0 && !form.tags.includes(newTag)) {
    // We can optionally add it to the availableTags list for this session
    // availableTags.value.push(newTag);
    done(newTag, 'add-unique');
  }
};
// ---

// --- Firebase Uploader Functions (unchanged) ---
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
      form.image_url = downloadURL;
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
  $q.notify({ color: 'info', message: 'Image selection cleared.' });
};
// --- End Uploader Functions ---

const fetchRecipeForEdit = async () => {
  if (!isEditMode.value) return;
  loading.value = true;
  error.value = null;
  try {
    const recipe = await recipeStore.fetchRecipe(recipeId.value); // Use store
    if (recipe.submitted_by_user_id.String !== authStore.user.uid) {
      throw new Error("You do not have permission to edit this recipe.");
    }
    form.title = recipe.title;
    form.description = recipe.description;
    form.tags = recipe.tags || []; // <-- MODIFIED: Already an array
    form.xp = recipe.xp;
    form.status = recipe.status;
    form.ingredients = recipe.ingredients || [];
    form.instructions = recipe.instructions || [];
    form.image_url = recipe.image_url.String || '';
  } catch (err) {
    console.error('Failed to fetch recipe for edit:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  if (isUploading.value) {
    $q.notify({ color: 'warning', message: 'Please wait for image to finish uploading.' });
    return;
  }

  isSubmitting.value = true;
  try {
    // --- MODIFIED: No longer need to parse tags ---
    const cleanIngredients = form.ingredients.filter(i => i.name && i.name.trim() !== '');
    const cleanInstructions = form.instructions.filter(i => i.step && i.step.trim() !== '');

    const payload = {
      id: recipeId.value,
      title: form.title,
      description: form.description,
      tags: form.tags, // <-- MODIFIED: Already an array
      ingredients: cleanIngredients,
      instructions: cleanInstructions,
      image_url: form.image_url,
    };

    await recipeStore.savePrivateRecipe(payload); // Use store

    $q.notify({
      color: 'positive',
      message: isEditMode.value ? 'Recipe updated!' : 'Recipe saved to your private cookbook!',
    });

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

const handleSubmitToGuild = async () => {
  $q.dialog({
    title: 'Submit to Guild?',
    message: 'This will save any pending changes and submit your recipe for Guild review. Are you sure?',
    cancel: true,
    persistent: true,
    ok: {
      color: 'positive',
      label: 'Submit'
    }
  }).onOk(async () => {
    isSubmittingGuild.value = true;
    try {
      // First, save any pending changes
      await handleSubmit();

      // Then, submit it
      await recipeStore.submitToGuild(recipeId.value); // Use store

      $q.notify({
        color: 'positive',
        message: 'Recipe submitted to the Guild for review!',
      });

      router.push('/my-submissions');
    } catch (err) {
      console.error('Failed to submit to guild:', err);
      $q.notify({
        color: 'negative',
        message: `Failed to submit: ${err.message}`,
      });
    } finally {
      isSubmittingGuild.value = false;
    }
  });
};

onMounted(() => {
  recipeStore.fetchTags(); // <-- NEW
  fetchRecipeForEdit();
});
</script>
