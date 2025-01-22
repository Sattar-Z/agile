<!-- Students.vue -->
<script setup lang="ts">
import { Parser } from '@json2csv/plainjs'
import { useRouter } from 'vue-router'
import { VDataTableServer } from 'vuetify/labs/VDataTable'

import * as XLSX from 'xlsx'
import LoadingTable from './LoadingTable.vue'
import { callApi } from '@/helpers/request'
import { useUserStore } from '@/stores/user'

// import { toNigerianCurrency } from '@/helpers/numbers'

const props = defineProps<{
  termId: number | null
  school: number | null
  payment: number | null
  cohurt: string | null
}>()

const token = ref('')
const exportType = ref<'CSV' | 'Excel' | null>(null)
const user = useUserStore()
const router = useRouter()
const exportModal = ref(false)
const showLoadingTable = ref(true)

token.value = user.getUserInfo().token

interface Student {
  id: number | null
  school_id: number | null
  lga_id: number | null
  care_giver_id: number | null
  name: string | null
  date_of_birth: string | null
  student_admission_number: string | null
  class: string | null
  disabilities: string | null
  biometrics_photo: string | null
  uniform: number | null
  text_book: number | null
  school_distance: string | null
  materials: number | null
  photo: number | null
  attendance: number | null
  cohurt: number | null
  created_at: string | null
  updated_at: string | null
  term_attendances: object | null
  term_id: number | null
  is_bvn_verified: number | null
  overall_attendance: number | null
  is_eligible: boolean
  note: string | null
}

interface Schools {
  id: number | null
  lga_id: number | null
  name: string | null
  code: string | null
  education_level: string | null
  principal_name: string | null
  principal_phone: string | null
  longitude: string | null
  latitude: string | null
  daily_attendance_percentage: string | null
  created_at: string | null
  updated_at: string | null
  students: Student[]
}

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

const currentItems = ref<Student[]>([])
const students = ref<Student[]>([])
const schoolData = ref<Schools | null>(null)
const noteModal = ref(false)
const selectedNote = ref('')
const isProcessing = ref(false)

const headers = [
  { title: 'Student Name', align: 'start', key: 'name' },
  { title: 'Class', key: 'class', align: 'center' },
  { title: 'Date of Birth', key: 'date_of_birth', align: 'center' },
  { title: 'Attendance', key: 'overall_attendance', align: 'center' },

  // { title: 'Account Status', key: 'is_bvn_verified', align: 'center' },
  { title: 'Eligibility', key: 'is_eligible', align: 'center' },
]

const isLoaded = ref(false)
const totalItems = ref(0)
const itemsPerPage = ref(10)
const search = ref('')

// Computed properties for summary stats
const eligibleCount = computed(() =>
  schoolData.value?.students.filter(s => s.is_eligible).length ?? 0,
)

const ineligibleCount = computed(() =>
  schoolData.value?.students.filter(s => !s.is_eligible).length ?? 0,
)

const fetchData = async () => {
  showLoadingTable.value = true
  isLoaded.value = false

  if (!props.termId || !props.school || !props.payment || !props.cohurt) {
    showLoadingTable.value = true
    alertInfo.show = true
    alertInfo.title = 'Info'
    alertInfo.message = 'Please use the filter to get student info'
    alertInfo.type = 'info'

    return
  }

  try {
    const response = await callApi({
      url: `disbursement/query?term_id=${props.termId}&school_id=${props.school}&payment_type_id=${props.payment}&cohurt=${props.cohurt}`,
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()

    if (response.ok) {
      schoolData.value = responseData.data
      if (schoolData.value && schoolData.value.students) {
        totalItems.value = schoolData.value.students.length
        currentItems.value = schoolData.value.students
        students.value = Object.values(responseData.data.students)
        showLoadingTable.value = false
      }
      else {
        alertInfo.show = true
        alertInfo.title = 'Error'
        alertInfo.message = 'Invalid school data received'
        alertInfo.type = 'error'
      }
    }
    else if (response.status === 401) {
      user.removeUser()
      router.push({ name: 'login' })
    }
    else {
      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = responseData.message || 'Something went wrong'
      alertInfo.type = 'error'
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'Something went wrong'
    alertInfo.type = 'error'
    if (user.isTokenExpired())
      user.removeUser()
  }
  finally {
    isLoaded.value = true
  }
}

const processPayout = async () => {
  if (!props.school || !props.termId || !props.payment) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'Missing required parameters for payout'
    alertInfo.type = 'error'

    return
  }

  isProcessing.value = true
  try {
    const response = await callApi({
      url: `disbursement/request?school_id=${props.school}&term_id=${props.termId}&payment_type_id=${props.payment}`,
      method: 'POST',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()

    if (response.ok) {
      alertInfo.show = true
      alertInfo.title = 'Success'
      alertInfo.message = 'Payout processed successfully'
      alertInfo.type = 'success'
    }
    else {
      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = responseData.message || 'Failed to process payout'
      alertInfo.type = 'error'
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'Failed to process payout'
    alertInfo.type = 'error'
  }
  finally {
    isProcessing.value = false
  }
}

const showNote = (note: string) => {
  selectedNote.value = JSON.parse(note).join(', ')
  noteModal.value = true
}

const filterItems = (items: Student[], searchValue: string): Student[] => {
  return items.filter(item =>
    item.name?.toLowerCase().includes(searchValue.toLowerCase()),
  )
}

// Sort items
const sortItems = (items: Student[], sortBy: { key: string; order: string }[]): Student[] => {
  if (sortBy.length === 0)
    return items

  const [sortItem] = sortBy

  return [...items].sort((a, b) => {
    const aValue = a[sortItem.key as keyof Student]
    const bValue = b[sortItem.key as keyof Student]

    if (typeof aValue === 'string' && typeof bValue === 'string')
      return sortItem.order === 'desc' ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue)
    if (typeof aValue === 'number' && typeof bValue === 'number')
      return sortItem.order === 'desc' ? bValue - aValue : aValue - bValue

    return 0
  })
}

const loadItems = ({ page, itemsPerPage: itemsPerPageOption, sortBy }: any) => {
  const filteredItems = filterItems(students.value, search.value)
  const sortedItems = sortItems(filteredItems, sortBy)

  const start = (page - 1) * itemsPerPageOption
  const end = start + itemsPerPageOption

  currentItems.value = sortedItems.slice(start, end)
  totalItems.value = filteredItems.length

  return { items: currentItems.value, total: totalItems.value }
}

const openExportModal = () => {
  exportModal.value = true
  exportType.value = null
}

const exportCSV = () => {
  if (students.value.length === 0) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'No data to export'
    alertInfo.type = 'error'

    return
  }

  const parser = new Parser()
  const csv = parser.parse(students.value)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'lga_export.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  exportModal.value = false
}

const exportExcel = () => {
  if (students.value.length === 0) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'No data to export'
    alertInfo.type = 'error'

    return
  }

  const ws = XLSX.utils.json_to_sheet(students.value)
  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, ws, 'LGA Export')
  XLSX.writeFile(wb, 'lga_export.xlsx')

  exportModal.value = false
}

onMounted(() => {
  loadItems({ page: 1, itemsPerPage: itemsPerPage.value, sortBy: [] })
})

watch(search, () => {
  totalItems.value = filterItems(students.value, search.value).length
})

onMounted(() => {
  fetchData()
})

onMounted(() => {
  const tokenCheckInterval = setInterval(() => {
    if (user.isTokenExpired()) {
      user.removeUser()
      clearInterval(tokenCheckInterval)
    }
  }, 20 * 60 * 1000) // Check every 5 minutes

  onUnmounted(() => {
    clearInterval(tokenCheckInterval)
  })
})

watch(
  () => [props.termId, props.school, props.payment],
  () => {
    fetchData()
  },
  { immediate: true },
)
</script>

<template>
  <!-- Snackbar -->
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

  <!-- Main Layout -->
  <VRow>
    <!-- School Summary Cards -->
    <VCol cols="12">
      <VRow>
        <VCol
          cols="12"
          md="4"
        >
          <VCard
            variant="tonal"
            color="primary"
          >
            <VCardItem>
              <div class="d-flex align-center">
                <VIcon
                  icon="bxs-school"
                  class="me-2"
                />
                <VCardTitle>School</VCardTitle>
              </div>
            </VCardItem>
            <VCardText>
              <p class="text-h6">
                {{ schoolData?.name }}
              </p>
            </VCardText>
          </VCard>
        </VCol>

        <VCol
          cols="12"
          md="4"
        >
          <VCard
            variant="tonal"
            color="primary"
          >
            <VCardItem>
              <div class="d-flex align-center">
                <VIcon
                  icon="bx-check-circle"
                  class="me-2"
                />
                <VCardTitle>Eligible Students</VCardTitle>
              </div>
            </VCardItem>
            <VCardText>
              <p class="text-h4">
                {{ eligibleCount }}
              </p>
            </VCardText>
          </VCard>
        </VCol>

        <VCol
          cols="12"
          md="4"
        >
          <VCard
            variant="tonal"
            color="primary"
          >
            <VCardItem>
              <div class="d-flex align-center">
                <VIcon
                  icon="bx-x-circle"
                  class="me-2"
                />
                <VCardTitle>Ineligible Students</VCardTitle>
              </div>
            </VCardItem>
            <VCardText>
              <p class="text-h4">
                {{ ineligibleCount }}
              </p>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </VCol>
    <!-- Data Table Section -->
    <VCol
      v-if="isLoaded && !showLoadingTable"
      cols="12"
    >
      <VCard>
        <VCardTitle class="px-4 pt-4">
          Students List
        </VCardTitle>
        <VCardText>
          <VRow justify="space-between">
            <VCol
              cols="12"
              md="7"
            >
              <VTextField
                v-model="search"
                prepend-inner-icon="bx-search"
                label="Search Students"
                density="compact"
                hide-details
                class="mb-4"
              />
            </VCol>
            <VCol
              cols="12"
              md="4"
              class="d-flex gap-2"
            >
              <VBtn
                class="text-subtitle-1"
                text="Export Records"
                size="x-large"
                density="compact"
                @click="openExportModal"
              />
              <VBtn
                color="green"
                class="text-subtitle-1"
                :loading="isProcessing"
                :disabled="isProcessing"
                size="x-large"
                prepend-icon="bx-money"
                density="compact"
                text="Submit Payment"
                @click="processPayout"
              />
            </VCol>
          </VRow>

          <VDataTableServer
            v-model:items-per-page="itemsPerPage"
            :headers="headers"
            :items="currentItems"
            :items-length="totalItems"
            :loading="!isLoaded"
            :search="search"
            @update:options="loadItems"
          >
            <template #item.is_eligible="{ item }">
              <VChip
                v-if="item.raw.is_eligible"
                color="success"
                size="small"
              >
                Eligible
              </VChip>
              <VChip
                v-else
                color="error"
                size="small"
                @click="showNote(item.raw.note)"
              >
                Ineligible
              </VChip>
            </template>
            <!--
              <template #item.is_bvn_verified="{ item }">
              <VChip
              v-if="item.raw.is_bvn_verified === 1"
              color="success"
              size="small"
              >
              Verified
              </VChip>
              <VChip
              v-else
              color="error"
              size="small"
              >
              Unverified
              </VChip>
              </template>
              <template #item.overall_attendance="{ item }">
              {{ item.raw.overall_attendance }}%
              </template>
            -->
          </VDataTableServer>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Loading Indicator -->
    <VCol
      v-else
      cols="12"
    >
      <LoadingTable type="School Disbursments" />
    </VCol>
  </VRow>
  <VDialog
    v-model="noteModal"
    max-width="500"
  >
    <VCard>
      <VRow justify="space-between">
        <VCol cols="auto">
          <VCardText class="my-auto text-h5 font-weight-bold">
            Ineligibility Reason
          </VCardText>
        </VCol>
        <VCol cols="auto">
          <VBtn
            icon="bx-x"
            color="error"
            variant="text"
            @click="noteModal = false"
          />
        </VCol>
      </VRow>

      <VCardText class="pa-4 text-error text-center">
        {{ selectedNote }}
      </VCardText>
    </VCard>
  </VDialog>
  <VDialog
    v-model="exportModal"
    width="500"
    persistent
  >
    <VCard class="pa-6">
      <VRow justify="space-between">
        <VCol cols="auto">
          <VCardText class="text-h5 text-center mb-4">
            Export Records
          </VCardText>
        </VCol>
        <VCol cols="auto">
          <VBtn
            icon="bx-x"
            variant="text"
            @click="exportModal = false"
          />
        </VCol>
      </VRow>

      <VCardText>
        <VRow class="d-flex justify-center">
          <VCol
            cols="12"
            md="5"
            class="d-flex justify-center"
          >
            <VBtn
              color="primary"
              variant="elevated"
              size="x-large"
              class="mx-2"
              @click="exportCSV"
            >
              <VIcon
                start
                icon="bx-file"
              />
              CSV
            </VBtn>
            <VBtn
              color="success"
              variant="elevated"
              size="x-large"
              @click="exportExcel"
            >
              <VIcon
                start
                icon="bx-table"
              />
              Excel
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style scoped>
.no-wrap {
  white-space: nowrap;
}

.v-data-table {
  font-size: 0.85rem;
}
</style>
