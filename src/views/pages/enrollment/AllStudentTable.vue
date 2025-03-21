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

const showErrorMessage = (message: string) => {
  selectedErrorMessage.value = message
  errorMessageModal.value = true
}

const activeTab = ref('student')
const isUpdating = ref(false)
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
  gender: string | null
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

interface CaregiverFormData {
  bvn: string
  name: string
  phone: string
  address: string
  community: string
  gender: string
  date_of_birth: string
  qualification: string
  income: string
  is_employed: boolean
  account_number: string
  account_name: string
  bank_code: string
}

const caregiverFormData = ref<CaregiverFormData>({
  bvn: '',
  name: '',
  phone: '',
  address: '',
  community: '',
  gender: '',
  date_of_birth: '',
  qualification: '',
  income: '',
  is_employed: false,
  account_number: '',
  account_name: '',
  bank_code: '',
})

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

const deleteModal = ref(false)
const editModal = ref(false)
const selectedStudent = ref<Students | null>(null)
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

  // { title: 'Account Number', key: 'care_giver.accounts[0].account_number', align: 'center', value: 'care_giver.accounts[0].account_number' },
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

// const exportType = ref<'CSV' | 'Excel' | null>(null)
const verifyingBvn = ref<number | null>(null)

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

// Add new functions
const openDeleteModal = (student: Students) => {
  selectedStudent.value = student
  deleteModal.value = true
}

// Helper function to extract caregiver data
const extractCaregiverData = (caregiver: CareGiver | null): CaregiverFormData => {
  if (!caregiver) {
    return {
      bvn: '',
      name: '',
      phone: '',
      address: '',
      community: '',
      gender: '',
      date_of_birth: '',
      qualification: '',
      income: '',
      is_employed: false,
      account_number: '',
      account_name: '',
      bank_code: '',
    }
  }

  return {
    bvn: caregiver.bvn?.bvn || '',
    name: caregiver.name?.toString() || '',
    phone: caregiver.phone || '',
    address: caregiver.address || '',
    community: caregiver.community || '',
    gender: caregiver.gender || '',
    date_of_birth: caregiver.date_of_birth || '',
    qualification: caregiver.qualification || '',
    income: caregiver.income || '',
    is_employed: ['true', '1'].includes(caregiver.is_employed || ''),
    account_number: caregiver.accounts?.[0]?.account_number || '',
    account_name: caregiver.accounts?.[0]?.account_name || '',
    bank_code: caregiver.accounts?.[0]?.bank_code || '',
  }
}

// Helper function to extract student data
const extractStudentData = (student: Students | null): StudentFormData => {
  if (!student) {
    return {
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
    }
  }

  return {
    name: student.name || '',
    cohurt: student.cohurt || '',
    lga_id: student.lga?.id || '',
    school_id: student.school?.id || '',
    care_giver_id: student.care_giver_id?.toString() || '',
    date_of_birth: student.date_of_birth || '',
    class: student.class || '',
    gender: student.gender || '',
    disabilities: student.disabilities || '',
    uniform: Boolean(student.uniform),
    text_book: Boolean(student.text_book),
    school_distance: student.school_distance || '',
    materials: Boolean(student.materials),
    school_bag: Boolean(student.school_bag),
  }
}

// Simplified main function
const openEditModal = (student: Students) => {
  selectedStudent.value = student

  // Populate forms with extracted data
  formData.value = extractStudentData(student)
  caregiverFormData.value = extractCaregiverData(student?.care_giver)

  // Reset to student tab and open modal
  activeTab.value = 'student'
  editModal.value = true
}

interface Lga {
  id: number
  name: string
}

const lga = ref<Lga[]>([])
const schools = ref<Lga[]>([])

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

// const openExportModal = () => {
//   exportModal.value = true
//   exportType.value = null
// }

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

const loadItems = ({ page, itemsPerPage: itemsPerPageOption, sortBy }: any) => {
  const filteredItems = filterItems(students.value, search.value)
  const sortedItems = sortItems(filteredItems, sortBy)

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
    const formattedData = students.value.map(formatStudentForExport)
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
    const formattedData = students.value.map(formatStudentForExport)
    const ws = XLSX.utils.json_to_sheet(formattedData)
    const wb = XLSX.utils.book_new()

    // Add column widths for better readability
    const colWidths = Object.keys(formattedData[0]).map(() => ({ wch: 20 }))

    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Students Export')
    XLSX.writeFile(wb, `students_export_${new Date().toISOString().split('T')[0]}.xlsx`)

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

const deleteStudent = async () => {
  if (!selectedStudent.value?.id)
    return

  try {
    const response = await callApi({
      url: `student/delete/${selectedStudent.value.id}`,
      method: 'DELETE',
      authorized: true,
      showAlert: false,
    })

    if (response.ok) {
      alertInfo.show = true
      alertInfo.title = 'Success'
      alertInfo.message = 'Student deleted successfully'
      alertInfo.type = 'success'

      // Refresh data
      await fetchData()
    }
    else {
      const data = await response.json()

      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = data.message || 'Failed to delete student'
      alertInfo.type = 'error'
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'Something went wrong'
    alertInfo.type = 'error'
  }
  finally {
    deleteModal.value = false
  }
}

const updateStudent = async () => {
  if (!selectedStudent.value?.id || !selectedStudent.value?.care_giver?.id)
    return

  isUpdating.value = true

  try {
    // Create an array of promises for both API calls
    const promises = [
      callApi({
        url: `student/update/${selectedStudent.value.id}`,
        method: 'POST',
        data: formData.value,
        authorized: true,
        showAlert: false,
      }),
      callApi({
        url: `care_giver/update/${selectedStudent.value.care_giver.id}`,
        method: 'POST',
        data: caregiverFormData.value,
        authorized: true,
        showAlert: false,
      }),
    ]

    // Wait for both requests to complete
    const [studentResponse, caregiverResponse] = await Promise.all(promises)

    // Process responses
    if (studentResponse.ok && caregiverResponse.ok) {
      alertInfo.show = true
      alertInfo.title = 'Success'
      alertInfo.message = 'Student and caregiver information updated successfully'
      alertInfo.type = 'success'

      // Refresh data
      await fetchData()
      editModal.value = false
    }
    else {
      // Handle errors - get error messages from responses
      let studentError = null
      let caregiverError = null

      if (!studentResponse.ok) {
        const studentData = await studentResponse.json()

        studentError = studentData.message || 'Failed to update student'
      }

      if (!caregiverResponse.ok) {
        const caregiverData = await caregiverResponse.json()

        caregiverError = caregiverData.message || 'Failed to update caregiver'
      }

      // Combine error messages if both failed
      const errorMessage = [studentError, caregiverError]
        .filter(Boolean)
        .join(' and ')

      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = errorMessage || 'Failed to update records'
      alertInfo.type = 'error'
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'Something went wrong'
    alertInfo.type = 'error'
  }
  finally {
    isUpdating.value = false
  }
}

onMounted(() => {
  loadItems({ page: 1, itemsPerPage: itemsPerPage.value, sortBy: [] })
})

watch(search, () => {
  totalItems.value = filterItems(students.value, search.value).length
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
              <VCardTitle> All Students</VCardTitle>
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
                label="Search for Student / school / lga"
                density="compact"
                hide-details
              />
            </VCardText>
          </VCol>
          <!--
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
          -->
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

  <VDialog
    v-model="deleteModal"
    width="400"
    persistent
  >
    <VCard class="pa-4">
      <VCardTitle class="text-h6">
        Confirm Delete
      </VCardTitle>
      <VCardText>
        Are you sure you want to delete this student?
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          color="primary"
          variant="text"
          @click="deleteModal = false"
        >
          Cancel
        </VBtn>
        <VBtn
          color="error"
          variant="elevated"
          @click="deleteStudent"
        >
          Delete
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Edit Student Modal -->
  <!-- Edit Student & Caregiver Modal -->
  <VDialog
    v-model="editModal"
    width="900"
    persistent
  >
    <VCard class="pa-4">
      <VCardTitle class="text-h5 pb-4 d-flex align-center">
        <VIcon
          class="mx-2"
          icon="mdi-account-edit"
        />
        Edit Student & Caregiver Information
      </VCardTitle>

      <VCardText>
        <VTabs
          v-model="activeTab"
          color="primary"
          grow
        >
          <VTab value="student">
            Student Information
          </VTab>
          <VTab value="caregiver">
            Caregiver Information
          </VTab>
        </VTabs>

        <VWindow
          v-model="activeTab"
          class="mt-4"
        >
          <!-- Student Information Tab -->
          <VWindowItem value="student">
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="formData.name"
                  label="Student Name"
                  density="compact"
                  variant="solo-filled"
                  required
                  prepend-inner-icon="mdi-account"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="formData.cohurt"
                  density="compact"
                  variant="solo-filled"
                  label="Cohort"
                  prepend-inner-icon="mdi-account-group"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VAutocomplete
                  v-model="formData.lga_id"
                  :items="lga"
                  item-title="name"
                  item-value="id"
                  label="LGA"
                  required
                  density="compact"
                  variant="solo-filled"
                  :loading="lgaLoading"
                  prepend-inner-icon="mdi-map-marker"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VAutocomplete
                  v-model="formData.school_id"
                  :items="schools"
                  item-title="name"
                  item-value="id"
                  label="School"
                  required
                  density="compact"
                  variant="solo-filled"
                  :loading="studentLoading"
                  prepend-inner-icon="mdi-school"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="formData.date_of_birth"
                  label="Date of Birth"
                  density="compact"
                  variant="solo-filled"
                  type="date"
                  required
                  prepend-inner-icon="mdi-calendar"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="formData.class"
                  label="Class"
                  density="compact"
                  variant="solo-filled"
                  required
                  prepend-inner-icon="mdi-book-open-variant"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VSelect
                  v-model="formData.gender"
                  label="Gender"
                  required
                  density="compact"
                  variant="solo-filled"
                  :items="['Male', 'Female']"
                  prepend-inner-icon="mdi-gender-male-female"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="formData.disabilities"
                  density="compact"
                  variant="solo-filled"
                  label="Disabilities"
                  prepend-inner-icon="mdi-wheelchair-accessibility"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="formData.school_distance"
                  density="compact"
                  variant="solo-filled"
                  label="School Distance"
                  prepend-inner-icon="mdi-map-marker-distance"
                />
              </VCol>

              <VCol cols="12">
                <VDivider class="my-2" />
                <div class="text-subtitle-1 font-weight-medium mb-2">
                  Student Resources
                </div>
              </VCol>

              <VCol
                cols="12"
                sm="6"
                md="3"
              >
                <VCheckbox
                  v-model="formData.uniform"
                  label="Has Uniform"
                />
              </VCol>
              <VCol
                cols="12"
                sm="6"
                md="3"
              >
                <VCheckbox
                  v-model="formData.text_book"
                  label="Has Textbook"
                />
              </VCol>
              <VCol
                cols="12"
                sm="6"
                md="3"
              >
                <VCheckbox
                  v-model="formData.materials"
                  label="Has Materials"
                />
              </VCol>
              <VCol
                cols="12"
                sm="6"
                md="3"
              >
                <VCheckbox
                  v-model="formData.school_bag"
                  label="Has School Bag"
                />
              </VCol>
            </VRow>
          </VWindowItem>

          <!-- Caregiver Information Tab -->
          <VWindowItem value="caregiver">
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="caregiverFormData.name"
                  label="Caregiver Name"
                  density="compact"
                  variant="solo-filled"
                  required
                  prepend-inner-icon="mdi-account"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="caregiverFormData.phone"
                  label="Phone Number"
                  density="compact"
                  variant="solo-filled"
                  required
                  prepend-inner-icon="mdi-phone"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="caregiverFormData.bvn"
                  label="BVN"
                  density="compact"
                  variant="solo-filled"
                  prepend-inner-icon="mdi-identifier"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VSelect
                  v-model="caregiverFormData.gender"
                  label="Gender"
                  required
                  density="compact"
                  variant="solo-filled"
                  :items="['MALE', 'FEMALE']"
                  prepend-inner-icon="mdi-gender-male-female"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="caregiverFormData.date_of_birth"
                  label="Date of Birth"
                  density="compact"
                  variant="solo-filled"
                  type="date"
                  prepend-inner-icon="mdi-calendar"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="caregiverFormData.address"
                  label="Address"
                  density="compact"
                  variant="solo-filled"
                  prepend-inner-icon="mdi-home"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="caregiverFormData.community"
                  label="Community"
                  density="compact"
                  variant="solo-filled"
                  prepend-inner-icon="mdi-account-group"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="caregiverFormData.qualification"
                  density="compact"
                  variant="solo-filled"
                  label="Qualification"
                  prepend-inner-icon="mdi-certificate"
                />
              </VCol>

              <VCol cols="12">
                <VDivider class="my-2" />
                <div class="text-subtitle-1 font-weight-medium mb-2">
                  Employment & Income
                </div>
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="caregiverFormData.income"
                  density="compact"
                  variant="solo-filled"
                  label="Income"
                  prepend-inner-icon="mdi-currency-ngn"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VCheckbox
                  v-model="caregiverFormData.is_employed"
                  label="Is Employed"
                />
              </VCol>

              <VCol cols="12">
                <VDivider class="my-2" />
                <div class="text-subtitle-1 font-weight-medium mb-2">
                  Banking Information
                </div>
              </VCol>

              <VCol
                cols="12"
                md="4"
              >
                <VTextField
                  v-model="caregiverFormData.account_number"
                  density="compact"
                  variant="solo-filled"
                  label="Account Number"
                  prepend-inner-icon="mdi-numeric"
                />
              </VCol>
              <VCol
                cols="12"
                md="4"
              >
                <VTextField
                  v-model="caregiverFormData.account_name"
                  density="compact"
                  variant="solo-filled"
                  label="Account Name"
                  prepend-inner-icon="mdi-account"
                />
              </VCol>
              <VCol
                cols="12"
                md="4"
              >
                <VTextField
                  v-model="caregiverFormData.bank_code"
                  density="compact"
                  variant="solo-filled"
                  label="Bank Code"
                  prepend-inner-icon="mdi-bank"
                />
              </VCol>
            </VRow>
          </VWindowItem>
        </VWindow>
      </VCardText>

      <VCardActions>
        <VBtn
          color="error"
          variant="text"
          prepend-icon="mdi-close"
          @click="editModal = false"
        >
          Cancel
        </VBtn>
        <VSpacer />
        <VBtn
          v-if="activeTab === 'student' && caregiverFormData.name"
          color="primary"
          variant="text"
          append-icon="mdi-arrow-right"
          @click="activeTab = 'caregiver'"
        >
          Next: Caregiver Info
        </VBtn>
        <VBtn
          v-if="activeTab === 'caregiver' && formData.name"
          color="primary"
          variant="text"
          prepend-icon="mdi-arrow-left"
          @click="activeTab = 'student'"
        >
          Back to Student Info
        </VBtn>
        <VBtn
          color="success"
          variant="elevated"
          prepend-icon="mdi-content-save"
          :loading="isUpdating"
          @click="updateStudent"
        >
          Save All Changes
        </VBtn>
      </VCardActions>
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
