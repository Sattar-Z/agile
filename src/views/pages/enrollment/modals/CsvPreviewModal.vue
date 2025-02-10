<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { VDataTableServer } from 'vuetify/labs/VDataTable'

interface Props {
  modelValue: boolean
  csvData: any[]
  loading: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'confirm'])

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

// Table state
const itemsPerPage = ref(5)
const currentPage = ref(1)
const totalItems = ref(0)
const currentItems = ref<any[]>([])
const hasErrors = ref(false)

// Required fields

// Validation functions
const isValidDate = (dateStr: string) => {
  const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/
  if (!regex.test(dateStr))
    return false
  const [day, month, year] = dateStr.split('/').map(Number)
  const date = new Date(year, month - 1, day)

  return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year
}

const isValidPhoneNumber = (phone: string) => /^\d{10,11}$/.test(phone.replace(/\D/g, ''))
const isValidBVN = (bvn: string) => /^\d{11}$/.test(bvn)
const isValidNIN = (nin: string) => /^\d{11}$/.test(nin)
const isValidAccountNumber = (account: string) => /^\d{10}$/.test(account)

// Validate row and return errors
const validateRow = (row: any) => {
  const errorMap: { [key: string]: string } = {}

  if (row['Date of Birth'] && !isValidDate(row['Date of Birth']))
    errorMap['Date of Birth'] = 'Invalid Date of Birth format (DD/MM/YYYY)'
  if (row['Caregiver Phone Number'] && !isValidPhoneNumber(row['Caregiver Phone Number']))
    errorMap['Caregiver Phone Number'] = 'Invalid phone number format'
  if (row['Caregiver BVN'] && !isValidBVN(row['Caregiver BVN']))
    errorMap['Caregiver BVN'] = 'Invalid BVN format (11 digits)'
  if (row['Caregiver NIN'] && !isValidNIN(row['Caregiver NIN']))
    errorMap['Caregiver NIN'] = 'Invalid NIN format (11 digits)'
  if (row['Caregiver Bank Account Number'] && !isValidAccountNumber(row['Caregiver Bank Account Number']))
    errorMap['Caregiver Bank Account Number'] = 'Invalid account number format (10 digits)'

  return errorMap
}

// Compute headers
const headers = computed(() =>
  props.csvData.length
    ? Object.keys(props.csvData[0]).map(key => ({
      title: key,
      key,
      sortable: true,
      align: 'start' as const,
    }))
    : [],
)

// Process items
const processItems = (items: any[]) =>
  items.map(item => {
    const errors = validateRow(item)
    const hasRowErrors = Object.keys(errors).length > 0

    hasErrors.value = hasErrors.value || hasRowErrors

    return {
      ...item,
      _errors: errors,
      _hasErrors: hasRowErrors,
    }
  })

// Server-side pagination
const loadItems = ({ page, itemsPerPage: perPage }: any) => {
  const start = (page - 1) * perPage
  const end = start + perPage
  const slicedItems = props.csvData.slice(start, end)

  currentItems.value = processItems(slicedItems)
  totalItems.value = props.csvData.length
  currentPage.value = page

  return {
    items: currentItems.value,
    total: totalItems.value,
  }
}

const handleConfirm = () => {
  if (hasErrors.value) {
    alertInfo.show = true
    alertInfo.title = 'Warning'
    alertInfo.message = 'Please fix the validation errors before proceeding'
    alertInfo.type = 'warning'

    return
  }
  emit('confirm')
}

const errorSummary = computed(() => {
  const processedData = processItems(props.csvData)
  const totalErrors = processedData.filter(item => item._hasErrors).length

  return {
    totalRecords: props.csvData.length,
    recordsWithErrors: totalErrors,
    percentageValid: (
      ((props.csvData.length - totalErrors) / props.csvData.length)
      * 100
    ).toFixed(1),
  }
})
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="1200px"
    aria-labelledby="dialog-title"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <VCard>
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
      <VCardTitle
        id="dialog-title"
        class="text-h5 pa-4"
      >
        Preview Upload Data
      </VCardTitle>

      <VCardText>
        <VAlert
          v-if="hasErrors"
          type="error"
          class="mb-4"
          variant="tonal"
          closable
        >
          Found errors in {{ errorSummary.recordsWithErrors }} out of
          {{ errorSummary.totalRecords }} records ({{ errorSummary.percentageValid }}% valid)
        </VAlert>

        <VDataTableServer
          v-model:items-per-page="itemsPerPage"
          v-model:page="currentPage"
          :headers="headers"
          :items="currentItems"
          :items-length="totalItems"
          :loading="loading"
          density="compact"
          hover
          item-value="name"
          @update:options="loadItems"
        >
          <template #item="{ item }">
            <tr :class="{ 'error-row': item.raw._hasErrors }">
              <td
                v-for="header in headers"
                :key="header.key"
                :class="{ 'error-cell': item.raw._errors?.[header.key] }"
              >
                <div
                  v-if="item.raw._errors?.[header.key]"
                  v-tooltip="item.raw._errors[header.key]"
                  class="error-content"
                >
                  {{ item.raw[header.key] }}
                </div>
                <div v-else>
                  {{ item.raw[header.key] }}
                </div>
              </td>
            </tr>
          </template>
        </VDataTableServer>

        <p class="text-grey mt-2">
          Showing {{ Math.min(itemsPerPage, csvData.length) }} rows of
          {{ csvData.length }} total records
        </p>
      </VCardText>

      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn
          color="grey-darken-1"
          variant="text"
          @click="$emit('update:modelValue', false)"
        >
          Cancel
        </VBtn>
        <VBtn
          color="primary"
          :loading="loading"
          :disabled="hasErrors"
          aria-disabled="hasErrors"
          @click="handleConfirm"
        >
          {{ hasErrors ? 'Fix Errors to Continue' : 'Confirm Upload' }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.v-data-table {
  font-size: 0.85rem;
}

.error-row {
  background-color: rgb(254, 242, 242);
}

.error-cell {
  color: rgb(220, 38, 38);
}

.error-content {
  cursor: pointer;
  text-decoration: underline dotted;
}
</style>
