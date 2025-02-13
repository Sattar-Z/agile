<script setup lang="ts">
import { Parser } from '@json2csv/plainjs'
import { useRouter } from 'vue-router'
import { VDataTableServer } from 'vuetify/labs/VDataTable'
import * as XLSX from 'xlsx'
import CareGiverStudentsModal from './CareGiverStudentsModal.vue'
import LoadingTable from './LoadingTable.vue'
import { useUserStore } from '@/stores/user'
import { isAdmin } from '@/middlewares/auth'
import { callApi } from '@/helpers/request'

const token = ref('')
const router = useRouter()
const showStudentsModal = ref(false)
const errorMessageModal = ref(false)
const selectedErrorMessage = ref('')

// const selectedCaregiverId = ref<number | null>(null)

const user = useUserStore()
const Admin = ref(isAdmin())

const showErrorMessage = (message: string) => {
  selectedErrorMessage.value = message
  errorMessageModal.value = true
}

token.value = user.getUserInfo().token

interface Student {
  id: number
  name: string
  date_of_birth: string
  student_admission_number: string
  class: string
  disabilities: string
  school_distance: string
  created_at: string
  updated_at: string
}

interface Bvn {
  id: number
  bvn: string
  is_approved: number
  is_verified: number
  created_at: string
  updated_at: string
  error_message: string
  is_pending: number
}

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
  status: number
  created_at: string
  updated_at: string
  lga_id: number
  students_count: number
  bvn: Bvn
  students: Student[]
}

interface CGFormData {
  name: string
  bvn: string
  phone: string
  address: string
  community: string
  gender: string
  date_of_birth: string
  qualification: string
  income: string
  is_employed: boolean
}

const formData = ref<CGFormData>({
  name: '',
  bvn: '',
  phone: '',
  address: '',
  community: '',
  gender: '',
  date_of_birth: '',
  qualification: '',
  income: '',
  is_employed: false,
})

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

const currentItems = ref<CareGiver[]>([])
const selectedCareGiver = ref<CareGiver | null>(null)
const deleteModal = ref(false)
const editModal = ref(false)

const headers = ref([
  { title: 'Name', align: 'start', sortable: true, key: 'name' },
  { title: 'Phone', key: 'phone', align: 'center' },
  { title: 'Community', key: 'community', align: 'center' },
  { title: 'Students Count', key: 'students_count', align: 'center' },
  { title: 'Gender', key: 'gender', align: 'center' },
  { title: 'Income', key: 'income', align: 'center' },
  { title: 'Account Status', key: 'is_bvn_verfied', align: 'center' },
  { title: 'Action', key: 'action', align: 'center' },
] as const)

const caregivers = ref<CareGiver[]>([])
const isLoaded = ref(false)
const totalItems = ref(0)
const itemsPerPage = ref(10)
const search = ref('')
const exportModal = ref(false)
const verifyingBvn = ref<number | null>(null)

// Add new functions
const openDeleteModal = (careGiver: CareGiver) => {
  selectedCareGiver.value = careGiver
  deleteModal.value = true
}

const openEditModal = (caregiver: CareGiver) => {
  selectedCareGiver.value = caregiver
  formData.value = {
    name: caregiver.name || '',
    bvn: caregiver.bvn.bvn || '',
    phone: caregiver.phone || '',
    community: caregiver.community || '',
    date_of_birth: caregiver.date_of_birth || '',
    address: caregiver.address || '',
    gender: caregiver.gender || '',
    qualification: caregiver.qualification || '',
    income: caregiver.income || '',
    is_employed: !!caregiver.is_employed,
  }
  editModal.value = true
}

// Fetch caregivers
const fetchData = async () => {
  isLoaded.value = false
  try {
    const response = await callApi({
      url: 'care_givers',
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()

    if (response.ok) {
      caregivers.value = responseData.data
      totalItems.value = caregivers.value.length
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
      const updateCareGiver = (careGiverArray: CareGiver[]) => {
        const caregiverIndex = careGiverArray.findIndex(
          caregiver => caregiver.bvn_id === bvnId,
        )

        if (caregiverIndex !== -1)
          caregivers.value[caregiverIndex].is_bvn_verfied = 1
      }

      updateCareGiver(caregivers.value)
      updateCareGiver(currentItems.value)

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

function openStudentsModal(caregiver: CareGiver) {
  selectedCareGiver.value = caregiver
  showStudentsModal.value = true
}

// Filter items based on search
const filterItems = (items: CareGiver[], searchValue: string): CareGiver[] => {
  return items.filter(item => {
    const nameMatch = item.name.toLowerCase().includes(searchValue.toLowerCase())
    const phoneMatch = item.phone.toLowerCase().includes(searchValue.toLowerCase())
    const communityMatch = item.community.toLowerCase().includes(searchValue.toLowerCase())

    return nameMatch || phoneMatch || communityMatch
  })
}

const openExportModal = () => {
  exportModal.value = true
}

// Main sorting function
const sortItems = (items: CareGiver[], sortBy: { key: string; order: string }[]): CareGiver[] => {
  if (sortBy.length === 0)
    return items

  const [sortItem] = sortBy
  const { key, order } = sortItem

  const getComparisonValue = (a: CareGiver, b: CareGiver): number => {
    const aValue = a[key as keyof CareGiver]
    const bValue = b[key as keyof CareGiver]

    if (key === 'date_collected')
      return new Date(aValue as string).getTime() - new Date(bValue as string).getTime()

    if (typeof aValue === 'string' && typeof bValue === 'string')
      return aValue.localeCompare(bValue)

    if (typeof aValue === 'number' && typeof bValue === 'number')
      return aValue - bValue

    return 0
  }

  const compare = (a: CareGiver, b: CareGiver): number => {
    const comparisonValue = getComparisonValue(a, b)

    return order === 'desc' ? -comparisonValue : comparisonValue
  }

  return [...items].sort(compare)
}

const loadItems = ({ page, itemsPerPage: itemsPerPageOption, sortBy }: any) => {
  const filteredItems = filterItems(caregivers.value, search.value)
  const sortedItems = sortItems(filteredItems, sortBy)

  const start = (page - 1) * itemsPerPageOption
  const end = start + itemsPerPageOption

  currentItems.value = sortedItems.slice(start, end)
  totalItems.value = filteredItems.length

  return { items: currentItems.value, total: totalItems.value }
}

const exportCSV = () => {
  if (caregivers.value.length === 0) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'No data to export'
    alertInfo.type = 'error'

    return
  }

  const parser = new Parser()
  const csv = parser.parse(caregivers.value)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'caregivers_export.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  exportModal.value = false
}

const exportExcel = () => {
  if (caregivers.value.length === 0) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'No data to export'
    alertInfo.type = 'error'

    return
  }

  const ws = XLSX.utils.json_to_sheet(caregivers.value)
  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, ws, 'Caregivers Export')
  XLSX.writeFile(wb, 'caregivers_export.xlsx')

  exportModal.value = false
}

const deleteCaregiver = async () => {
  if (!selectedCareGiver.value?.id)
    return

  try {
    const response = await callApi({
      url: `care_giver/delete/${selectedCareGiver.value.id}`,
      method: 'DELETE',
      authorized: true,
      showAlert: false,
    })

    if (response.ok) {
      alertInfo.show = true
      alertInfo.title = 'Success'
      alertInfo.message = 'Caregiver deleted successfully'
      alertInfo.type = 'success'

      // Refresh data
      await fetchData()
    }
    else {
      const data = await response.json()

      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = data.message || 'Failed to delete caregiver'
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

const updateCareGiver = async () => {
  if (!selectedCareGiver.value?.id)
    return

  try {
    const response = await callApi({
      url: `care_giver/update/${selectedCareGiver.value.id}`,
      method: 'POST',
      data: formData.value,
      authorized: true,
      showAlert: false,
    })

    if (response.ok) {
      alertInfo.show = true
      alertInfo.title = 'Success'
      alertInfo.message = 'Care Giver updated successfully'
      alertInfo.type = 'success'

      // Refresh data
      await fetchData()
    }
    else {
      const data = await response.json()

      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = data.message || 'Failed to update Care Giver'
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
    editModal.value = false
  }
}

onMounted(() => {
  loadItems({ page: 1, itemsPerPage: itemsPerPage.value, sortBy: [] })
})

watch(search, () => {
  totalItems.value = filterItems(caregivers.value, search.value).length
})

onMounted(() => {
  fetchData()
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
              <VCardTitle>All Caregivers</VCardTitle>
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
                label="Search for Caregiver / Phone / Community"
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
            <div class="d-flex flex-column flex-sm-row gap-2">
              <VBtn
                density="compact"
                variant="tonal"
                text="View Students"
                @click="openStudentsModal(item.raw)"
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
          <template #item.is_bvn_verfied="{ item }">
            <VChip
              v-if="item.raw.is_bvn_verfied === 1"
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
              v-else-if="Admin && item.raw.is_bvn_verfied === 0"
              :loading="verifyingBvn === item.raw.bvn_id"
              density="compact"
              variant="outlined"
              text="Verify Account"
              @click="verifyBvn(item.raw.bvn_id)"
            />
            <VChip
              v-else
              density="compact"
              text="Account Unverified"
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
      <LoadingTable type="Caregivers" />
    </VCol>
  </VRow>
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
  <CareGiverStudentsModal
    v-model="showStudentsModal"
    :caregiver="selectedCareGiver"
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
        Are you sure you want to delete this care giver?
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
          @click="deleteCaregiver"
        >
          Delete
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Edit Care Giver Modal -->
  <VDialog
    v-model="editModal"
    width="800"
    persistent
  >
    <VCard class="pa-4">
      <VCardTitle class="text-h6">
        Edit Care Giver
      </VCardTitle>
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.name"
              label="Name"
              density="compact"
              variant="solo-filled"
              required
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.bvn"
              label="BVN"
              density="compact"
              variant="solo-filled"
              type="number"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.phone"
              label="Phone Number"
              density="compact"
              variant="solo-filled"
              type="number"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VSelect
              v-model="formData.income"
              label="Income"
              density="compact"
              variant="solo-filled"
              required
              :items="[]"
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
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.address"
              label="Address"
              density="compact"
              variant="solo-filled"
              required
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VSelect
              v-model="formData.gender"
              label="Gender"
              density="compact"
              variant="solo-filled"
              required
              :items="['Male', 'Female']"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.community"
              label="Community"
              density="compact"
              variant="solo-filled"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.qualification"
              label="Qualification"
              density="compact"
              variant="solo-filled"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VCheckbox
              v-model="formData.is_employed"
              label="Is employed"
            />
          </VCol>
        </VRow>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          color="primary"
          variant="text"
          @click="editModal = false"
        >
          Cancel
        </VBtn>
        <VBtn
          color="primary"
          variant="elevated"
          @click="updateCareGiver"
        >
          Save
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
