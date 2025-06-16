<script setup lang="ts">
import { callApi } from '@/helpers/request'
import { isAdmin } from '@/middlewares/auth'

const props = defineProps<{
  modelValue: boolean
  studentId: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const errorMessageModal = ref(false)
const verifyingBvn = ref<number | null>(null)
const selectedErrorMessage = ref('')
const paymentsData = ref<any[]>([])
const loadingPayments = ref(false)

const showErrorMessage = (message: string) => {
  selectedErrorMessage.value = message
  errorMessageModal.value = true
}

const Admin = ref(isAdmin())
const loading = ref(false)
const studentData = ref<any>(null)

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

const verifyBvn = async (bvnId: number) => {
  if (!bvnId) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'No BVN ID available'
    alertInfo.type = 'error'

    return
  }

  verifyingBvn.value = bvnId

  try {
    const response = await callApi({
      url: `bvn/verify/${bvnId}`,
      method: 'POST',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()

    if (response.ok) {
      // Update both the main students array and current items being displayed
      // const updateStudent = (studentArray: Students[]) => {
      //   const studentIndex = studentArray.findIndex(
      //     student => student.care_giver.bvn_id === bvnId,
      //   )

      //   if (studentIndex !== -1)
      //     studentArray[studentIndex].care_giver.is_bvn_verfied = 1
      // }

      alertInfo.show = true
      alertInfo.title = 'Success'
      alertInfo.message = responseData.message || 'BVN verified successfully'
      alertInfo.type = 'success'
    }
    else {
      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = responseData.message || 'BVN verification failed'
      alertInfo.type = 'error'
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'Something went wrong during BVN verification'
    alertInfo.type = 'error'
  }
  finally {
    verifyingBvn.value = null
  }
}

const fetchStudentDetails = async () => {
  if (!props.studentId)
    return

  loading.value = true
  try {
    const response = await callApi({
      url: `student/${props.studentId}`,
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()

    if (response.ok) {
      studentData.value = responseData.data
    }
    else {
      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = responseData.message || 'Failed to fetch student details'
      alertInfo.type = 'error'
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'Something went wrong while fetching student details'
    alertInfo.type = 'error'
  }
  finally {
    loading.value = false
  }
}

const fetchStudentPayments = async () => {
  if (!props.studentId)
    return

  loadingPayments.value = true
  try {
    const response = await callApi({
      url: `student/payments/${props.studentId}`,
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()

    if (response.ok) {
      paymentsData.value = responseData.data
    }
    else {
      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = responseData.message || 'Failed to fetch payment details'
      alertInfo.type = 'error'
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'Something went wrong while fetching payment details'
    alertInfo.type = 'error'
  }
  finally {
    loadingPayments.value = false
  }
}

watch(() => props.studentId, newId => {
  if (newId) {
    fetchStudentDetails()
    fetchStudentPayments()
  }
})

watch(() => props.modelValue, newValue => {
  if (!newValue) {
    studentData.value = null
    paymentsData.value = []
  }
})

const statusColorMap = {
  success: 'success',
  failed: 'error',
  pending: 'warning',
} as const

type StatusKey = keyof typeof statusColorMap

const getStatusColor = (status: string) => {
  return (statusColorMap[status.toLowerCase() as StatusKey] || 'info')
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    width="800"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard>
      <VCardTitle class="d-flex justify-space-between align-center pa-4">
        <span>Student Details</span>
        <VBtn
          icon="bx-x"
          variant="text"
          @click="emit('update:modelValue', false)"
        />
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-4">
        <VProgressCircular
          v-if="loading"
          indeterminate
          class="d-flex mx-auto my-4"
        />

        <template v-else-if="studentData">
          <VRow>
            <!-- Student Photo -->
            <VCol
              cols="12"
              class="text-center"
            >
              <VAvatar
                size="150"
                :image="studentData.photo"
                class="mb-4"
              >
                <VIcon
                  v-if="!studentData.photo"
                  size="48"
                  icon="bx-user"
                />
              </VAvatar>
            </VCol>

            <!-- Basic Information -->
            <VCol
              cols="12"
              md="6"
            >
              <h3 class="text-h6 mb-4">
                Basic Information
              </h3>
              <div class="d-flex flex-column gap-2">
                <div><strong>Name:</strong> {{ studentData.name }}</div>
                <div><strong>Admission Number:</strong> {{ studentData.student_admission_number }}</div>
                <div><strong>Class:</strong> {{ studentData.class }}</div>
                <div><strong>Date of Birth:</strong> {{ studentData.date_of_birth }}</div>
                <div><strong>School Distance:</strong> {{ studentData.school_distance }}</div>
              </div>
            </VCol>

            <!-- Attendance Information -->
            <VCol
              cols="12"
              md="6"
            >
              <h3 class="text-h6 mb-4">
                Attendance Information
              </h3>
              <div class="d-flex flex-column gap-2">
                <div><strong>Attendance Rate:</strong> {{ studentData.attendance }}%</div>
              </div>
            </VCol>

            <!-- Caregiver Information -->
            <VCol
              cols="12"
              md="6"
            >
              <h3 class="text-h6 mb-4">
                Caregiver Information
              </h3>
              <div class="d-flex flex-column gap-2">
                <div><strong>Name:</strong> {{ studentData.care_giver.name }}</div>
                <div><strong>Phone:</strong> {{ studentData.care_giver.phone }}</div>
                <div><strong>Address:</strong> {{ studentData.care_giver.address }}</div>
                <div><strong>Community:</strong> {{ studentData.care_giver.community }}</div>
                <div>
                  <strong class="me-2">Verification Status:</strong>
                  <VChip
                    v-if="studentData.care_giver.is_bvn_verfied === 1"
                    density="compact"
                    text="Account Verified"
                    color="success"
                  />
                  <VChip
                    v-else-if="studentData.bvn?.is_pending === 1"
                    density="compact"
                    text="Processing"
                    color="info"
                  />
                  <template v-else-if="studentData.bvn?.error_message">
                    <VBtn
                      density="compact"
                      variant="tonal"
                      color="error"
                      @click="showErrorMessage(studentData.bvn.error_message)"
                    >
                      Verification Failed
                    </VBtn>
                  </template>
                  <VBtn
                    v-else-if="Admin && studentData.care_giver.is_bvn_verfied === 0"
                    :loading="verifyingBvn === studentData.bvn_id"
                    density="compact"
                    variant="outlined"
                    text="Verify Account"
                    @click="verifyBvn(studentData.care_giver.bvn_id)"
                  />
                  <VChip
                    v-else
                    density="compact"
                    text="Account Unverified"
                    color="warning"
                  />
                </div>
              </div>
            </VCol>

            <!-- School Information -->
            <VCol
              cols="12"
              md="6"
            >
              <h3 class="text-h6 mb-4">
                School Information
              </h3>
              <div class="d-flex flex-column gap-2">
                <div><strong>School:</strong> {{ studentData.school.name }}</div>
                <div><strong>School Code:</strong> {{ studentData.school.code }}</div>
                <div><strong>Education Level:</strong> {{ studentData.school.education_level }}</div>
                <div><strong>LGA:</strong> {{ studentData.lga.name }}</div>
              </div>
            </VCol>

            <!-- Bank Information -->

            <VCol cols="12">
              <h3 class="text-h6 mb-4">
                Bank Information
              </h3>
              <div class="d-flex flex-column gap-2">
                <div><strong>Bank:</strong> {{ studentData.bank_name }}</div>
                <div><strong>Account Number:</strong> {{ studentData.account_number }}</div>
              </div>
            </VCol>

            <VCol cols="12">
              <h3 class="text-h6 mb-4">
                Payment Information
              </h3>
              <VProgressCircular
                v-if="loadingPayments"
                indeterminate
                class="d-flex mx-auto my-4"
              />
              <template v-else>
                <div
                  v-if="paymentsData.length"
                  class="d-flex flex-column gap-4"
                >
                  <VCard
                    v-for="payment in paymentsData"
                    :key="payment.id"
                    variant="outlined"
                    class="pa-4"
                  >
                    <div class="d-flex flex-column gap-2">
                      <div
                        hidden
                        class="d-flex justify-space-between align-center"
                      >
                        <strong>Disbursement Request ID:</strong>
                        <span>{{ payment.disbursement_request_id }}</span>
                      </div>
                      <div class="d-flex justify-space-between align-center">
                        <strong>Term:</strong>
                        <span>{{ payment.term_id }}</span>
                      </div>
                      <div class="d-flex justify-space-between align-center">
                        <strong>Date:</strong>
                        <span>{{ new Date(payment.created_at).toLocaleDateString() }}</span>
                      </div>
                      <div class="d-flex justify-space-between align-center">
                        <strong>Note:</strong>
                        <span>{{ payment.note }}</span>
                      </div>
                      <div
                        v-if="payment.disbursement_payments"
                        class="d-flex justify-space-between align-center"
                      >
                        <strong>Payment Status:</strong>
                        <VChip
                          :color="getStatusColor(payment.disbursement_payments.transaction_status)"
                          density="compact"
                        >
                          {{ payment.disbursement_payments.transaction_status }}
                        </VChip>
                      </div>
                      <div
                        v-if="payment.disbursement_payments?.failure_reason"
                        class="d-flex justify-space-between align-center"
                      >
                        <strong>Failure Reason:</strong>
                        <VBtn
                          density="compact"
                          variant="text"
                          color="error"
                          @click="showErrorMessage(payment.disbursement_payments.failure_reason)"
                        >
                          View Details
                        </VBtn>
                      </div>
                    </div>
                  </VCard>
                </div>
                <VAlert
                  v-else
                  type="info"
                  text="No payment records found"
                />
              </template>
            </VCol>
          </VRow>
        </template>
      </VCardText>
    </VCard>

    <VSnackbar
      v-model="alertInfo.show"
      :color="alertInfo.type"
      :timeout="4000"
    >
      {{ alertInfo.message }}
      <template #actions>
        <VBtn
          icon="bx-x"
          @click="alertInfo.show = false"
        />
      </template>
    </VSnackbar>
  </VDialog>
  <VDialog
    v-model="errorMessageModal"
    width="500"
  >
    <VCard class="pa-6">
      <VRow justify="space-between">
        <VCol cols="auto">
          <VCardTitle class="text-h5 text-center mb-4">
            Verification Error Details
          </VCardTitle>
        </VCol>
        <VCol cols="auto">
          <VBtn
            icon="bx-x"
            variant="text"
            @click="errorMessageModal = false"
          />
        </VCol>
      </VRow>
      <VCardText>
        <p class="text-body-1">
          {{ selectedErrorMessage }}
        </p>
      </VCardText>
      <VCardActions class="justify-end pt-4">
        <VBtn
          color="primary"
          variant="tonal"
          @click="errorMessageModal = false"
        >
          Close
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
