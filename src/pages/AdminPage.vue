<template>
  <q-page class="q-pa-md" style="max-width: 1000px; margin: 0 auto">
    <h4 class="text-h4 q-mt-none q-mb-md">Admin Review Queue</h4>

    <!-- Loading Spinner -->
    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner-dots color="primary" size="3em" />
    </div>

    <!-- Error Message -->
    <div v-if="error" class="q-pa-md">
      <q-banner rounded class="bg-red-1 text-red-8">
        <template v-slot:avatar>
          <q-icon name="error" />
        </template>
        <strong>Error fetching pending recipes:</strong> {{ error }}
      </q-banner>
    </div>

    <!-- No Recipes Message -->
    <div v-if="pendingRecipes.length === 0 && !loading" class="text-center text-grey-7 q-pa-xl">
      <q-icon name="check_circle_outline" size="3em" class="q-mb-sm" />
      <div class="text-h6">All caught up!</div>
      <p class="q-mt-sm">There are no pending recipes to review.</p>
    </div>

    <!-- Pending Recipes List -->
    <div v-else class="q-gutter-md">
      <q-card v-for="recipe in pendingRecipes" :key="recipe.id" flat bordered>
        <div class="row">
          <!-- === NEW: Display Image === -->
          <div class="col-12 col-md-4">
            <q-img v-if="recipe.image_url.Valid" :src="recipe.image_url.String" :ratio="16 / 9" class="full-height" />
            <q-card-section class="q-pa-sm q-pb-none" v-else>
              <q-img :ratio="16 / 9" class="bg-grey-2 full-height">
                <div class="absolute-center text-grey-6 text-center">
                  <q-icon name="image" size="2em" />
                  <div class="text-caption">No Image</div>
                </div>
              </q-img>
            </q-card-section>
          </div>
          <!-- === -->

          <!-- Recipe Info -->
          <div class="col-12 col-md-8">
            <q-card-section>
              <div class="text-caption text-grey-7">
                Submitted by:
                <span class="text-weight-bold">{{
                  recipe.submitted_by_username.String || 'Unknown User'
                  }}</span>
              </div>
              <div class="text-h6">{{ recipe.title }}</div>
              <p class="text-body2 text-grey-8">{{ recipe.description }}</p>
              <div class="q-gutter-xs">
                <q-chip v-for="tag in recipe.tags" :key="tag" outline color="grey-7" :label="tag" size="sm" />
              </div>
            </q-card-section>

            <q-separator />

            <!-- Ingredients and Instructions (Accordion) -->
            <q-expansion-item icon="restaurant" label="Review Ingredients & Instructions">
              <div class="row">
                <q-card-section class="col-12 col-md-6">
                  <div class="text-h6 q-mb-sm">Ingredients</div>
                  <q-list dense>
                    <q-item v-for="(item, index) in recipe.ingredients" :key="index">
                      <q-item-section>
                        <q-item-label>
                          <strong v-if="item.quantity">{{ item.quantity }}
                          </strong>
                          {{ item.name }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
                <q-card-section class="col-12 col-md-6">
                  <div class="text-h6 q-mb-sm">Instructions</div>
                  <q-list dense class="instruction-list">
                    <q-item v-for="(item, index) in recipe.instructions" :key="index">
                      <q-item-section avatar>
                        <q-avatar color="primary" text-color="white" size="sm">
                          {{ index + 1 }}
                        </q-avatar>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-body2">{{
                          item.step
                          }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </div>
            </q-expansion-item>

            <q-separator />

            <!-- Admin Actions -->
            <q-card-actions align="right" class="q-pa-md q-gutter-md">
              <!-- === NEW: XP Input === -->
              <q-input v-model.number="recipeXp[recipe.id]" label="XP Value" type="number" dense outlined
                style="width: 100px" :rules="[
                  (val) => val >= 10 || 'Min 10',
                  (val) => val <= 100 || 'Max 100',
                ]" lazy-rules />
              <!-- === END NEW === -->
              <q-btn label="Reject" color="negative" @click="rejectRecipe(recipe.id)"
                :loading="actionLoading[recipe.id]" />
              <q-btn label="Approve" color="positive" @click="approveRecipe(recipe.id, recipeXp[recipe.id])"
                :loading="actionLoading[recipe.id]"
                :disable="!recipeXp[recipe.id] || recipeXp[recipe.id] < 10 || recipeXp[recipe.id] > 100" />
            </q-card-actions>
          </div>
        </div>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'; // <-- Import watch
import { useRecipeStore } from 'stores/recipes';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const recipeStore = useRecipeStore();

const { pendingRecipes } = storeToRefs(recipeStore);
const loading = ref(false);
const error = ref(null);
const actionLoading = reactive({}); // Track loading state for each button
const recipeXp = reactive({}); // --- NEW: Store XP values by recipe ID

// --- NEW: Watcher to populate default XP values ---
watch(pendingRecipes, (newRecipes) => {
  if (newRecipes) {
    newRecipes.forEach((recipe) => {
      if (!recipeXp[recipe.id]) {
        // Default to 10 if XP is 0 (from private), otherwise use submitted value
        recipeXp[recipe.id] = recipe.xp > 0 ? recipe.xp : 10;
      }
    });
  }
});
// ---

const fetchPendingRecipes = async () => {
  loading.value = true;
  error.value = null;
  try {
    await recipeStore.fetchPendingRecipes();
  } catch (err) {
    error.value = err.message;
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// --- MODIFIED: Pass xp value ---
const approveRecipe = async (id, xp) => {
  if (xp < 10 || xp > 100) {
    $q.notify({
      color: 'negative',
      message: 'XP must be between 10 and 100.',
    });
    return;
  }
  actionLoading[id] = true;
  try {
    await recipeStore.approveRecipe(id, xp); // <-- Pass XP
    $q.notify({
      color: 'positive',
      message: 'Recipe approved! XP and badge awarded to user.',
    });
    delete recipeXp[id]; // Clean up state
  } catch (err) {
    console.error('Failed to approve recipe:', err);
    $q.notify({
      color: 'negative',
      message: `Failed to approve: ${err.message}`,
    });
  } finally {
    actionLoading[id] = false;
  }
};

const rejectRecipe = async (id) => {
  actionLoading[id] = true;
  try {
    await recipeStore.rejectRecipe(id);
    $q.notify({
      color: 'negative',
      message: 'Recipe rejected.',
    });
    delete recipeXp[id]; // Clean up state
  } catch (err) {
    console.error('Failed to reject recipe:', err);
    $q.notify({
      color: 'negative',
      message: `Failed to reject: ${err.message}`,
    });
  } finally {
    actionLoading[id] = false;
  }
};

onMounted(() => {
  fetchPendingRecipes();
});
</script>

<style scoped>
.instruction-list .q-item {
  align-items: flex-start;
}

.ellipsis-3-lines {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
