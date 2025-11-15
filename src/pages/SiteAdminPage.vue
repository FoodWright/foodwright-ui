<template>
  <q-page class="q-pa-md" style="max-width: 1000px; margin: 0 auto">
    <h4 class="text-h4 q-mt-none q-mb-md">Site Admin: Badge Management</h4>

    <q-btn label="Create New Badge" color="primary" icon="add" @click="openCreateDialog" class="q-mb-md" />

    <!-- Badge Table -->
    <q-table :rows="badges" :columns="columns" row-key="id" :loading="loading" flat bordered>
      <!-- === MODIFIED: Add fit="contain" === -->
      <template v-slot:body-cell-icon_url="props">
        <q-td :props="props">
          <q-avatar v-if="props.value" color="white">
            <q-img :src="props.value" v-if="props.value.startsWith('http')" referrerpolicy="no-referrer"
              fit="contain" />
            <q-icon :name="props.value" v-else />
          </q-avatar>
          <span v-else class="text-grey-7">N/A</span>
        </q-td>
      </template>
      <!-- === END MODIFICATION === -->

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

          <q-card-section class="q-gutter-md">
            <q-input v-model="form.name" label="Badge Name" outlined :rules="[(val) => !!val || 'Name is required']" />
            <q-input v-model="form.rule_key" label="Legacy Rule Key (Optional)" outlined :readonly="isEditMode"
              hint="e.g., BAKER_3. This is for reference and can be left blank." />
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

            <!-- === NEW: Dynamic Rule Builder === -->
            <q-separator class="q-mt-lg" />
            <div class="text-h6 q-mb-none">Rule</div>

            <q-select v-model="form.trigger_event" :options="triggerOptions" label="When does this check happen?"
              outlined emit-value map-options :rules="[(val) => !!val || 'Trigger is required']" />

            <q-select v-model="form.rule_config.type" :options="ruleOptions" label="What condition is checked?" outlined
              emit-value map-options :rules="[(val) => !!val || 'Rule Type is required']" />

            <div v-if="form.rule_config.type" class="row q-col-gutter-sm items-center">
              <q-select v-model="form.rule_config.operator" :options="operatorOptions" label="Operator" outlined
                emit-value map-options class="col-3" :rules="[(val) => !!val || 'Operator is required']" />
              <q-input v-model.number="form.rule_config.value" label="Value" type="number" outlined class="col-3"
                :rules="[(val) => val > 0 || 'Value is required']" />
              <q-input v-if="showParameter" v-model="form.rule_config.parameter" label="Parameter (e.g. 'baking')"
                outlined class="col-6" :rules="[(val) => !!val || 'Parameter is required']" />
            </div>
            <div v-if="form.rule_config.type" class="text-caption text-grey-7">
              Rule Preview: {{ rulePreview }}
            </div>
            <!-- === END NEW === -->
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
import { ref, reactive, onMounted, computed, watch } from 'vue'; // <-- ADDED computed, watch
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

// --- NEW: Rule Builder Options ---
const triggerOptions = [
  { label: 'On Recipe Cook', value: 'on_cook' },
  { label: 'On Recipe Approval', value: 'on_approval' },
  { label: 'On Private Recipe Save', value: 'on_private_save' },
];

const ruleOptions = [
  { label: 'Total Cooks', value: 'TOTAL_COOKS' },
  { label: 'Cooks With Tag', value: 'COOKS_WITH_TAG' },
  { label: 'Approved Submissions', value: 'APPROVED_SUBMISSIONS' },
  { label: 'Total Private Recipes', value: 'TOTAL_PRIVATE_RECIPES' },
];

const operatorOptions = [
  { label: '== (Equals)', value: '==' },
  { label: '>= (Greater or Equal)', value: '>=' },
  { label: '> (Greater Than)', value: '>' },
];
// ---

const defaultRuleConfig = () => ({
  type: '',
  operator: '>=',
  value: 1,
  parameter: '',
});

const form = reactive({
  rule_key: '',
  name: '',
  description: '',
  icon_url: '',
  badge_type: 'MILESTONE',
  start_date: null,
  end_date: null,
  trigger_event: 'on_cook',
  rule_config: defaultRuleConfig(),
});

// --- NEW: Rule Builder Computed Props ---
const showParameter = computed(() => {
  return form.rule_config.type === 'COOKS_WITH_TAG';
});

const formatRule = (rule) => {
  if (!rule || !rule.type) return '...';
  const op = rule.operator;
  const val = rule.value;
  switch (rule.type) {
    case 'TOTAL_COOKS':
      return `User's total cooks ${op} ${val}`;
    case 'COOKS_WITH_TAG':
      return `User's cooks with tag [${rule.parameter}] ${op} ${val}`;
    case 'APPROVED_SUBMISSIONS':
      return `User's approved submissions ${op} ${val}`;
    case 'TOTAL_PRIVATE_RECIPES':
      return `User's total private recipes ${op} ${val}`;
    default:
      return 'Unknown rule';
  }
};

const rulePreview = computed(() => {
  return formatRule(form.rule_config);
});

// --- NEW: Watcher to clear parameter ---
watch(
  () => form.rule_config.type,
  (newType) => {
    if (newType !== 'COOKS_WITH_TAG') {
      form.rule_config.parameter = '';
    }
  }
);
// ---

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
    name: 'rule_key',
    label: 'Legacy Key',
    field: (row) => row.rule_key.String,
    align: 'left',
    sortable: true,
  },
  {
    name: 'description',
    label: 'Description',
    field: 'description',
    align: 'left',
    classes: 'ellipsis',
    style: 'max-width: 300px',
  },
  {
    name: 'badge_type',
    label: 'Type',
    field: 'badge_type',
    align: 'left',
    sortable: true,
  },
  {
    name: 'rule',
    label: 'Rule',
    field: 'rule_config',
    align: 'left',
    format: (val) => formatRule(val),
    style: 'max-width: 300px',
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
  editId.value = null;
  form.rule_key = '';
  form.name = '';
  form.description = '';
  form.icon_url = '';
  form.badge_type = 'MILESTONE';
  form.start_date = null;
  form.end_date = null;
  form.trigger_event = 'on_cook';
  form.rule_config = defaultRuleConfig();
};

const openCreateDialog = () => {
  isEditMode.value = false;
  resetForm();
  showDialog.value = true;
};

const openEditDialog = (badge) => {
  isEditMode.value = true;
  editId.value = badge.id;
  form.rule_key = badge.rule_key.String;
  form.name = badge.name;
  form.description = badge.description;
  form.icon_url = badge.icon_url.String || '';
  form.badge_type = badge.badge_type;
  form.start_date = badge.start_date ? badge.start_date.Time : null;
  form.end_date = badge.end_date ? badge.end_date.Time : null;
  form.trigger_event = badge.trigger_event;
  form.rule_config = { ...defaultRuleConfig(), ...badge.rule_config }; // Merge with defaults
  showDialog.value = true;
};

const handleSubmit = async () => {
  isSubmitting.value = true;

  // Prepare payload
  const payload = {
    id: editId.value,
    rule_key: form.rule_key || '', // Send empty string, not null
    name: form.name,
    description: form.description,
    icon_url: form.icon_url || '', // Send empty string, not null
    badge_type: form.badge_type,
    start_date: form.start_date || null,
    end_date: form.end_date || null,
    trigger_event: form.trigger_event,
    rule_config: form.rule_config,
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

onMounted(() => {
  fetchBadges();
});
</script>
