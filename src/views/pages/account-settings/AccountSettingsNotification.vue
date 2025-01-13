<script lang="ts" setup>
import { callApi } from '@/helpers/request'

// Form fields for disbursement
const termId = ref('1')
const attendanceCriteria = ref(70)
const bvnCriteria = ref(true)
const session = ref('2024') // Default year as a string
const isLoaded = ref(true)
const isPaymentLoaded = ref(true)

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

const paymentName = ref('')
const displayAmount = ref('') // For formatted display
const paymentAmount = ref<number | null>(null) // For raw value to send to API

const formatForDisplay = (value: string) => {
  if (!value)
    return ''

  // Remove all characters except numbers and decimal point
  const cleanValue = value.replace(/[^\d.]/g, '')

  // Ensure only one decimal point
  const parts = cleanValue.split('.')
  const wholePart = parts[0]
  const decimalPart = parts.length > 1 ? `.${parts[1]}` : ''

  // Add commas to the whole number part
  const formattedWhole = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return `${formattedWhole}${decimalPart}`
}

const onAmountInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  const cursorPos = input.selectionStart || 0
  const oldValue = displayAmount.value
  const oldCommaCount = (oldValue.match(/,/g) || []).length

  // Format for display
  const formattedValue = formatForDisplay(input.value)

  displayAmount.value = formattedValue

  // Update raw value for API
  const numericValue = parseFloat(formattedValue.replace(/,/g, ''))

  paymentAmount.value = !isNaN(numericValue) ? numericValue : null

  // Adjust cursor position
  nextTick(() => {
    const newCommaCount = (formattedValue.match(/,/g) || []).length
    const cursorAdjustment = newCommaCount - oldCommaCount
    const newPosition = cursorPos + cursorAdjustment

    input.setSelectionRange(newPosition, newPosition)
  })
}

const submitForm = async () => {
  isLoaded.value = false
  try {
    const payload = {
      term_id: termId.value,
      attendance_creteria: attendanceCriteria.value,
      bvn_creteria: bvnCriteria.value,
      session: session.value,
    }

    const response = await callApi({
      method: 'POST',
      url: 'disbursement/eligibility_criteria',
      data: payload,
      authorized: true,
    })

    const responseData = await response.json()

    if (response.ok) {
      alertInfo.show = true
      alertInfo.title = 'Success'
      alertInfo.message = responseData.message
      alertInfo.type = 'success'
    }
    else {
      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = responseData.message || 'Something went wrong please try again later'
      alertInfo.type = 'error'
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'Something went wrong please try again later'
    alertInfo.type = 'error'
  }
  finally {
    isLoaded.value = true
  }
}

const submitPaymentType = async () => {
  if (!paymentAmount.value || !paymentName.value) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'Please fill in all required fields'
    alertInfo.type = 'error'

    return
  }

  isPaymentLoaded.value = false
  try {
    const payload = {
      name: paymentName.value,
      amount: paymentAmount.value, // Will be a number
    }

    const response = await callApi({
      method: 'POST',
      url: 'disbursement/payment_type',
      data: payload,
      authorized: true,
    })

    const responseData = await response.json()

    if (response.ok) {
      alertInfo.show = true
      alertInfo.title = 'Success'
      alertInfo.message = responseData.message
      alertInfo.type = 'success'

      // Clear form after successful submission
      paymentName.value = ''
      displayAmount.value = ''
      paymentAmount.value = null
    }
    else {
      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = responseData.message || 'Something went wrong please try again later'
      alertInfo.type = 'error'
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'Something went wrong please try again later'
    alertInfo.type = 'error'
  }
  finally {
    isPaymentLoaded.value = true
  }
}
</script>

<template>
  <VSnackbar
    v-model="alertInfo.show"
    :color="alertInfo.type"
    elevation="74"
    :timeout="4000"
  >
    <p>{{ alertInfo.message }}</p>
    <template #actions>
      <VBtn
        color="white"
        icon="bx-x"
        @click="alertInfo.show = false"
      />
    </template>
  </VSnackbar>
  <VCard title="Disbursement Settings">
    <!-- Existing form -->
    <VCardText>
      <VForm @submit.prevent="submitForm">
        <p class="text-base font-weight-medium">
          Submit Attendance Criteria
        </p>
        <VRow>
          <VCol
            cols="12"
            sm="6"
          >
            <VTextField
              v-model="termId"
              label="Term ID"
              type="text"
            />
          </VCol>
          <VCol
            cols="12"
            sm="6"
          >
            <VTextField
              v-model="attendanceCriteria"
              label="Attendance Criteria (%)"
              type="number"
              min="0"
              max="100"
            />
          </VCol>
        </VRow>
        <VRow class="mt-4">
          <VCol
            cols="12"
            sm="6"
          >
            <VTextField
              v-model="session"
              label="Session (Year)"
              type="text"
            />
          </VCol>
          <VCol>
            <VCheckbox
              v-model="bvnCriteria"
              label="BVN Criteria"
              disabled
            />
          </VCol>
        </VRow>
        <div class="d-flex flex-wrap gap-4 mt-4">
          <VBtn type="submit">
            Submit
          </VBtn>
        </div>
      </VForm>
    </VCardText>
    <VDivider />

    <!-- New Payment Type Form -->
    <VCardText>
      <p class="text-base font-weight-medium">
        Create Payment Type
      </p>
      <VForm @submit.prevent="submitPaymentType">
        <VRow>
          <VCol
            cols="12"
            sm="6"
          >
            <VTextField
              v-model="paymentName"
              label="Payment Name"
              type="text"
            />
          </VCol>
          <VCol
            cols="12"
            sm="6"
          >
            <VTextField
              v-model="paymentAmount"
              prefix="₦"
              label="Payment Amount"
              @input="onAmountInput"
            />
          </VCol>
        </VRow>
        <div class="d-flex flex-wrap gap-4 mt-4">
          <VBtn
            type="submit"
            :loading="!isPaymentLoaded"
          >
            Create Payment Type
          </VBtn>
        </div>
      </VForm>
    </VCardText>
  </VCard>
</template>

<style lang="scss" scoped>
.v-table {
  th {
    text-align: start !important;
  }
}
</style>
