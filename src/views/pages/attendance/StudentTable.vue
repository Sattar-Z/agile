<script setup lang="ts">
import { Parser } from '@json2csv/plainjs'
import { useRoute, useRouter } from 'vue-router'
import { VDataTableServer } from 'vuetify/labs/VDataTable'
import * as XLSX from 'xlsx'
import LoadingTable from './LoadingTable.vue'
import StudentDetailsModal from './StudentDetailsModal.vue'
import { isAdmin } from '@/middlewares/auth'

import { callApi } from '@/helpers/request'
import { useUserStore } from '@/stores/user'

// import { toNigerianCurrency } from '@/helpers/numbers'

const props = defineProps<{
  termId: number | null
  session: string
  cohurt: string | null
}>()

const Admin = ref(isAdmin())
const token = ref('')
const router = useRouter()
const showStudentDetails = ref(false)
const selectedStudentId = ref<number | null>(null)
const attendance = ref(0)
const careGivers = ref(0)
const route = useRoute()
const user = useUserStore()

token.value = user.getUserInfo().token

const { id, name } = route.params

const currentTerm = ref(route.params.term)
const currentSession = ref(route.params.session)
const currentCohort = ref(route.params.cohort)

// Attendance modal state
const attendanceModal = ref(false)
const selectedStudentAttendance = ref<any>(null)
const loadingAttendance = ref(false)

watch(() => props.termId, newValue => {
  if (newValue !== null)
    currentTerm.value = newValue.toString()
}, { immediate: true })

watch(() => props.session, newValue => {
  if (newValue)
    currentSession.value = newValue
}, { immediate: true })

watch(() => props.cohurt, newValue => {
  if (newValue)
    currentCohort.value = newValue
}, { immediate: true })

interface CareGiver {
  id: number
  bvn_id: number
  nin_id: number
  name: string
  phone: string
  address: string
  community: string
  gender: string
  date_of_birth: string
  qualification: string
  income: string
  photo: string
  signature: string
  certificate: number
  is_employed: number
  date_collected: string
  is_bvn_verfied: number
  is_nin_verfied: number
  attendance: number
  status: number
  created_at: string
  updated_at: string
  lga_id: number
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
  care_giver: CareGiver
  term_attendances: object | null
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
  { title: 'Cohort', key: 'cohurt', align: 'center' },
  { title: 'Attendance', key: 'attendance', align: 'center' },
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

const fetchData = async () => {
  isLoaded.value = false
  try {
    const response = await callApi({
      url: `school/students/${id}?term_id=${currentTerm?.value}&session=${currentSession?.value}&cohurt=${currentCohort?.value}`,
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()

    if (response.ok) {
      students.value = Object.values(responseData.data.students)
      attendance.value = responseData.data.overall_attendance
      careGivers.value = responseData.data.care_givers_count
      totalItems.value = students.value.length
    }
    else if (response.status === 401) {
      user.removeUser()
      router.push({ name: 'login' })
    }
    else {
      // alertInfo.show = true
      // alertInfo.title = 'Error'
      // alertInfo.message = responseData.message || 'Something went wrong please try again later'
      // alertInfo.type = 'error'
    }
  }
  catch (error) {
    // alertInfo.show = true
    // alertInfo.title = 'Error'
    // alertInfo.message = 'Something went wrong please try again later'
    // alertInfo.type = 'error'
  }
  finally {
    isLoaded.value = true
  }
}

const fetchStudentAttendance = async (studentId: number) => {
  loadingAttendance.value = true
  attendanceModal.value = true
  try {
    const response = await callApi({
      url: `student/attendance/${studentId}`,
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()

    if (response.ok) {
      selectedStudentAttendance.value = responseData.data
    }
    else if (response.status === 401) {
      user.removeUser()
      router.push({ name: 'login' })
    }
    else {
      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = responseData.message || 'Failed to fetch attendance data'
      alertInfo.type = 'error'
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'Failed to fetch attendance data'
    alertInfo.type = 'error'
  }
  finally {
    loadingAttendance.value = false
  }
}

const formatDate = (dateString: string) => {
  if (!dateString)
    return ''
  const date = new Date(dateString)

  return date.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })
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

// Function to determine attendance status color
const getAttendanceStatusColor = (attendances: number | null) => {
  if (attendances === null)
    return 'grey'
  if (attendances >= 80)
    return 'success'
  if (attendances >= 60)
    return 'info'
  if (attendances >= 40)
    return 'warning'

  return 'error'
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
  fetchData()
})

watch(
  () => [props.termId, props.session, props.cohurt],
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
    <VCol
      cols="12"
      md="6"
    >
      <VCard
        variant="tonal"
        color="primary"
      >
        <VCardItem>
          <div class="d-flex">
            <VIcon
              class="my-auto mx-1"
              icon="bx-group"
            />
            <VCardTitle class="my-auto">
              Overall Attendance
            </VCardTitle>
          </div>
        </VCardItem>
        <VCardText class="my-auto text-h5">
          {{ attendance }} %
        </VCardText>
      </VCard>
    </VCol>
    <VCol
      cols="12"
      md="6"
    >
      <VCard
        variant="tonal"
        color="primary"
      >
        <VCardItem>
          <div class="d-flex">
            <VIcon
              class="my-auto mx-1"
              icon="bx-donate-heart"
            />
            <VCardTitle class="my-auto">
              Care Givers Count
            </VCardTitle>
          </div>
        </VCardItem>
        <VCardText class="my-auto text-h5">
          {{ careGivers }}
        </VCardText>
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
        >
          <!-- Title -->
          <VCol
            cols="12"
            md="6"
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
              @click="openStudentDetails(item.raw)"
            />
          </template>
          <template #item.attendance="{ item }">
            <VTooltip
              activator="parent"
              location="top"
            >
              Click to view detailed attendance
            </VTooltip>
            <VChip
              :color="getAttendanceStatusColor(item.raw.attendance)"
              density="compact"
              class="cursor-pointer"
              @click="fetchStudentAttendance(item.raw.id || 0)"
            >
              {{ item.raw.attendance }} %
            </VChip>
          </template>
          <template #item.care_giver.is_bvn_verfied="{ item }">
            <VChip
              v-if="item.raw.care_giver.is_bvn_verfied === 1"
              density="compact"
              text="BVN Verified"
              color="success"
            />

            <VBtn
              v-else-if="Admin && item.raw.care_giver.is_bvn_verfied === 0"
              :loading="verifyingBvn === item.raw.care_giver.bvn_id"
              density="compact"
              variant="outlined"
              text="Verify BVN"
              @click="verifyBvn(item.raw.care_giver.bvn_id || 0)"
            />

            <VChip
              v-else
              density="compact"
              text="BVN Not Verified"
              color="warning"
            />
          </template>
        </VDataTableServer>
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
  <!-- Attendance Modal -->
  <VDialog
    v-model="attendanceModal"
    max-width="800px"
    persistent
  >
    <VCard>
      <VRow justify="space-between">
        <VCol cols="auto">
          <VCardTitle class="text-h5 pa-4">
            Student Attendance Record
          </VCardTitle>
        </VCol>
        <VCol cols="auto">
          <VCardText>
            <VBtn
              icon
              @click="attendanceModal = false"
            >
              <VIcon>mdi-close</VIcon>
            </VBtn>
          </VCardText>
        </VCol>
      </VRow>

      <VDivider />

      <VCardText class="pa-4">
        <VRow v-if="loadingAttendance">
          <VCol
            cols="12"
            class="d-flex justify-center align-center"
          >
            <VProgressCircular
              indeterminate
              color="primary"
            />
          </VCol>
        </VRow>

        <div v-else-if="selectedStudentAttendance">
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <h3 class="text-h6 mb-2">
                Student Information
              </h3>

                <VList>
                  <VListItem>
                      
                    <VListItemTitle class="font-weight-bold">
                      Name
                    </VListItemTitle>
                    <VListItemSubtitle>{{ selectedStudentAttendance.student.name }}</VListItemSubtitle>
                  </VListItem>
                  <VListItem>
                    <VListItemTitle class="font-weight-bold">
                      Admission Number
                    </VListItemTitle>
                    <VListItemSubtitle>{{ selectedStudentAttendance.student.student_admission_number }}</VListItemSubtitle>
                  </VListItem>
                  <VListItem>
                    <VListItemTitle class="font-weight-bold">
                      Class
                    </VListItemTitle>
                    <VListItemSubtitle>{{ selectedStudentAttendance.student.class }}</VListItemSubtitle>
                  </VListItem>
                </VList>

            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <h3 class="text-h6 mb-2 text-center">
                Attendance Summary
              </h3>
              <VRow>
                <VCol cols="6">
                  <VCard variant="outlined">
                    <VCardText class="text-center">
                      <div class="text-h6">
                        Total Days
                      </div>
                      <div class="text-h4">
                        {{ selectedStudentAttendance.attendance.length }}
                      </div>
                    </VCardText>
                  </VCard>
                </VCol>
                <VCol cols="6">
                  <VCard variant="outlined">
                    <VCardText class="text-center">
                      <div class="text-h6">
                        Present
                      </div>
                      <div class="text-h4">
                        {{ selectedStudentAttendance.attendance.filter((a:any) => a.check_in).length }}
                      </div>
                    </VCardText>
                  </VCard>
                </VCol>
              </VRow>
            </VCol>
          </VRow>

          <VDivider class="my-4" />

          <h3 class="text-h6 mb-3">
            Attendance Records
          </h3>
          <VTable>
            <thead>
              <tr>
                <th>Date</th>
                <th>Attendance</th>
                <th>Comment</th>
              </tr>
            </thead>
            <tbody class="text-center">
              <tr
                v-for="(item, index) in selectedStudentAttendance.attendance"
                :key="index"
              >
                <td>{{ formatDate(item.date) }}</td>
                <td>
                  <VChip
                    :color="item.check_in ? 'success' : 'error'"
                    density="compact"
                  >
                    {{ item.check_in ? 'Present' : 'Absent' }}
                  </VChip>
                </td>
                <td>{{ item.comment || '-' }}</td>
              </tr>
            </tbody>
          </VTable>
        </div>
      </VCardText>

      <VCardActions class="pa-4 pt-0">
        <VSpacer />
        <VBtn
          color="primary"
          variant="tonal"
          @click="attendanceModal = false"
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
