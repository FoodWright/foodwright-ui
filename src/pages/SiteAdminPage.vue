<template>
  <q-page class="q-pa-md" style="max-width: 1000px; margin: 0 auto">
    <h4 class="text-h4 q-mt-none q-mb-md">Site Admin: Badge Management</h4>

    <q-btn label="Create New Badge" color="primary" icon="add" @click="openCreateDialog" class="q-mb-md" />

    <!-- Badge Table -->
    <q-table :rows="badges" :columns="columns" row-key="id" :loading="loading" flat bordered>
      <template v-slot:body-cell-icon_url="props">
        <q-td :props="props">
          <q-avatar v-if="props.value">
            <q-img :src="props.value" v-if="props.value.startsWith('http')" />
            <q-icon :name="props.value" v-else />
          </q-avatar>
          <span v-else class="text-grey-7">N/A</span>
        </q-td>
      </template>

      <!-- NEW: Rule Description Column -->
      <template v-slot:body-cell-rule="props">
        <q-td :props="props">
          <div class="text-weight-bold">
            Trigger:
            <span class="text-primary">{{ props.row.trigger_event }}</span>
          </div>
          <div class="text-caption text-grey-8">
            Rule: {{ formatRule(props.row.rule_config) }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn flat round dense color="primary" icon="edit" @click="openEditDialog(props.row)" />
        </q-td>
      </template>
    </q-table>

    <!-- Create/Edit Badge Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 600px">
        <q-form @submit="handleSubmit">
          <q-card-section>
            <div class="text-h6">
              {{ isEditMode ? 'Edit Badge' : 'Create New Badge' }}
            </div>
          </q-card-section>

          <!-- === SECTION 1: Badge Details === -->
          <q-card-section class="q-gutter-md">
            <div class="text-overline">Badge Details</div>
            <q-input v-model="form.name" label="Badge Name" outlined :rules="[(val) => !!val || 'Name is required']" />
            <q-input v-model="form.description" label="Description" type="textarea" outlined
              :rules="[(val) => !!val || 'Description is required']" />
            <q-input v-model="form.icon_url" label="Icon URL or FontAwesome Name" outlined
              hint="e.g., https://.../icon.png or fas fa-shield-alt" />
            <q-select v-model="form.badge_type" :options="['MILESTONE', 'EVENT', 'SEASONAL']" label="Badge Type"
              outlined :rules="[(val) => !!val || 'Type is required']" />
            <q-input v-if="form.badge_type === 'EVENT' || form.badge_type === 'SEASONAL'" v-model="form.start_date"
              label="Start Date (YYYY-MM-DDTHH:MM:SSZ)" outlined hint="e.g., 2025-10-01T00:00:00Z" />
            <q-input v-if="form.badge_type === 'EVENT' || form.badge_type === 'SEASONAL'" v-model="form.end_date"
              label="End Date (YYYY-MM-DDTHH:MM:SSZ)" outlined hint="e.g., 2025-10-31T23:59:59Z" />
          </q-card-section>

          <q-separator class="q-my-md" />

          <!-- === SECTION 2: Rule Builder === -->
          <q-card-section class="q-gutter-md">
            <div class="text-overline">Rule Builder</div>
            <q-select v-model="form.trigger_event" :options="triggerOptions" label="Trigger Event" outlined emit-value
              map-options :rules="[(val) => !!val || 'Trigger is required']" hint="When should this rule be checked?" />

            <q-select v-model="form.rule_config.type" :options="ruleTypeOptions" label="Rule Type" outlined emit-value
              map-options :rules="[(val) => !!val || 'Rule type is required']" hint="What data are we checking?" />

            <div class="row q-col-gutter-sm items-center">
              <q-select v-model="form.rule_config.operator" :options="operatorOptions" label="Operator" outlined
                emit-value map-options class="col-4" />
              <q-input v-model.number="form.rule_config.value" label="Value" type="number" outlined class="col-8"
                :rules="[(val) => val >= 0 || 'Value must be positive']" />
            </div>

            <q-input v-if="form.rule_config.type === 'COOKS_WITH_TAG'" v-model="form.rule_config.parameter"
              label="Tag Name" outlined :rules="[(val) => !!val || 'Tag name is required']"
              hint="e.g., baking, pasta, easy" />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancel" v-close-popup :disable="isSubmitting" />
            <q-btn label="Save" type="submit" color="primary" :loading="isSubmitting" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useAdminStore } from 'stores/admin';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';

const adminStore = useAdminStore();
const { badges } = storeToRefs(adminStore);
const $q = useQuasar();

const loading = ref(false);
const error = ref(null);
const showDialog = ref(false);
const isEditMode = ref(false);
const isSubmitting = ref(false);
const editId = ref(null);

// --- NEW Rule Builder Options ---
const triggerOptions = [
  { label: 'When a user logs a cook', value: 'on_cook' },
  { label: 'When a recipe is approved', value: 'on_approval' },
];

const ruleTypeOptions = [
  { label: 'Total Cooks (by user)', value: 'TOTAL_COOKS' },
  { label: 'Cooks With Tag (by user)', value: 'COOKS_WITH_TAG' },
  { label: 'Approved Submissions (by user)', value: 'APPROVED_SUBMISSIONS' },
  // { label: 'Total Comments (by user)', value: 'TOTAL_COMMENTS' }, // Future
];

const operatorOptions = [
  { label: 'Equal to (==)', value: '==' },
  { label: 'Greater than or equal (>=)', value: '>=' },
  { label: 'Greater than (>)', value: '>' },
];
// ---

const createFreshForm = () => ({
  name: '',
  description: '',
  icon_url: '',
  badge_type: 'MILESTONE',
  start_date: null,
  end_date: null,
  trigger_event: 'on_cook',
  rule_config: {
    type: 'TOTAL_COOKS',
    operator: '==',
    value: 1,
    parameter: '',
  },
});

const form = reactive(createFreshForm());

const columns = [
  { name: 'icon_url', label: 'Icon', field: 'icon_url', align: 'center' },
  {
    name: 'name',
    label: 'Name',
    field: 'name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'rule', // <-- NEW: Replaces rule_key
    label: 'Rule',
    align: 'left',
  },
  {
    name: 'badge_type',
    label: 'Type',
    field: 'badge_type',
    align: 'left',
    sortable: true,
  },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' },
];

const fetchBadges = async () => {
  loading.value = true;
  error.value = null;
  try {
    await adminStore.fetchBadges();
  } catch (err) {
    error.value = err.message;
    console.error(err);
    $q.notify({
      color: 'negative',
      message: `Failed to fetch badges: ${err.message}`,
    });
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  Object.assign(form, createFreshForm());
  editId.value = null;
};

const openCreateDialog = () => {
  isEditMode.value = false;
  resetForm();
  showDialog.value = true;
};

const openEditDialog = (badge) => {
  isEditMode.value = true;
  editId.value = badge.id;

  // Populate basic info
  form.name = badge.name;
  form.description = badge.description;
  form.icon_url = badge.icon_url; // Already converted to string by store
  form.badge_type = badge.badge_type;
  form.start_date = badge.start_date ? badge.start_date.Time : null;
  form.end_date = badge.end_date ? badge.end_date.Time : null;

  // Populate rule info
  form.trigger_event = badge.trigger_event;
  // Parse the rule_config JSON
  if (typeof badge.rule_config === 'object' && badge.rule_config !== null) {
    form.rule_config = { ...badge.rule_config };
  } else {
    try {
      form.rule_config = JSON.parse(badge.rule_config);
    } catch (e) {
      console.error('Failed to parse rule_config, resetting.', e);
      form.rule_config = createFreshForm().rule_config;
    }
  }

  showDialog.value = true;
};

const handleSubmit = async () => {
  isSubmitting.value = true;

  const payload = {
    id: editId.value,
    ...form,
    start_date: form.start_date || null,
    end_date: form.end_date || null,
    // The rule_config object is already in the correct format
  };

  try {
    await adminStore.saveBadge(payload);
    $q.notify({
      color: 'positive',
      message: `Badge ${isEditMode.value ? 'updated' : 'created'}!`,
    });
    showDialog.value = false;
  } catch (err) {
    console.error('Failed to save badge:', err);
    $q.notify({
      color: 'negative',
      message: `Failed to save badge: ${err.message}`,
    });
  } finally {
    isSubmitting.value = false;
  }
};

// NEW: Helper to format the rule for the table
const formatRule = (config) => {
  if (!config) return 'N/A';
  let rule = '';
  switch (config.type) {
    case 'TOTAL_COOKS':
      rule = 'Total Cooks';
      break;
    case 'COOKS_WITH_TAG':
      rule = `Cooks w/ Tag "${config.parameter}"`;
      break;
    case 'APPROVED_SUBMISSIONS':
      rule = 'Approved Submissions';
      break;
    default:
      rule = config.type;
  }
  return `${rule} ${config.operator} ${config.value}`;
};

onMounted(() => {
  fetchBadges();
});
</script>
