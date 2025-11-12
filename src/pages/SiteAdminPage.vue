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

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn flat round dense color="primary" icon="edit" @click="openEditDialog(props.row)" />
        </q-td>
      </template>
    </q-table>

    <!-- Create/Edit Badge Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 500px">
        <q-form @submit="handleSubmit">
          <q-card-section>
            <div class="text-h6">
              {{ isEditMode ? 'Edit Badge' : 'Create New Badge' }}
            </div>
          </q-card-section>

          <q-card-section class="q-gutter-md">
            <q-input v-model="form.name" label="Badge Name" outlined :rules="[(val) => !!val || 'Name is required']" />
            <q-input v-model="form.rule_key" label="Rule Key (e.g., BAKER_3)" outlined
              :rules="[(val) => !!val || 'Rule Key is required']" :readonly="isEditMode"
              :hint="isEditMode ? 'Rule Key cannot be changed' : 'Must be unique. e.g., COOK_10'" />
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

const form = reactive({
  rule_key: '',
  name: '',
  description: '',
  icon_url: '',
  badge_type: 'MILESTONE',
  start_date: null,
  end_date: null,
});

const columns = [
  { name: 'icon_url', label: 'Icon', field: 'icon_url', align: 'center' },
  { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
  { name: 'rule_key', label: 'Rule Key', field: 'rule_key', align: 'left', sortable: true },
  { name: 'description', label: 'Description', field: 'description', align: 'left', classes: 'ellipsis', style: 'max-width: 300px' },
  { name: 'badge_type', label: 'Type', field: 'badge_type', align: 'left', sortable: true },
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
    $q.notify({ color: 'negative', message: `Failed to fetch badges: ${err.message}` });
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  form.rule_key = '';
  form.name = '';
  form.description = '';
  form.icon_url = '';
  form.badge_type = 'MILESTONE';
  form.start_date = null;
  form.end_date = null;
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
  form.rule_key = badge.rule_key;
  form.name = badge.name;
  form.description = badge.description;
  form.icon_url = badge.icon_url; // Already converted to string by fetch
  form.badge_type = badge.badge_type;
  // This is simplified, real date formatting is needed for q-date
  form.start_date = badge.start_date ? badge.start_date.Time : null;
  form.end_date = badge.end_date ? badge.end_date.Time : null;
  showDialog.value = true;
};

const handleSubmit = async () => {
  isSubmitting.value = true;

  // Prepare payload
  const payload = {
    id: editId.value,
    ...form,
    start_date: form.start_date || null,
    end_date: form.end_date || null,
  };

  try {
    await adminStore.saveBadge(payload);
    $q.notify({ color: 'positive', message: `Badge ${isEditMode.value ? 'updated' : 'created'}!` });
    showDialog.value = false;
  } catch (err) {
    console.error('Failed to save badge:', err);
    $q.notify({ color: 'negative', message: `Failed to save badge: ${err.message}` });
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  fetchBadges();
});
</script>
