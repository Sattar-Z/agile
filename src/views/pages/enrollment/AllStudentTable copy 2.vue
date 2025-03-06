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

// New filter refs
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
  error_message: string | null
  school: Schools
  lga: Lgas
}

interface StudentFormData {
  name: string
  cohurt: string
  lga_id: number | string
  school_id: number | string
  care_giver_id: string
  date_of_birth: string
  class: string
  gender: string
  disabilities: string
  uniform: boolean
  text_book: boolean
  school_distance: string
  materials: boolean
  school_bag: boolean
}

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

const StudentManagementModal = ref(false)
const selectedStudentId = ref<number | null>(null)

const headers = ref([
  { title: 'Students', align: 'start', sortable: true, key: 'name', value: 'name' },
  { title: 'LGA', key: 'lga.name', sortable: true, align: 'center', value: 'lga.name' },
  { title: 'School', key: 'school.name', sortable: true, align: 'center', value: 'school.name' },
  { title: 'Admission No', key: 'student_admission_number', align: 'center', value: 'student_admission_number' },
  { title: 'Class', key: 'class', align: 'center', value: 'class' },
  { title: 'DOB', key: 'date_of_birth', align: 'center', value: 'date_of_birth' },
  { title: 'Care Giver Acc.', key: 'care_giver.is_bvn_verfied', align: 'center', value: 'care_giver.is_bvn_verfied' },
  { title: 'Eligibility', key: 'error_message', sortable: true, align: 'center', value: 'error_message' },
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

const formData = ref<StudentFormData>({
  name: '',
  cohurt: '',
  lga_id: '',
  school_id: '',
  care_giver_id: '',
  date_of_birth: '',
  class: '',
  gender: '',
  disabilities: '',
  uniform: false,
  text_book: false,
  school_distance: '',
  materials: false,
  school_bag: false,
})

interface Lga {
  id: number
  name: string
}

const lga = ref<Lga[]>([])
const schools = ref<Lga[]>([])

// Get schools for a specific LGA
const getSchoolsByLga = (lgaId: number) => {
  return schools.value.filter(school => {
    const schoolObj = school as unknown as Schools;
    return schoolObj.lga_id === lgaId;
  });
}

// Toggle filter visibility
const toggleFilters = () => {
  showFilters.value = !showFilters.value;
}

// Reset filters
const resetFilters = () => {
  selectedLgas.value = [];
  selectedSchools.value = [];
  applyFilters();
}

// Apply filters to the data
const applyFilters = () => {
  if (selectedLgas.value.length === 0 && selectedSchools.value.length === 0) {
    filteredStudents.value = students.value;
  } else {
    filteredStudents.value = students.value.filter(student => {
      const lgaMatch = selectedLgas.value.length === 0 || 
                      (student.lga_id && selectedLgas.value.includes(student.lga_id));
      const schoolMatch = selectedSchools.value.length === 0 || 
                         (student.school_id && selectedSchools.value.includes(student.school_id));
      
      return lgaMatch && schoolMatch;
    });
  }
  
  // Update the total items count for pagination
  totalItems.value = filteredStudents.value.length;
}

// Handle LGA selection change
const onLgaChange = () => {
  // Reset school selection when LGA changes
  selectedSchools.value = [];
  applyFilters();
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

    if (response.ok) {
      lga.value = responseData.data
    }
  } catch (error) {
    console.error('Error fetching LGA data:', error)
  } finally {
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
    if (response.ok) {
      schools.value = responseData.data
    }
  } catch (error) {
    console.error('Error fetching school data:', error)
  } finally {
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
    return
  }
  
  verifyingBvn.value = bvnId
  try {
    // Your BVN verification logic here
  } finally {
    verifyingBvn.value = null
  }
}

function openStudentDetails(student: Students) {
  selectedStudentId.value = student.id
  showStudentDetails.value = true
}

// Filter items based on search and filters
const filterItems = (items: Students[], searchValue: string): Students[] => {
  // First apply LGA and School filters
  let filtered = items;
  
  if (selectedLgas.value.length > 0 || selectedSchools.value.length > 0) {
    filtered = items.filter(item => {
      const lgaMatch = selectedLgas.value.length === 0 || 
                      (item.lga_id && selectedLgas.value.includes(item.lga_id));
      const schoolMatch = selectedSchools.value.length === 0 || 
                         (item.school_id && selectedSchools.value.includes(item.school_id));
      
      return lgaMatch && schoolMatch;
    });
  }
  
  // Then apply text search
  if (!searchValue) return filtered;
  
  return filtered.filter(item => {
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

// Load items with pagination, sorting, and filtering
const loadItems = (options: any) => {
  const { page, itemsPerPage, sortBy } = options
  
  // Apply search and custom filters
  const searchedAndFilteredItems = filterItems(students.value, search.value)
  
  // Apply sorting
  const sortedItems = sortItems(searchedAndFilteredItems, sortBy)
  
  // Calculate pagination
  const startIndex = (page - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, sortedItems.length)
  const currentItems = sortedItems.slice(startIndex, endIndex)
  
  // Update total for pagination
  totalItems.value = searchedAndFilteredItems.length
  
  return currentItems
}

// Main sorting function
const sortItems = (items: Students[], sortBy: { key: string; order: string }[]): Students[] => {
  if (sortBy.length === 0)
    return items
    
  // Your sorting logic here
  return items
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
  'Account Number': careGiver.accounts[0].account_number || '',
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
            class="d-flex justify-end align-center pr-4"
          >
            <VBtn
              variant="outlined"
              color="white"
              class="mr-2"
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
            <VCard class="pa-4 mb-4" flat>
              <VRow>
                <VCol cols="12" sm="6" md="4">
                  <VAutocomplete
                    v-model="selectedLgas"
                    :items="lga"
                    item-title="name"
                    item-value="id"
                    label="Filter by LGA"
                    multiple
                    chips
                    closable-chips
                    :loading="lgaLoading"
                    hide-details
                    class="mb-4"
                    @update:model-value="onLgaChange"
                  />
                </VCol>
                
                <VCol cols="12" sm="6" md="4">
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
                    closable-chips
                    :loading="studentLoading"
                    hide-details
                    class="mb-4"
                    @update:model-value="applyFilters"
                  />
                </VCol>
                
                <VCol cols="12" sm="12" md="4" class="d-flex align-center">
                  <VBtn
                    color="error"
                    variant="outlined"
                    class="ml-auto"
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
            :items="loadItems({ page: 1, itemsPerPage: itemsPerPage.value, sortBy: [] })"
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
                <VBtn
                  v-if="Admin"
                  density="compact"
                  variant="tonal"
                  color="primary"
                  text="Edit"
                  @click="openEditModal(item.raw)"
                />
                <VBtn
                  v-if="Admin"
                  density="compact"
                  variant="tonal"
                  color="error"
                  text="Delete"
                  @click="openDeleteModal(item.raw)"
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
          </VDataTableServer>
        </VRow>
      </VCard>
    </VCol>
  </VRow>
  
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
        <p class="mb-4">Select export format:</p>
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
        <div class="text-subtitle-1 mb-2">Export will include:</div>
        <div class="text-body-2 mb-1">
          <strong>LGA Filter:</strong> {{ selectedLgas.length ? 'Selected LGAs only' : 'All LGAs' }}
        </div>
        <div class="text-body-2">
          <strong>School Filter:</strong> {{ selectedSchools.length ? 'Selected Schools only' : 'All Schools' }}
        </div>
        <div v-if="search" class="text-body-2 mt-1">
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
  
  <!-- Student Details Modal -->
  <StudentDetailsModal
    v-if="showStudentDetails"
    v-model="showStudentDetails"
    :student-id="selectedStudentId"
  />
</template>
