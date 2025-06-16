<script setup lang="ts">
import { Parser } from '@json2csv/plainjs'
import moment from 'moment'
import { useRouter } from 'vue-router'
import { VDataTableServer } from 'vuetify/labs/VDataTable'
import * as XLSX from 'xlsx'
import LoadingTable from './LoadingTable.vue'
import StudentDetailsModal from './StudentDetailsModal.vue'
import { isAdmin } from '@/middlewares/auth'

import { callApi } from '@/helpers/request'
import { useUserStore } from '@/stores/user'

const token = ref('')
const router = useRouter()
const showStudentDetails = ref(false)
const errorMessageModal = ref(false)
const selectedErrorMessage = ref('')
const lgaLoading = ref(false)
const user = useUserStore()
const Admin = ref(isAdmin())
const studentLoading = ref(false)
const selectedLgas = ref<number[]>([])
const selectedSchools = ref<number[]>([])
const showFilters = ref(false)

const showErrorMessage = (message: string) => {
  selectedErrorMessage.value = message
  errorMessageModal.value = true
}

const formatDate = (date: string) => moment(date).format('YYYY-MM-DD')

token.value = user.getUserInfo().token

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
}

interface Lgas {
  id: number | null
  name: string | null
  daily_attendance_percentage: string | null
  created_at: string | null
}

interface Bvn {
  id: number | null
  bvn: string | null
}

interface Nin {
  id: number | null
  nin: string | null
}

interface Account {
  id: number | null
  care_giver_id: number | null
  account_name: string | null
  account_number: string | null
  bank_code: string | null
  created_at: string | null
  updated_at: string | null
  bvn_id: number | null
  is_verified: number | null
  kyc_level: string | null
  error_message: string | null
}

interface CareGiver {
  id: number | null
  bvn_id: number | null
  nin_id: number | null
  name: number | null
  phone: string | null
  address: string | null
  date_of_birth: string | null
  community: string | null
  gender: string | null
  qualification: string | null
  income: string | null
  is_employed: string | null
  certificate: number | null
  is_bvn_verfied: number | null
  is_nin_verfied: number | null
  date_collected: string | null
  status: string | null
  nin: Nin
  bvn: Bvn
  accounts: Account[]
  created_at: string | null
  updated_at: string | null
}

interface Students {
  id: number | null
  school_id: number | null
  lga_id: number | null
  care_giver_id: number | null
  name: string | null
  cohurt: string | null
  date_of_birth: string | null
  student_admission_number: string | null
  class: string | null
  disabilities: string | null
  uniform: number | null
  text_book: number | null
  school_bag: number | null
  school_distance: string | null
  materials: number | null
  care_giver: CareGiver
  created_at: string | null
  updated_at: string | null
  bank_name: string | null
  account_number: string | null
  error_message: string | null
  school: Schools
  lga: Lgas
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
const selectedStudentId = ref<number | null>(null)

const headers = ref([
  { title: 'Students', align: 'start', sortable: true, key: 'name', value: 'name' },
  { title: 'LGA', key: 'lga.name', sortable: true, align: 'center', value: 'lga.name' },
  { title: 'School', key: 'school.name', sortable: true, align: 'center', value: 'school.name' },
  { title: 'Admission No', key: 'student_admission_number', align: 'center', value: 'student_admission_number' },
  { title: 'Class', key: 'class', align: 'center', value: 'class' },
  { title: 'DOB', key: 'date_of_birth', align: 'center', value: 'date_of_birth' },

  // { title: 'Eligibility', key: 'error_message', sortable: true, align: 'center', value: 'error_message' },
  { title: 'Date Uploaded', key: 'created_at', sortable: true, align: 'center', value: 'created_at' },
  { title: 'Action', key: 'action', align: 'center', value: 'action' },
] as const)

const students = ref<Students[]>([])
const isLoaded = ref(false)
const totalItems = ref(0)
const itemsPerPage = ref(10)
const search = ref('')
const exportModal = ref(false)
const exportType = ref<'CSV' | 'Excel' | null>(null)
const verifyingBvn = ref<number | null>(null)
const filteredStudents = ref<Students[]>([])

interface Lga {
  id: number
  name: string
}

const lga = ref<Lga[]>([])
const schools = ref<Lga[]>([])

// Toggle filter visibility
const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

// Apply filters to the data
const applyFilters = () => {
  if (selectedLgas.value.length === 0 && selectedSchools.value.length === 0) {
    filteredStudents.value = students.value
  }
  else {
    filteredStudents.value = students.value.filter(student => {
      const lgaMatch = selectedLgas.value.length === 0
                      || (student.lga_id && selectedLgas.value.includes(student.lga_id))

      const schoolMatch = selectedSchools.value.length === 0
                         || (student.school_id && selectedSchools.value.includes(student.school_id))

      return lgaMatch && schoolMatch
    })
  }

  // Update the total items count for pagination
  totalItems.value = filteredStudents.value.length
}

// Reset filters
const resetFilters = () => {
  selectedLgas.value = []
  selectedSchools.value = []
  applyFilters()
}

// Handle LGA selection change
const onLgaChange = () => {
  // Reset school selection when LGA changes
  selectedSchools.value = []
  applyFilters()
}

const fetchLgaData = async () => {
  lgaLoading.value = true
  try {
    const response = await callApi({
      url: 'lgas',
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()
    if (!response.ok) {
      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = responseData.message || 'LGA list failed'
      alertInfo.type = 'error'
    }
    else {
      lga.value = responseData.data.lgas
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'LGA list error'
    alertInfo.type = 'error'
    if (user.isTokenExpired())
      user.removeUser()
  }
  finally {
    lgaLoading.value = false
  }
}

const fetchStudentData = async () => {
  studentLoading.value = true
  try {
    const response = await callApi({
      url: 'schools',
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()
    if (!response.ok) {
      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = responseData.message || 'Schools list failed'
      alertInfo.type = 'error'
    }
    else {
      schools.value = responseData.data
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'Schools list error'
    alertInfo.type = 'error'
    if (user.isTokenExpired())
      user.removeUser()
  }
  finally {
    studentLoading.value = false
  }
}

const fetchData = async () => {
  isLoaded.value = false
  try {
    const response = await callApi({
      url: 'students',
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()

    if (response.ok) {
      students.value = Object.values(responseData.data)

      // Initialize filtered students with all students
      filteredStudents.value = students.value
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
      // Update both the main students array and current items being displayed
      const updateStudent = (studentArray: Students[]) => {
        const studentIndex = studentArray.findIndex(
          student => student.care_giver.bvn_id === bvnId,
        )

        if (studentIndex !== -1)
          studentArray[studentIndex].care_giver.is_bvn_verfied = 1
      }

      updateStudent(students.value)
      updateStudent(currentItems.value)

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
  selectedStudentId.value = student.id
  showStudentDetails.value = true
}

// Filter items based on search
const filterItems = (items: Students[], searchValue: string): Students[] => {
  return items.filter(item => {
    if (!item.name)
      return false
    const nameMatch = item.name?.toLowerCase().includes(searchValue.toLowerCase()) ?? false
    const schoolMatch = item.school?.name?.toLowerCase().includes(searchValue.toLowerCase()) ?? false
    const lgaMatch = item.lga.name?.toLowerCase().includes(searchValue.toLowerCase()) ?? false

    return nameMatch || schoolMatch || lgaMatch
  })
}

const openExportModal = () => {
  exportModal.value = true
  exportType.value = null
}

// Helper function to get nested values
const getNestedValue = (item: Students, key: string): any => {
  return key.split('.').reduce((value, k) => value?.[k], item as any)
}

// Helper function to compare dates
const compareDates = (aValue: any, bValue: any, order: string): number => {
  if (!aValue)
    return order === 'desc' ? 1 : -1
  if (!bValue)
    return order === 'desc' ? -1 : 1

  const dateA = new Date(aValue).getTime()
  const dateB = new Date(bValue).getTime()

  return order === 'desc' ? dateB - dateA : dateA - dateB
}

// Helper function to compare strings
const compareStrings = (aValue: string, bValue: string, order: string): number => {
  return order === 'desc'
    ? bValue.localeCompare(aValue)
    : aValue.localeCompare(bValue)
}

// Helper function to compare numbers
const compareNumbers = (aValue: number, bValue: number, order: string): number => {
  return order === 'desc' ? bValue - aValue : aValue - bValue
}

// Main sorting function
const sortItems = (items: Students[], sortBy: { key: string; order: string }[]): Students[] => {
  if (sortBy.length === 0)
    return items

  const [sortItem] = sortBy

  return [...items].sort((a, b) => {
    const aValue = getNestedValue(a, sortItem.key)
    const bValue = getNestedValue(b, sortItem.key)

    if (sortItem.key === 'care_giver.date_collected')
      return compareDates(aValue, bValue, sortItem.order)

    if (typeof aValue === 'string' && typeof bValue === 'string')
      return compareStrings(aValue, bValue, sortItem.order)

    if (typeof aValue === 'number' && typeof bValue === 'number')
      return compareNumbers(aValue, bValue, sortItem.order)

    return 0
  })
}

// Update loadItems to use the filtered data
const loadItems = ({ page, itemsPerPage: itemsPerPageOption, sortBy }) => {
  // Apply LGA and School filters first
  let filteredItems = students.value

  if (selectedLgas.value.length > 0 || selectedSchools.value.length > 0) {
    filteredItems = filteredItems.filter(student => {
      const lgaMatch = selectedLgas.value.length === 0
                      || (student.lga_id && selectedLgas.value.includes(student.lga_id))

      const schoolMatch = selectedSchools.value.length === 0
                         || (student.school_id && selectedSchools.value.includes(student.school_id))

      return lgaMatch && schoolMatch
    })
  }

  // Then apply search filter
  filteredItems = filterItems(filteredItems, search.value)

  // Sort the filtered items
  const sortedItems = sortItems(filteredItems, sortBy)

  // Apply pagination
  const start = (page - 1) * itemsPerPageOption
  const end = start + itemsPerPageOption

  currentItems.value = sortedItems.slice(start, end)
  totalItems.value = filteredItems.length

  return { items: currentItems.value, total: totalItems.value }
}

interface ExportFormat {
  [key: string]: string | number | null
}

const getYesNoValue = (value: boolean | number | null): string =>
  value ? 'Yes' : 'No'

const getDisabilityInfo = (disability: string | null): {
  isDisabled: string
  type: string
} => {
  const normalizedDisability = disability?.toUpperCase() || 'NONE'

  return {
    isDisabled: normalizedDisability === 'NONE' ? 'No' : 'Yes',
    type: normalizedDisability === 'NONE' ? 'N/A' : (disability || ''),
  }
}

const safeAccess = <T extends object>(obj: T | undefined, fallback: T = {} as T): T => {
  return obj ?? fallback
}

const formatCaregiverEmployment = (isEmployed?: boolean): string => isEmployed ? 'Employed' : 'Unemployed'

const formatCaregiverDetails = (careGiver: CareGiver) => ({
  'Name of Caregiver': careGiver.name || '',
  'Caregiver Phone Number': careGiver.phone || '',
  'Address of Caregiver': careGiver.address || '',
  'Caregiver Community': careGiver.community || '',
  'Gender of Caregiver': careGiver.gender || '',
  'Caregiver Date of Birth': careGiver.date_of_birth || '',
  'Caregiver Highest Qualification': careGiver.qualification || '',
  'Caregiver Employment Status': formatCaregiverEmployment(!!careGiver.is_employed),
  'Caregiver Average Monthly Income': careGiver.income || '',
  'Bvn': careGiver.bvn.bvn || '',
  'Nin': careGiver.nin.nin || '',
})

const formatStudentForExport = (student: Students): ExportFormat => {
  const careGiver = safeAccess(student.care_giver)
  const school = safeAccess(student.school)
  const alga = safeAccess(student.lga)
  const disability = getDisabilityInfo(student.disabilities)

  return {
    'Cohort': student.cohurt || '',
    'LGA': alga.name || '',
    'Name of Current School': school.name || '',
    'School Code': school.code || '',
    'Name of Student (Beneficiary)': student.name || '',
    'Student Admission Number': student.student_admission_number || '',
    'Date of Birth': student.date_of_birth || '',
    'Grade/Class': student.class || '',
    'Bank': student.bank_name || '',
    'Account Number': student.account_number || '',
    'Disabled': disability.isDisabled,
    'Type of Disability': disability.type,
    'Distance from School (in KMs)': student.school_distance || '',
    'Textbooks': getYesNoValue(student.text_book),
    'Uniform': getYesNoValue(student.uniform),
    'Writing Materials': getYesNoValue(student.materials),
    'School Bag': getYesNoValue(student.school_bag),
    ...formatCaregiverDetails(careGiver),
  }
}

const exportCSV = () => {
  if (!students.value || students.value.length === 0) {
    return {
      success: false,
      message: 'No data to export',
    }
  }

  try {
    // Export filtered data instead of all data
    const dataToExport = filterItems(students.value, search.value)
    const formattedData = dataToExport.map(formatStudentForExport)
    const parser = new Parser()
    const csv = parser.parse(formattedData)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    return {
      success: true,
      message: 'Export completed successfully',
    }
  }
  catch (error) {
    console.error('Export error:', error)

    return {
      success: false,
      message: 'Failed to export data',
    }
  }
}

const exportExcel = () => {
  if (!students.value || students.value.length === 0) {
    return {
      success: false,
      message: 'No data to export',
    }
  }

  try {
    // Export filtered data instead of all data
    const dataToExport = filterItems(students.value, search.value)
    const formattedData = dataToExport.map(formatStudentForExport)
    const worksheet = XLSX.utils.json_to_sheet(formattedData)
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students')
    XLSX.writeFile(workbook, `students_export_${new Date().toISOString().split('T')[0]}.xlsx`)

    return {
      success: true,
      message: 'Export completed successfully',
    }
  }
  catch (error) {
    console.error('Export error:', error)

    return {
      success: false,
      message: 'Failed to export data',
    }
  }
}

onMounted(() => {
  loadItems({ page: 1, itemsPerPage: itemsPerPage.value, sortBy: [] })
})

watch(search, () => {
  totalItems.value = filterItems(students.value, search.value).length
})

// Watch for filter changes and call loadItems
watch([selectedLgas, selectedSchools, search], () => {
  loadItems({
    page: 1,
    itemsPerPage: itemsPerPage.value,
    sortBy: [],
  })
})

// Watch for filter changes
watch([selectedLgas, selectedSchools], () => {
  applyFilters()
})

onMounted(() => {
  fetchData()
  fetchLgaData()
  fetchStudentData()
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
    <VCol
      v-if="isLoaded"
      cols="12"
    >
      <VCard
        class="cursor-pointer"
        variant="tonal"
        color="primary"
        @click="openExportModal"
      >
        <VCardItem class="text-center">
          Download Beneficiary Report
        </VCardItem>
      </VCard>
    </VCol>
    <!-- Data Table Section -->
    <VCol
      v-if="isLoaded"
      cols="12"
    >
      <VCard>
        <VRow
          no-gutters
          justify="start"
          class="bg-primary"
        >
          <!-- Title -->
          <VCol
            cols="12"
            md="4"
          >
            <VCardTitle class="font-weight-bold text-h5 my-3 text-white">
              Beneficiaries
            </VCardTitle>
          </VCol>
          <!-- Filter toggle button -->
          <VCol
            cols="12"
            md="8"
            class="d-flex justify-end align-center pw-4"
          >
            <VBtn
              variant="outlined"
              color="white"
              class="mx-4"
              @click="toggleFilters"
            >
              {{ showFilters ? 'Hide Filters' : 'Show Filters' }}
              <VIcon right>
                {{ showFilters ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
              </VIcon>
            </VBtn>
          </VCol>
        </VRow>

        <!-- Filter Section -->
        <VExpandTransition>
          <div v-show="showFilters">
            <VCard
              class="pa-4 mb-4"
              flat
            >
              <VRow>
                <VCol
                  cols="12"
                  sm="6"
                  md="4"
                >
                  <VAutocomplete
                    v-model="selectedLgas"
                    :items="lga"
                    item-title="name"
                    item-value="id"
                    label="Filter by LGA"
                    multiple
                    chips
                    density="compact"
                    closable-chips
                    :loading="lgaLoading"
                    hide-details
                    class="mb-4"
                    @update:model-value="onLgaChange"
                  />
                </VCol>
                <VCol
                  cols="12"
                  sm="6"
                  md="4"
                >
                  <VAutocomplete
                    v-model="selectedSchools"
                    :items="selectedLgas.length ? schools.filter(school => {
                      const schoolObj = school as unknown as Schools;
                      return selectedLgas.includes(schoolObj.lga_id || 0);
                    }) : schools"
                    item-title="name"
                    item-value="id"
                    label="Filter by School"
                    multiple
                    chips
                    density="compact"
                    closable-chips
                    :loading="studentLoading"
                    hide-details
                    class="mb-4"
                    @update:model-value="applyFilters"
                  />
                </VCol>
                <VCol
                  cols="12"
                  sm="12"
                  md="4"
                >
                  <VBtn
                    color="error"
                    variant="outlined"
                    class="mx-auto"
                    @click="resetFilters"
                  >
                    Reset Filters
                  </VBtn>
                </VCol>
              </VRow>
            </VCard>
          </div>
        </VExpandTransition>

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
                label="Search for Student / school / lga"
                density="compact"
                hide-details
              />
            </VCardText>
          </VCol>
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
              <div class="d-flex flex-column flex-sm-row gap-2">
                <VBtn
                  density="compact"
                  variant="tonal"
                  text="View"
                  @click="openStudentDetails(item.raw)"
                />
              </div>
            </template>
            <template #item.created_at="{ item }">
              {{ formatDate(item.raw.created_at) }}
            </template>
            <template #item.error_message="{ item }">
              <VTooltip :text="item.raw.error_message">
                <template #activator="{ props }">
                  <VChip
                    v-if="item.raw.error_message"
                    v-bind="props"
                    text="False Record"
                    color="error"
                  />
                  <VChip
                    v-else
                    text="Eligible"
                    color="success"
                  />
                </template>
              </VTooltip>
            </template>
            <template #item.care_giver.is_bvn_verfied="{ item }">
              <VChip
                v-if="item.raw.care_giver.is_bvn_verfied === 1"
                density="compact"
                text="Account Verified"
                color="success"
              />
              <VChip
                v-else-if="item.raw.bvn?.is_pending === 1"
                density="compact"
                text="Processing"
                color="info"
              />
              <template v-else-if="item.raw.bvn?.error_message">
                <VBtn
                  density="compact"
                  variant="tonal"
                  color="error"
                  @click="showErrorMessage(item.raw.bvn.error_message)"
                >
                  Verification Failed
                </VBtn>
              </template>
              <VBtn
                v-else-if="Admin && item.raw.care_giver.is_bvn_verfied === 0"
                :loading="verifyingBvn === item.raw.bvn_id"
                density="compact"
                variant="outlined"
                text="Verify Account"
                @click="verifyBvn(item.raw.care_giver.bvn_id)"
              />
              <VChip
                v-else
                density="compact"
                text="Account Unverified"
                color="warning"
              />
            </template>
          </VDataTableServer>
        </vrow>
      </VCard>
    </VCol>

    <!-- Loading Indicator -->
    <VCol
      v-else
      cols="12"
    >
      <LoadingTable type="Students" />
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
  <!-- Export Modal -->
  <VDialog
    v-model="exportModal"
    max-width="500px"
  >
    <VCard>
      <VCardTitle class="text-h5">
        Export Options
      </VCardTitle>
      <VCardText>
        <p class="mb-4">
          Select export format:
        </p>
        <VRadioGroup
          v-model="exportType"
          inline
        >
          <VRadio
            label="CSV"
            value="CSV"
          />
          <VRadio
            label="Excel"
            value="Excel"
          />
        </VRadioGroup>
        <!-- Show filter summary -->
        <VDivider class="my-4" />
        <div class="text-subtitle-1 mb-2">
          Export will include:
        </div>
        <div class="text-body-2 mb-1">
          <strong>LGA Filter:</strong> {{ selectedLgas.length ? 'Selected LGAs only' : 'All LGAs' }}
        </div>
        <div class="text-body-2">
          <strong>School Filter:</strong> {{ selectedSchools.length ? 'Selected Schools only' : 'All Schools' }}
        </div>
        <div
          v-if="search"
          class="text-body-2 mt-1"
        >
          <strong>Search Filter:</strong> "{{ search }}"
        </div>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          color="error"
          variant="text"
          @click="exportModal = false"
        >
          Cancel
        </VBtn>
        <VBtn
          color="primary"
          variant="text"
          :disabled="!exportType"
          @click="exportType === 'CSV' ? exportCSV() : exportExcel(); exportModal = false"
        >
          Export
        </VBtn>
      </VCardActions>
    </VCard>
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
  <StudentDetailsModal
    v-model="showStudentDetails"
    :student-id="selectedStudentId"
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
