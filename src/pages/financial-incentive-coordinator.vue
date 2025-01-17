<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { VDataTableServer } from 'vuetify/labs/VDataTable'
import { callApi } from '@/helpers/request'
import { useUserStore } from '@/stores/user'

const user = useUserStore()
const loading = ref(false)
const requests = ref([])
const currentItems = ref([])
const totalItems = ref(0)
const itemsPerPage = ref(10)
const search = ref('')
const processingId = ref<number | null>(null)

// Modals
const approvalModal = ref(false)
const studentModal = ref(false)
const selectedRequest = ref<any>(null)
const selectedStudents = ref<any[]>([])

const approvalForm = ref({
  status: 'approved',
  notes: '',
})

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

const headers = [
  { title: 'School', key: 'school.name', align: 'start' },
  { title: 'Payment Type', key: 'payment_type.name', align: 'start' },
  { title: 'Amount', key: 'payment_type.amount', align: 'end' },
  { title: 'Status', key: 'status', align: 'center' },
  { title: 'Students', key: 'student_count', align: 'center' },
  { title: 'Created At', key: 'created_at', align: 'center' },
  { title: 'Actions', key: 'actions', align: 'center' },
]

const studentHeaders = [
  { title: 'Name', key: 'student.name', align: 'start' },
  { title: 'Class', key: 'student.class', align: 'start' },
  { title: 'Admission No.', key: 'student.student_admission_number', align: 'start' },
  { title: 'Guardian', key: 'student.care_giver.name', align: 'start' },
  { title: 'Guardian Phone', key: 'student.care_giver.phone', align: 'start' },
  { title: 'Status', key: 'note', align: 'center' },
]

const fetchRequests = async () => {
  loading.value = true
  try {
    const response = await callApi({
      url: 'disbursement/requests',
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()

    if (response.ok) {
      requests.value = responseData.data.map((request: any) => ({
        ...request,
        student_count: request.disbursement_students.length,
      }))
      totalItems.value = responseData.data.length
      currentItems.value = requests.value
    }
    else {
      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = responseData.message || 'Failed to fetch requests'
      alertInfo.type = 'error'
      loading.value = false
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'Failed to fetch requests'
    alertInfo.type = 'error'
    loading.value = false
  }
  finally {
    loading.value = false
  }
}

const showAlert = (title: string, message: string, type: 'error' | 'success' | 'warning' | 'info') => {
  alertInfo.show = true
  alertInfo.title = title
  alertInfo.message = message
  alertInfo.type = type
}

const openApprovalModal = (request: any) => {
  selectedRequest.value = request
  approvalForm.value = {
    status: 'approved',
    notes: '',
  }
  approvalModal.value = true
}

const openStudentModal = (request: any) => {
  selectedRequest.value = request
  selectedStudents.value = request.disbursement_students
  studentModal.value = true
}

const submitApproval = async () => {
  if (!selectedRequest.value)
    return

  processingId.value = selectedRequest.value.id
  try {
    const response = await callApi({
      url: `disbursement/request/approve?disbursement_request_id=${selectedRequest.value.id}`,
      method: 'POST',
      data: {
        status: approvalForm.value.status,
        notes: approvalForm.value.notes,
      },
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()

    if (response.ok) {
      showAlert('Success', `Request ${approvalForm.value.status} successfully`, 'success')
      approvalModal.value = false
      await fetchRequests()
    }
    else {
      showAlert('Error', responseData.message || 'Failed to process request', 'error')
    }
  }
  catch (error) {
    showAlert('Error', 'Failed to process request', 'error')
  }
  finally {
    processingId.value = null
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount)
}

const loadItems = ({ page, itemsPerPage: itemsPerPageOption }: any) => {
  const start = (page - 1) * itemsPerPageOption
  const end = start + itemsPerPageOption

  currentItems.value = requests.value.slice(start, end)
  totalItems.value = requests.value.length

  return { items: currentItems.value, total: totalItems.value }
}

onMounted(() => {
  fetchRequests()
})
</script>

<template>
  <VSnackbar
    v-model="alertInfo.show"
    :color="alertInfo.type"
    :timeout="4000"
    elevation="4"
  >
    <p>{{ alertInfo.message }}</p>
    <template #actions>
      <VBtn
        icon="bx-x"
        variant="text"
        @click="alertInfo.show = false"
      />
    </template>
  </VSnackbar>

  <!-- Main Card -->
  <VCard>
    <VCardTitle class="px-4 pt-4">
      Disbursement Requests
    </VCardTitle>
    <VCardText>
      <VTextField
        v-model="search"
        prepend-inner-icon="bx-search"
        label="Search Schools"
        density="compact"
        hide-details
        class="mb-4"
      />

      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="currentItems"
        :items-length="totalItems"
        :loading="loading"
        :search="search"
        @update:options="loadItems"
      >
        <template #item.payment_type.amount="{ item }">
          {{ formatAmount(item.raw.payment_type.amount) }}
        </template>

        <template #item.created_at="{ item }">
          {{ formatDate(item.raw.created_at) }}
        </template>

        <template #item.status="{ item }">
          <VChip
            :color="item.raw.status === 'approved' ? 'success' : item.raw.status === 'rejected' ? 'error' : 'warning'"
            size="small"
          >
            {{ item.raw.status }}
          </VChip>
        </template>

        <template #item.student_count="{ item }">
          <VChip
            color="info"
            size="small"
            @click="openStudentModal(item.raw)"
          >
            {{ item.raw.student_count }} Students
          </VChip>
        </template>

        <template #item.actions="{ item }">
          <VBtn
            v-if="item.raw.status === 'pending'"
            color="primary"
            size="small"
            text="Review"
            @click="openApprovalModal(item.raw)"
          />
          <VChip
            v-else
            color="primary"
            size="small"
            text="Reviewed"
          />
        </template>
      </VDataTableServer>
    </VCardText>
  </VCard>

  <!-- Approval Modal -->
  <VDialog
    v-model="approvalModal"
    max-width="500px"
    persistent
  >
    <VCard>
      <VCardTitle class="d-flex justify-space-between pa-4">
        <span>Review Request</span>
        <VBtn
          icon="bx-x"
          variant="text"
          @click="approvalModal = false"
        />
      </VCardTitle>

      <VCardText class="pa-4">
        <VRow>
          <VCol cols="12">
            <div class="mb-4">
              <p class="font-weight-medium mb-1">
                School: {{ selectedRequest?.school?.name }}
              </p>
              <p class="font-weight-medium mb-1">
                Payment: {{ selectedRequest?.payment_type?.name }}
              </p>
              <p class="font-weight-medium mb-1">
                Amount: {{ selectedRequest?.payment_type?.amount ? formatAmount(selectedRequest.payment_type.amount) : '' }}
              </p>
              <p class="font-weight-medium">
                Total Amount: {{ selectedRequest?.total_amount ? formatAmount(selectedRequest.total_amount) : '' }}
              </p>
            </div>

            <VSelect
              v-model="approvalForm.status"
              :items="[
                { title: 'Approve', value: 'approved' },
                { title: 'Reject', value: 'rejected' },
              ]"
              label="Decision"
              class="mb-4"
            />

            <VTextarea
              v-model="approvalForm.notes"
              label="Notes"
              :hint="approvalForm.status === 'rejected' ? 'Required for rejection' : 'Optional'"
              persistent-hint
              rows="3"
            />
          </VCol>
        </VRow>
      </VCardText>

      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn
          color="error"
          variant="text"
          @click="approvalModal = false"
        >
          Cancel
        </VBtn>
        <VBtn
          color="primary"
          :loading="processingId === selectedRequest?.id"
          @click="submitApproval"
        >
          Submit
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Students Modal -->
  <VDialog
    v-model="studentModal"
    max-width="900px"
  >
    <VCard>
      <VCardTitle class="d-flex justify-space-between pa-4">
        <span>Student List - {{ selectedRequest?.school?.name }}</span>
        <VBtn
          icon="bx-x"
          variant="text"
          @click="studentModal = false"
        />
      </VCardTitle>

      <VCardText class="pa-4">
        <VTable>
          <thead>
            <tr>
              <th
                v-for="header in studentHeaders"
                :key="header.key"
                :class="[`text-${header.align}`]"
              >
                {{ header.title }}
              </th>
            </tr>
          </thead>
          <tbody class="text-caption">
            <tr
              v-for="student in selectedStudents"
              :key="student.id"
            >
              <td>{{ student.student.name }}</td>
              <td>{{ student.student.class }}</td>
              <td>{{ student.student.student_admission_number }}</td>
              <td>{{ student.student.care_giver.name }}</td>
              <td>{{ student.student.care_giver.phone }}</td>
              <td class="text-center">
                <VChip
                  :color="student.note?.includes('Eligible') ? 'success' : 'error'"
                  size="small"
                >
                  {{ student.note?.replace(/['"]/g, '') }}
                </VChip>
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style scoped>
.v-data-table {
  font-size: 0.85rem;
}

.gap-2 {
  gap: 8px;
}
</style>
