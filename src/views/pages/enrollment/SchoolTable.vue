<script setup lang="ts">
import { Parser } from '@json2csv/plainjs'
import { useRoute, useRouter } from 'vue-router'
import { VDataTableServer } from 'vuetify/labs/VDataTable'
import * as XLSX from 'xlsx'
import LoadingTable from './LoadingTable.vue'
import { useUserStore } from '@/stores/user'
import { callApi } from '@/helpers/request'

// import { toNigerianCurrency } from '@/helpers/numbers'
const token = ref('')

const uploadFile = ref<File | null>(null)
const uploadModal = ref(false)
const loading = ref(false)
const route = useRoute()
const router = useRouter()

const user = useUserStore()

token.value = user.getUserInfo().token

const { id, name } = route.params

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
  students_count: number | null
  daily_attendance_percentage: string | null
  created_at: string | null
  updated_at: string | null
}

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

const currentItems = ref<Schools[]>([])
const selectedSchools = ref<Schools | null>(null)
const SchoolManagementModal = ref(false)

const headers = ref([
  { title: 'Schools', align: 'start', sortable: false, key: 'name' },
  { title: 'Education Level', key: 'education_level', align: 'center' },
  { title: 'NO of Students', key: 'students_count', align: 'center' },
  { title: 'Upload Records', key: 'upload', align: 'center' },
  { title: 'Action', key: 'view', align: 'center' },
] as const)

const schools = ref<Schools[]>([])
const isLoaded = ref(false)
const totalItems = ref(0)
const itemsPerPage = ref(10)
const search = ref('')
const exportModal = ref(false)
const exportType = ref<'CSV' | 'Excel' | null>(null)

const openUploadModal = (school: Schools) => {
  selectedSchools.value = school
  uploadModal.value = true
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file)
    uploadFile.value = file
}

const submitStudent = async () => {
  loading.value = true

  if (!uploadFile.value) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'Please select a file to upload'
    alertInfo.type = 'error'
    loading.value = false

    return
  }

  const formData = new FormData()

  formData.append('file', uploadFile.value)
  formData.append('file_type', 'students_per_school')
  formData.append('school_id', selectedSchools.value?.id?.toString() || '')

  try {
    const response = await fetch('https://staging-agile.moneta.ng/api/enrolement/file/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    const responseData = await response.json()

    if (response.ok) {
      alertInfo.show = true
      alertInfo.title = 'Success'
      alertInfo.message = responseData.message || 'File uploaded successfully'
      alertInfo.type = 'success'
      uploadModal.value = false
    }
    else {
      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = responseData.message || 'Upload failed'
      alertInfo.type = 'error'
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'An unexpected error occurred'
    alertInfo.type = 'error'
  }
  finally {
    loading.value = false
  }
}

// Fetch merchant Transactions
const fetchTerminalDetails = async () => {
  isLoaded.value = false
  try {
    const response = await callApi({
      url: `lga/schools/${id}`,
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()

    if (response.ok) {
      schools.value = Object.values(responseData.data)
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

// Filter items based on search
const filterItems = (items: Schools[], searchValue: string): Schools[] => {
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

onMounted(() => {
  loadItems({ page: 1, itemsPerPage: itemsPerPage.value, sortBy: [] })
})

watch(search, () => {
  totalItems.value = filterItems(schools.value, search.value).length
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
              <VCardTitle>{{ name }} Schools</VCardTitle>
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
          <template #item.view="{ item }">
            <RouterLink
              :to="{
                name: 'students',
                params: {
                  id: item.raw.id,
                  name: item.raw.name,
                },
              }"
            >
              <VBtn
                density="compact"
                variant="tonal"
                text="view"
              />
            </RouterLink>
          </template>
          <template #item.upload="{ item }">
            <VBtn
              density="compact"
              variant="text"
              icon="bx-upload"
              @click="openUploadModal(item.raw)"
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
      <LoadingTable type="Schools" />
    </VCol>
  </VRow>
  <VDialog
    v-model="SchoolManagementModal"
    width="600"
    persistent
  >
    <VCard
      v-if="selectedSchools"
      class="pa-4"
    >
      <VCardTitle class="text-h5 text-end mb-4">
        File Management
        <VBtn
          icon
          variant="text"
          absolute
          top
          right
          @click="SchoolManagementModal = false"
        >
          <VIcon icon="bx-x" />
        </VBtn>
      </VCardTitle>

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
    v-model="uploadModal"
    width="500"
    persistent
  >
    <VCard class="pa-6">
      <VRow justify="space-between">
        <VCol cols="auto">
          <VCardTitle class="text-h5 text-center mb-4">
            Upload Students File
          </VCardTitle>
        </VCol>
        <VCol cols="auto">
          <VBtn
            icon="bx-x"
            variant="text"
            @click="uploadModal = false"
          />
        </VCol>
      </VRow>

      <VCardText>
        <VRow class="d-flex justify-center">
          <VCol cols="12">
            <VFileInput
              v-model="uploadFile"
              label="Choose file"
              prepend-icon="bx-file"
              @change="handleFileUpload"
            />
          </VCol>
          <VCol
            cols="12"
            class="d-flex justify-center"
          >
            <VBtn
              color="primary"
              :loading="loading"
              @click="submitStudent"
            >
              Upload
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
