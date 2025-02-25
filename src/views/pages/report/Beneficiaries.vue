<script setup lang="ts">
import { Parser } from '@json2csv/plainjs'
import * as XLSX from 'xlsx'
import { callApi } from '@/helpers/request'
import { useUserStore } from '@/stores/user'

const token = ref('')
const router = useRouter()

// const selectedCaregiverId = ref<number | null>(null)

const user = useUserStore()

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

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

// const currentItems = ref<CareGiver[]>([])
// const selectedCareGiver = ref<CareGiver | null>(null)
// const deleteModal = ref(false)
// const editModal = ref(false)

// const headers = ref([
//   { title: 'Name', align: 'start', sortable: true, key: 'name' },
//   { title: 'Phone', key: 'phone', align: 'center' },
//   { title: 'Community', key: 'community', align: 'center' },
//   { title: 'Students Count', key: 'students_count', align: 'center' },
//   { title: 'Gender', key: 'gender', align: 'center' },
//   { title: 'Income', key: 'income', align: 'center' },
//   { title: 'Account Status', key: 'is_bvn_verfied', align: 'center' },
//   { title: 'Action', key: 'action', align: 'center' },
// ] as const)

const students = ref<Students[]>([])
const isLoaded = ref(false)
const totalItems = ref(0)
const exportType = ref<'CSV' | 'Excel' | null>(null)

// const itemsPerPage = ref(10)
// const search = ref('')
const exportModal = ref(false)

// Fetch caregivers
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

const openExportModal = () => {
  exportModal.value = true
  exportType.value = null
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

onMounted(() => {
  fetchData()
})
</script>

<template>
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
</template>
