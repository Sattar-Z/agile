<script setup lang="ts">
import { Parser } from '@json2csv/plainjs'
import { useRouter } from 'vue-router'
import { VDataTableServer } from 'vuetify/labs/VDataTable'
import * as XLSX from 'xlsx'
import LoadingTable from './LoadingTable.vue'
import { useUserStore } from '@/stores/user'
import { callApi } from '@/helpers/request'

const props = defineProps<{
  lgaId: number | null
  payment: number | null
  session: string[]
  cohurt: string | null
}>()

const emit = defineEmits(['viewSchool'])

const token = ref('')
const loading = ref(false)
const router = useRouter()
const user = useUserStore()

token.value = user.getUserInfo().token

interface DisbursementRequest {
  id: number
  status: string
  uploaded_by: number
  approved_by: number | null
  reviewed_by: number | null
  notes: string | null
  payment_type_id: number
  eligibility_criteria_id: number
  cohurt: string | null
  school_id: number
  term_id: number
  created_at: string
  updated_at: string
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
  verified_care_givers_count: number | null
  unverified_care_givers_count: number | null
  students_count: number | null
  daily_attendance_percentage: string | null
  created_at: string | null
  updated_at: string | null
  payed_student: number
  pending_student: number
  unpayed_student: number
  disbursement_requests: DisbursementRequest[]
}

interface LGAData {
  id: number
  name: string
  daily_attendance_percentage: number | null
  schools_count: number
  students_count: number
  care_givers_count: number
  verified_care_givers_count: number
  unverified_care_givers_count: number
}

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

const lgaData = ref<LGAData | null>(null)
const currentItems = ref<Schools[]>([])
const selectedSchool = ref<Schools | null>(null)
const disbursementModal = ref(false)

const headers = ref([
  { title: 'Schools', align: 'start', sortable: true, key: 'name' },
  { title: 'Education Level', key: 'education_level', align: 'center' },
  { title: 'Paid Students', key: 'payed_student', align: 'center' },
  { title: 'Pending Students', key: 'pending_student', align: 'center' },
  { title: 'Unpaid Students', key: 'unpayed_student', align: 'center' },
  { title: 'Disbursements', key: 'disbursements', align: 'center' },
  { title: 'Action', key: 'view', align: 'center' },
] as const)

const schools = ref<Schools[]>([])
const isLoaded = ref(false)
const totalItems = ref(0)
const itemsPerPage = ref(10)
const search = ref('')
const exportModal = ref(false)

const fetchData = async () => {
  isLoaded.value = false

  if (!props.payment || !props.session || !props.lgaId || !props.cohurt) {
    alertInfo.show = true
    alertInfo.title = 'Info'
    alertInfo.message = 'Please use the filter to get School info'
    alertInfo.type = 'info'

    return
  }

  try {
    const response = await callApi({
      url: `disbursement/lga/data?lga_id=${props.lgaId}&payment_type_id=${props.payment}&session=${props.session}&cohurt=${props.cohurt}`,
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()

    if (response.ok) {
      schools.value = Object.values(responseData.data.schools)
      lgaData.value = {
        id: responseData.data.id,
        name: responseData.data.name,
        daily_attendance_percentage: responseData.data.daily_attendance_percentage,
        schools_count: responseData.data.schools_count,
        students_count: responseData.data.students_count,
        care_givers_count: responseData.data.care_givers_count,
        verified_care_givers_count: responseData.data.verified_care_givers_count,
        unverified_care_givers_count: responseData.data.unverified_care_givers_count,
      }
      totalItems.value = schools.value.length
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

const filterItems = (items: Schools[], searchValue: string): Schools[] => {
  return items.filter(item => {
    if (!item.name)
      return false

    return item.name?.toLowerCase().includes(searchValue.toLowerCase()) ?? false
  })
}

const sortItems = (items: Schools[], sortBy: { key: string; order: string }[]): Schools[] => {
  if (sortBy.length === 0)
    return items

  const [sortItem] = sortBy

  return [...items].sort((a, b) => {
    const aValue = a[sortItem.key as keyof Schools]
    const bValue = b[sortItem.key as keyof Schools]

    if (typeof aValue === 'string' && typeof bValue === 'string')
      return sortItem.order === 'desc' ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue)
    if (typeof aValue === 'number' && typeof bValue === 'number')
      return sortItem.order === 'desc' ? bValue - aValue : aValue - bValue

    return 0
  })
}

const loadItems = ({ page, itemsPerPage: itemsPerPageOption, sortBy }: any) => {
  const filteredItems = filterItems(schools.value, search.value)
  const sortedItems = sortItems(filteredItems, sortBy)

  const start = (page - 1) * itemsPerPageOption
  const end = start + itemsPerPageOption

  currentItems.value = sortedItems.slice(start, end)
  totalItems.value = filteredItems.length

  return { items: currentItems.value, total: totalItems.value }
}

const openDisbursementModal = (school: Schools) => {
  selectedSchool.value = school
  disbursementModal.value = true
}

const exportCSV = () => {
  if (schools.value.length === 0) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'No data to export'
    alertInfo.type = 'error'

    return
  }

  const parser = new Parser()
  const csv = parser.parse(schools.value)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'school_export.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  exportModal.value = false
}

const exportExcel = () => {
  if (schools.value.length === 0) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'No data to export'
    alertInfo.type = 'error'

    return
  }

  const ws = XLSX.utils.json_to_sheet(schools.value)
  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, ws, 'School Export')
  XLSX.writeFile(wb, 'school_export.xlsx')

  exportModal.value = false
}

const statusColors = {
  submitted: 'warning',
  approved: 'success',
  rejected: 'error',
} as const

type StatusType = keyof typeof statusColors

const getDisbursementStatusColor = (status: string) => {
  return statusColors[status.toLowerCase() as StatusType] || 'info'
}

const LoadDownloading = ref(false)

const downloadRequest = async (id: number) => {
  LoadDownloading.value = true
  try {
    const response = await callApi({
      url: `disbursement/payment/download/${id}`,
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()
    if (!response.ok) {
      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = responseData.message || 'Download Failed'
      alertInfo.type = 'error'
    }
    else {
      alertInfo.show = true
      alertInfo.title = 'Success'
      alertInfo.message = responseData.message || 'Downloaded'
      alertInfo.type = 'success'
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
    LoadDownloading.value = false
  }
}

const handleViewSchool = (schoolId: number) => {
  emit('viewSchool', schoolId)
}

onMounted(() => {
  fetchData()
})

watch(
  () => [props.payment, props.session, props.cohurt, props.lgaId],
  () => {
    fetchData()
  },
  { immediate: true },
)

watch(search, () => {
  totalItems.value = filterItems(schools.value, search.value).length
})
</script>

<template>
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

  <VRow>
    <!-- Summary Cards -->
    <VCol
      v-if="lgaData"
      cols="12"
    >
      <VRow>
        <VCol
          cols="12"
          md="4"
        >
          <VCard
            variant="tonal"
            color="primary"
          >
            <VCardTitle class="d-flex align-center pa-4">
              <VIcon
                icon="bxs-school"
                size="32"
                color="primary"
                class="me-2"
              />
              <div>
                <div class="text-h4 font-weight-bold">
                  {{ lgaData.schools_count }}
                </div>
                <div class="text-subtitle-2">
                  Total Schools
                </div>
              </div>
            </VCardTitle>
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
            <VCardTitle class="d-flex align-center pa-4">
              <VIcon
                icon="bx-user"
                size="32"
                color="primary"
                class="me-2"
              />
              <div>
                <div class="text-h4 font-weight-bold">
                  {{ lgaData.students_count }}
                </div>
                <div class="text-subtitle-2">
                  Total Students
                </div>
              </div>
            </VCardTitle>
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
            <VCardTitle class="d-flex align-center pa-4">
              <VIcon
                icon="bx-group"
                size="32"
                color="primary"
                class="me-2"
              />
              <div>
                <div class="text-h4 font-weight-bold">
                  {{ lgaData.care_givers_count }}
                </div>
                <div class="text-subtitle-2">
                  Total Caregivers
                </div>
                <div
                  hidden
                  class="text-caption"
                >
                  Verified: {{ lgaData.verified_care_givers_count }} | Unverified: {{ lgaData.unverified_care_givers_count }}
                </div>
              </div>
            </VCardTitle>
          </VCard>
        </VCol>
      </VRow>
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
          <VCol
            cols="12"
            md="4"
          >
            <VCardText>
              <VCardTitle>{{ lgaData?.name }} Schools</VCardTitle>
            </VCardText>
          </VCol>
        </VRow>
        <VRow
          no-gutters
          justify="space-between"
        >
          <VCol
            cols="12"
            md="3"
          >
            <VCardText>
              <VTextField
                v-model="search"
                prepend-inner-icon="bx-search"
                label="Search for Schools"
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
                @click="exportModal = true"
              />
            </VCardText>
          </VCol>
        </VRow>

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
          <template #item.disbursements="{ item }">
            <VBtn
              variant="tonal"
              color="primary"
              density="compact"
              @click="openDisbursementModal(item.raw)"
            >
              View ({{ item.raw.disbursement_requests.length }})
            </VBtn>
          </template>

          <template #item.view="{ item }">
            <VBtn
              density="compact"
              variant="tonal"
              text="view School"
              @click="handleViewSchool(item.raw.id)"
            />
          </template>
        </VDataTableServer>
      </VCard>
    </VCol>

    <VCol
      v-else
      cols="12"
    >
      <LoadingTable type="Schools" />
    </VCol>
  </VRow>
  <!-- Disbursement Modal -->
  <VDialog
    v-model="disbursementModal"
    width="800"
    persistent
  >
    <VCard v-if="selectedSchool">
      <VCardTitle class="d-flex justify-space-between align-center pa-4">
        <span class="text-h5">{{ selectedSchool.name }} - Disbursement History</span>
        <VBtn
          icon="bx-x"
          variant="text"
          @click="disbursementModal = false"
        />
      </VCardTitle>

      <VCardText>
        <VTable density="compact">
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Term</th>
              <th>Created Date</th>
              <th>Updated Date</th>
              <th>Notes</th>
              <th>Export</th>
            </tr>
          </thead>
          <tbody class="text-center text-body-1">
            <tr
              v-for="request in selectedSchool.disbursement_requests"
              :key="request.id"
            >
              <td>{{ request.id }}</td>
              <td>
                <VChip
                  :color="getDisbursementStatusColor(request.status)"
                  size="small"
                  class="text-capitalize"
                >
                  {{ request.status }}
                </VChip>
              </td>
              <td>{{ request.term_id }}</td>
              <td>{{ new Date(request.created_at).toLocaleDateString() }}</td>
              <td>{{ new Date(request.updated_at).toLocaleDateString() }}</td>
              <td>
                <span v-if="request.notes">{{ request.notes }}</span>
                <span
                  v-else
                  class="text-disabled"
                >No notes</span>
              </td>
              <td>
                <VBtn
                  color="primary"
                  variant="text"
                  size="small"
                  icon="bx-upload"
                  @click="downloadRequest(request.id)"
                />
              </td>
            </tr>
            <tr v-if="selectedSchool.disbursement_requests.length === 0">
              <td
                colspan="6"
                class="text-center text-disabled pa-4"
              >
                No disbursement requests found
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCardText>

      <VCardText class="pt-2">
        <VRow>
          <VCol
            cols="12"
            md="4"
          >
            <VCard
              variant="outlined"
              class="pa-3"
            >
              <div class="text-subtitle-1 mb-1">
                Paid Students
              </div>
              <div class="text-h5 text-success">
                {{ selectedSchool.payed_student }}
              </div>
            </VCard>
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VCard
              variant="outlined"
              class="pa-3"
            >
              <div class="text-subtitle-1 mb-1">
                Pending Students
              </div>
              <div class="text-h5 text-warning">
                {{ selectedSchool.pending_student }}
              </div>
            </VCard>
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VCard
              variant="outlined"
              class="pa-3"
            >
              <div class="text-subtitle-1 mb-1">
                Unpaid Students
              </div>
              <div class="text-h5 text-error">
                {{ selectedSchool.unpayed_student }}
              </div>
            </VCard>
          </VCol>
        </VRow>
      </VCardText>

      <VCardActions class="pa-4 pt-0">
        <VSpacer />
        <VBtn
          color="primary"
          variant="tonal"
          @click="disbursementModal = false"
        >
          Close
        </VBtn>
      </VCardActions>
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
</template>

<style scoped>
.no-wrap {
  white-space: nowrap;
}

.v-data-table {
  font-size: 0.85rem;
}
</style>
