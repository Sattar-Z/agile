<script setup lang="ts">
import { Parser } from '@json2csv/plainjs'
import { useRoute, useRouter } from 'vue-router'
import { VDataTableServer } from 'vuetify/labs/VDataTable'
import * as XLSX from 'xlsx'
import LoadingTable from './LoadingTable.vue'
import StudentDetailsModal from './StudentDetailsModal.vue'

import { callApi } from '@/helpers/request'
import { useUserStore } from '@/stores/user'

// import { toNigerianCurrency } from '@/helpers/numbers'
const token = ref('')
const router = useRouter()
const showStudentDetails = ref(false)

const route = useRoute()
const user = useUserStore()

token.value = user.getUserInfo().token

const { id, name } = route.params

interface CareGiver {
  id: number | null
  bvn_id: number | null
  nin_id: number | null
  name: number | null
  phone: string | null
  date_of_birth: string | null
  community: string | null
  gender: string | null
  qualification: string | null
  income: string | null
  is_employed: string | null
  certificate: number | null
  is_bvn_verfied: string | null
  is_nin_verfied: string | null
  date_collected: string | null
  status: string | null
  created_at: string | null
  updated_at: string | null
}

interface Students {
  id: number | null
  school_id: number | null
  lga_id: number | null
  care_giver_id: number | null
  name: string | null
  date_of_birth: string | null
  student_admission_number: string | null
  class: string | null
  disabilities: string | null
  uniform: number | null
  text_book: number | null
  school_distance: string | null
  materials: number | null
  care_giver: CareGiver
  created_at: string | null
  updated_at: string | null
}

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

const currentItems = ref<Students[]>([])
const selectedStudents = ref<Students | null>(null)
const StudentManagementModal = ref(false)

const headers = ref([
  { title: 'Students', align: 'start', sortable: false, key: 'name' },
  { title: 'Admission No', key: 'student_admission_number', align: 'center' },
  { title: 'DOB', key: 'date_of_birth', align: 'center' },
  { title: 'Care Giver Acc.', key: 'care_giver.is_bvn_verfied', align: 'center' },
  { title: 'Action', key: 'action', align: 'center' },
] as const)

const students = ref<Students[]>([])
const isLoaded = ref(false)
const totalItems = ref(0)
const itemsPerPage = ref(10)
const search = ref('')
const exportModal = ref(false)
const exportType = ref<'CSV' | 'Excel' | null>(null)
const verifyingBvn = ref<number | null>(null)

// Fetch merchant Transactions
const fetchTerminalDetails = async () => {
  isLoaded.value = false
  try {
    const response = await callApi({
      url: `school/students/${id}`,
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()

    if (response.ok) {
      students.value = Object.values(responseData.data)
      totalItems.value = students.value.length
    }
    else if (response.status === 401) {
      user.removeUser()
      router.push({ name: 'login' })
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
      // Update the specific student's care giver BVN verification status
      const studentIndex = students.value.findIndex(
        student => student.care_giver.bvn_id === bvnId,
      )

      if (studentIndex !== -1)
        students.value[studentIndex].care_giver.is_bvn_verfied = 'true'

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

function openStudentDetails(student: Students) {
  selectedStudents.value = student
  showStudentDetails.value = true
}

// Filter items based on search
const filterItems = (items: Students[], searchValue: string): Students[] => {
  return items.filter(item => {
    if (!item.name)
      return false

    return item.name?.toLowerCase().includes(searchValue.toLowerCase()) ?? false
  })
}

const openExportModal = () => {
  exportModal.value = true
  exportType.value = null
}

// Sort items
const sortItems = (items: Students[], sortBy: { key: string; order: string }[]): Students[] => {
  if (sortBy.length === 0)
    return items

  const [sortItem] = sortBy

  return [...items].sort((a, b) => {
    const aValue = a[sortItem.key as keyof Students]
    const bValue = b[sortItem.key as keyof Students]

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
  link.download = 'student_export.csv'
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

  XLSX.utils.book_append_sheet(wb, ws, 'Student Export')
  XLSX.writeFile(wb, 'student_export.xlsx')

  exportModal.value = false
}

onMounted(() => {
  loadItems({ page: 1, itemsPerPage: itemsPerPage.value, sortBy: [] })
})

watch(search, () => {
  totalItems.value = filterItems(students.value, search.value).length
})

onMounted(() => {
  fetchTerminalDetails()
})
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
    <!-- Data Table Section -->
    <VCol
      v-if="isLoaded"
      cols="12"
    >
      <VCard>
        <VRow
          no-gutters
          justify="start"
        >
          <!-- Title -->
          <VCol
            cols="12"
            md="4"
          >
            <VCardText>
              <VCardTitle>{{ name }} Students</VCardTitle>
            </VCardText>
          </VCol>
        </VRow>
        <VRow
          no-gutters
          justify="space-between"
        >
          <!-- Actions -->

          <VCol
            cols="12"
            md="3"
          >
            <VCardText>
              <VTextField
                v-model="search"
                prepend-inner-icon="bx-search"
                label="Search for Students"
                density="compact"
                hide-details
              />
            </VCardText>
          </VCol>

          <VCol
            cols="12"
            md="3"
          >
            <VCardText>
              <VBtn
                class="text-subtitle-1"
                text="Export Records"
                size="x-large"
                block
                density="compact"
                @click="openExportModal"
              />
            </VCardText>
          </VCol>
        </VRow>

        <!-- Data Table -->
        <VDataTableServer
          v-model:items-per-page="itemsPerPage"
          :headers="headers"
          :items="currentItems"
          :items-length="totalItems"
          :loading="!isLoaded"
          :search="search"
          class="transaction-table"
          @update:options="loadItems"
        >
          <template #item.action="{ item }">
            <VBtn
              density="compact"
              variant="tonal"
              text="View"
              size="small"
              @click="openStudentDetails(item.raw)"
            />
          </template>
          <template #item.care_giver.is_bvn_verfied="{ item }">
            <VChip
              v-if="item.raw.care_giver.is_bvn_verfied === 'true'"
              density="compact"
              text="BVN Verified"
              color="success"
            />

            <VBtn
              v-else
              :loading="verifyingBvn === item.raw.care_giver.bvn_id"
              density="compact"
              variant="outlined"
              size="small"
              @click="verifyBvn(item.raw.care_giver.bvn_id || 0)"
            >
              Verify
            </VBtn>
          </template>
        </VDataTableServer>
      </VCard>
    </VCol>

    <!-- Loading Indicator -->
    <VCol
      v-else
      cols="12"
    >
      <LoadingTable type="Transactions" />
    </VCol>
  </VRow>
  <VDialog
    v-model="StudentManagementModal"
    width="600"
    persistent
  >
    <VCard
      v-if="selectedStudents"
      class="pa-4"
    >
      <VRow justify="space-between">
        <VCol cols="auto">
          <VCardTitle class="text-h5 text-center mb-4">
            File Management
          </VCardTitle>
        </VCol>
        <VCol cols="auto">
          <VBtn
            icon="bx-x"
            variant="text"
            @click="StudentManagementModal = false"
          />
        </VCol>
      </VRow>

      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="6"
          />

          <VCol
            cols="12"
            md="6"
          />
        </VRow>
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
          <VCardTitle class="text-h5 text-center mb-4">
            Export Records
          </VCardTitle>
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
  <StudentDetailsModal
    v-model="showStudentDetails"
    :student="selectedStudents"
  />
</template>

<style scoped>
.no-wrap {
  white-space: nowrap;
}

.v-data-table {
  font-size: 0.85rem;
}
</style>
