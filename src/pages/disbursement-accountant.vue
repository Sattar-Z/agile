<!-- disbursement-accountant.vue -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { VDataTableServer } from 'vuetify/labs/VDataTable'
import { callApi } from '@/helpers/request'

// import { useUserStore } from '@/stores/user'

// const user = useUserStore()

const loading = ref(false)
const requests = ref([])
const currentItems = ref([])
const totalItems = ref(0)
const itemsPerPage = ref(10)
const search = ref('')
const processingId = ref<number | null>(null)

// Modal and form controls
const approvalModal = ref(false)
const studentModal = ref(false)
const selectedRequest = ref<any>(null)
const selectedStudents = ref<any[]>([])

const approvalForm = ref({
  status: 'pending',
  notes: '',
})

const formErrors = ref({
  status: '',
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
  { title: 'Total Amount', key: 'total_amount', align: 'end' },
  { title: 'Status', key: 'status', align: 'center' },
  { title: 'Students', key: 'student_count', align: 'center' },
  { title: 'Uploaded By', key: 'uploaded_by.name', align: 'start' },
  { title: 'Notes', key: 'notes', align: 'start' },
  { title: 'Created At', key: 'created_at', align: 'center' },
  { title: 'Actions', key: 'actions', align: 'center' },
]

const getMandateStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    1: 'New Mandate Initiated by Biller',
    2: 'Mandate Authorized by Biller',
    3: 'Mandate Rejected by Biller',
    4: 'Mandate Approved by Biller',
    5: 'Mandate Disapproved by Biller',
    6: 'Mandate Authorized by Bank',
    7: 'Mandate Rejected by Bank',
    8: 'Mandate Approved by Bank',
    9: 'Mandate Disapproved by Bank',
    10: 'New Mandate Initiated by Bank',
  }

  return statusMap[status] || 'Unknown Status'
}

const canReviewRequest = computed(() => {
  return selectedRequest.value?.mandate_workflow_status === '8'
})

const studentHeaders = [
  { title: 'Name', key: 'student.name', align: 'start' },
  { title: 'Class', key: 'student.class', align: 'start' },
  { title: 'Admission No.', key: 'student.student_admission_number', align: 'start' },
  { title: 'Guardian', key: 'student.care_giver.name', align: 'start' },
  { title: 'Guardian Phone', key: 'student.care_giver.phone', align: 'start' },
  { title: 'Amount', key: 'student.amount', align: 'start' },
  { title: 'Status', key: 'note', align: 'center' },
]

const statusOptions = [
  { title: 'Submit', value: 'pending' },
  { title: 'Reject', value: 'rejected' },
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
      currentItems.value = responseData.data
    }
    else {
      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = responseData.message || 'Failed to fetch requests'
      alertInfo.type = 'error'
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'Failed to fetch requests'
    alertInfo.type = 'error'
  }
  finally {
    loading.value = false
  }
}

const openApprovalModal = (request: any) => {
  selectedRequest.value = request
  approvalForm.value = {
    status: 'pending',
    notes: '',
  }
  formErrors.value = {
    status: '',
    notes: '',
  }
  approvalModal.value = true
}

const validateForm = () => {
  let isValid = true
  formErrors.value = {
    status: '',
    notes: '',
  }

  if (!approvalForm.value.status) {
    formErrors.value.status = 'Status is required'
    isValid = false
  }

  if (approvalForm.value.status === 'rejected' && !approvalForm.value.notes.trim()) {
    formErrors.value.notes = 'Notes are required when rejecting a request'
    isValid = false
  }

  return isValid
}

const openStudentModal = (request: any) => {
  selectedRequest.value = request
  selectedStudents.value = request.disbursement_students
  studentModal.value = true
}

const approveRequest = async () => {
  if (!validateForm())
    return

  processingId.value = selectedRequest.value.id
  try {
    const response = await callApi({
      url: `disbursement/request/approve?disbursement_request_id=${selectedRequest.value.id}`,
      method: 'POST',
      data: {
        status: approvalForm.value.status,
        notes: approvalForm.value.notes || null,
      },
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()

    if (response.ok) {
      alertInfo.show = true
      alertInfo.title = 'Success'
      alertInfo.message = `Request ${approvalForm.value.status} successfully`
      alertInfo.type = 'success'
      approvalModal.value = false
      await fetchRequests()
    }
    else {
      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = responseData.message || 'Failed to process request'
      alertInfo.type = 'error'
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'Failed to process request'
    alertInfo.type = 'error'
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
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount)
}

const filterItems = (items: any[], searchValue: string) => {
  return items.filter(item =>
    item.school.name.toLowerCase().includes(searchValue.toLowerCase())
    || item.payment_type.name.toLowerCase().includes(searchValue.toLowerCase())
    || item.uploaded_by.name.toLowerCase().includes(searchValue.toLowerCase()),
  )
}

const loadItems = ({ page, itemsPerPage: itemsPerPageOption, sortBy }: any) => {
  const filteredItems = filterItems(requests.value, search.value)
  const start = (page - 1) * itemsPerPageOption
  const end = start + itemsPerPageOption

  currentItems.value = filteredItems.slice(start, end)
  totalItems.value = filteredItems.length

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

  <VCard>
    <VCardTitle class="px-4 pt-4">
      Disbursement Requests
    </VCardTitle>
    <VCardText>
      <VTextField
        v-model="search"
        prepend-inner-icon="bx-search"
        label="Search Requests"
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
        <template #item.total_amount="{ item }">
          {{ formatAmount(item.raw.total_amount) }}
        </template>

        <template #item.notes="{ item }">
          <span
            v-if="item.raw.notes"
            class="text-caption"
          >{{ item.raw.notes }}</span>
          <span
            v-else
            class="text-caption text-disabled"
          >No notes</span>
        </template>

        <template #item.created_at="{ item }">
          {{ formatDate(item.raw.created_at) }}
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
        <template #item.status="{ item }">
          <VChip
            :color="item.raw.status === 'approved' ? 'success' : item.raw.status === 'rejected' ? 'error' : 'warning'"
            size="small"
          >
            {{ item.raw.status }}
          </VChip>
        </template>

        <template #item.actions="{ item }">
          <VBtn
            color="primary"
            size="small"
            @click="openApprovalModal(item.raw)"
          >
            Review
          </VBtn>
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
      <VCardTitle class="text-h5 pa-4">
        Review Disbursement Request
        <VBtn
          icon="bx-x"
          variant="text"
          class="float-right"
          @click="approvalModal = false"
        />
      </VCardTitle>

      <VCardText class="pa-4">
        <VContainer>
          <VRow>
            <VCol cols="12">
              <p class="font-weight-medium">
                School: {{ selectedRequest?.school?.name }}
              </p>
              <p class="font-weight-medium">
                Payment Type: {{ selectedRequest?.payment_type?.name }}
              </p>
              <p class="font-weight-medium">
                Amount: {{ selectedRequest?.payment_type?.amount ? formatAmount(selectedRequest.payment_type.amount) : '' }}
              </p>
              <p class="font-weight-medium">
                Total Amount: {{ selectedRequest?.total_amount ? formatAmount(selectedRequest.total_amount) : '' }}
              </p>
              <VDivider class="my-4" />

              <p
                v-if="selectedRequest?.mandate_workflow_status"
                class="font-weight-medium"
              >
                Mandate Status: {{ getMandateStatusText(selectedRequest.mandate_workflow_status) }}
              </p>

              <!-- Show response message if mandate is not approved -->
              <VAlert
                v-if="!canReviewRequest && selectedRequest?.response_message"
                color="info"
                class="mt-4 text-caption"
              >
                {{ selectedRequest.response_message }}
              </VAlert>

              <VDivider class="my-4" />
              <p class="font-weight-medium">
                Uploaded By: {{ selectedRequest?.uploaded_by?.name }}
                <span class="text-caption">
                  ({{ selectedRequest?.uploaded_by?.email }})
                </span>
              </p>
              <p
                v-if="selectedRequest?.approved_by"
                class="font-weight-medium"
              >
                Approved By: {{ selectedRequest.approved_by.name }}
              </p>
              <p
                v-if="selectedRequest?.reviewed_by"
                class="font-weight-medium"
              >
                Reviewed By: {{ selectedRequest.reviewed_by.name }}
              </p>
              <p
                v-if="selectedRequest?.finance_approved_by"
                class="font-weight-medium"
              >
                Finance Approved By: {{ selectedRequest.finance_approved_by.name }}
              </p>
              <p
                v-if="selectedRequest?.notes"
                class="font-weight-medium"
              >
                Previous Notes: {{ selectedRequest.notes }}
              </p>
            </VCol>
            <VCol cols="12">
              <VSelect
                v-model="approvalForm.status"
                :items="statusOptions"
                label="Status"
                :error-messages="formErrors.status"
                required
              />
            </VCol>
            <VCol cols="12">
              <VTextarea
                v-model="approvalForm.notes"

                label="Notes"
                :error-messages="formErrors.notes"
                :hint="approvalForm.status === 'rejected' ? 'Notes are required for rejection' : ''"
                :persistent-hint="approvalForm.status === 'rejected'"
                rows="3"
              />
            </VCol>
          </VRow>
        </VContainer>
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
          @click="approveRequest"
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
              <td>{{ formatAmount(student.amount) }}</td>
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
</style>
