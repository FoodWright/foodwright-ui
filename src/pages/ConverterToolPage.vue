<template>
  <q-page class="q-pa-md" style="max-width: 600px; margin: 0 auto">
    <h4 class="text-h4 q-mt-none q-mb-md">Unit Conversion Tool</h4>
    <p class="text-body1 text-grey-8 q-mb-lg">
      Quickly convert between imperial and metric units. For mass/volume
      conversions (e.g., cups to grams), select an ingredient.
    </p>

    <q-card flat bordered>
      <q-card-section class="q-gutter-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <q-input v-model="form.quantity" label="Quantity" outlined dense placeholder="e.g., 1 1/2" />
          </div>
          <div class="col-12 col-sm-6">
            <q-select v-model="form.fromUnit" label="From Unit" :options="allUnits" group outlined dense />
          </div>
        </div>

        <q-input v-model="form.ingredient" label="Ingredient (for mass/volume)" outlined dense
          placeholder="e.g., flour, sugar, butter" hint="Density is estimated for common ingredients." />

        <div class="row items-center q-gutter-md">
          <div class="text-h6 text-grey-7">To:</div>
          <q-btn-toggle v-model="form.toSystem" toggle-color="primary" :options="[
            { label: 'Imperial', value: 'imperial' },
            { label: 'Metric', value: 'metric' },
          ]" />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section v-if="result" class="text-center bg-grey-1" style="min-height: 100px">
        <div class="text-h4 text-primary text-weight-bold">
          {{ result.quantity }}
          <span class="text-h5 text-grey-8 q-ml-sm">{{ result.unit }}</span>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { reactive, computed } from 'vue';
import {
  allUnits,
  parseQuantity,
  convert,
} from 'src/services/unitConverter';

const form = reactive({
  quantity: '1',
  fromUnit: 'cup',
  ingredient: 'flour',
  toSystem: 'metric',
});

const result = computed(() => {
  const fromValue = parseQuantity(form.quantity);
  if (fromValue === 0) {
    return null;
  }
  return convert(
    fromValue,
    form.fromUnit,
    form.toSystem,
    form.ingredient
  );
});
</script>
