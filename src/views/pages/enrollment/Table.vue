<script setup lang="ts">
import { Parser } from '@json2csv/plainjs'
import { VDataTableServer } from 'vuetify/labs/VDataTable'
import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx'
import LoadingTable from './LoadingTable.vue'
import { useUserStore } from '@/stores/user'
import { callApi } from '@/helpers/request'

// import { toNigerianCurrency } from '@/helpers/numbers'
const uploadedFile = ref<File | null>(null)
const users = useUserStore()

const user = useUserStore().getUser()
const router = useRouter()
const token = user.value.token

interface Files {
  id: number | null
  user_id: number | null
  file_name: string | null
  file_path: string | null
  file_size: string | null
  is_approved: number | null
  is_scanned: number | null
  file_type: string | null
  created_at: string | null
  updated_at: string | null // active, suspend, block
}

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

const currentItems = ref<Files[]>([])
const selectedFile = ref<Files | null>(null)
const fileManagementModal = ref(false)

const headers = ref([
  { title: 'Files', align: 'start', sortable: false, key: 'file_name' },
  { title: 'Size', key: 'file_size', align: 'center' },
  { title: 'Approved', key: 'is_approved', align: 'center' },
  { title: 'Scanned', key: 'is_scanned', align: 'center' },
  { title: 'File Type', key: 'file_type', align: 'center' },
  { title: 'Action', key: 'action', align: 'center' },
] as const)

const files = ref<Files[]>([])
const isLoaded = ref(false)
const totalItems = ref(0)
const itemsPerPage = ref(10)
const search = ref('')
const exportType = ref<'CSV' | 'Excel' | null>(null)

const formatFileName = (fileName: string): string => {
  const parts = fileName.split('_')

  parts.shift()

  return parts.join('_').replace('.csv', '')
}

// Fetch merchant Transactions
const fetchTerminalDetails = async () => {
  isLoaded.value = false
  try {
    const response = await callApi({
      url: 'enrolement/files',
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()

    if (response.ok) {
      files.value = Object.values(responseData.data)
      totalItems.value = files.value.length
    }
    else if (response.status === 401) {
      users.removeUser()
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
const filterItems = (items: Files[], searchValue: string): Files[] => {
  return items.filter(item => {
    if (!item.file_name)
      return false

    return item.file_name?.toLowerCase().includes(searchValue.toLowerCase()) ?? false
  })
}

const openFileManagementModal = (file: Files) => {
  selectedFile.value = file
  fileManagementModal.value = true
}

const handleFileAction = async (action: 'approve' | 'reject') => {
  if (!selectedFile.value?.id) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'No file selected'
    alertInfo.type = 'error'

    return
  }

  try {
    const response = await callApi({
      url: `enrolement/file/${action}/${selectedFile.value.id}`,
      method: 'POST',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()

    if (response.ok) {
      // Update the local files array
      const fileIndex = files.value.findIndex(f => f.id === selectedFile.value?.id)
      if (fileIndex !== -1)
        files.value[fileIndex].is_approved = action === 'approve' ? 1 : 0

      alertInfo.show = true
      alertInfo.title = 'Success'
      alertInfo.message = `File ${action}d successfully`
      alertInfo.type = 'success'

      // Close the modal
      fileManagementModal.value = false
    }
    else {
      throw new Error(responseData.message || 'Failed to perform action')
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = error instanceof Error ? error.message : 'Something went wrong'
    alertInfo.type = 'error'
  }
}

const loading = ref(false)

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0)

    uploadedFile.value = input.files[0]
}

async function uploadFile() {
  loading.value = true

  const file = uploadedFile.value

  if (!file) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'Please select a file to upload'
    alertInfo.type = 'error'
    loading.value = false

    return
  }

  const formData = new FormData()

  formData.append('file', file)
  formData.append('file_type', 'school')

  try {
    const response = await fetch(`https://staging-agile.moneta.ng/api/enrolement/file/reupload/${selectedFile.value?.id}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (response.ok) {
      const { message } = await response.json()

      alertInfo.show = true
      alertInfo.title = 'Success'
      alertInfo.message = message
      alertInfo.type = 'success'

      // Refresh the files list
      await fetchTerminalDetails()

      // Close the modal
      fileManagementModal.value = false
    }
    else {
      const errorResponse = await response.json()

      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = errorResponse.message || 'Upload failed'
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

const viewFile = async () => {
  if (!selectedFile.value?.id) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'No file selected'
    alertInfo.type = 'error'

    return
  }
  try {
    const response = await callApi({
      url: `enrolement/file/download/${selectedFile.value.id}`,
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    if (response.ok) {
      const csvData = await response.text() // Parse CSV data as text

      // Create a Blob from the CSV data
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })

      // Create a link element to trigger the download
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', 'file.csv') // Specify the filename
      link.style.display = 'none'
      document.body.appendChild(link)

      // Trigger the download
      link.click()

      // Cleanup
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      alertInfo.show = true
      alertInfo.title = 'Success'
      alertInfo.message = 'File downloaded successfully'
      alertInfo.type = 'success'

      // Close the modal
      fileManagementModal.value = false
    }
    else {
      const responseData = await response.json()
      throw new Error(responseData.message || 'Failed to download the file')
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = error instanceof Error ? error.message : 'Something went wrong'
    alertInfo.type = 'error'
  }
}

// Sort items
const sortItems = (items: Files[], sortBy: { key: string; order: string }[]): Files[] => {
  if (sortBy.length === 0)
    return items

  const [sortItem] = sortBy

  return [...items].sort((a, b) => {
    const aValue = a[sortItem.key as keyof Files]
    const bValue = b[sortItem.key as keyof Files]

    if (typeof aValue === 'string' && typeof bValue === 'string')
      return sortItem.order === 'desc' ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue)
    if (typeof aValue === 'number' && typeof bValue === 'number')
      return sortItem.order === 'desc' ? bValue - aValue : aValue - bValue

    return 0
  })
}

const loadItems = ({ page, itemsPerPage: itemsPerPageOption, sortBy }: any) => {
  const filteredItems = filterItems(files.value, search.value)
  const sortedItems = sortItems(filteredItems, sortBy)

  const start = (page - 1) * itemsPerPageOption
  const end = start + itemsPerPageOption

  currentItems.value = sortedItems.slice(start, end)
  totalItems.value = filteredItems.length

  return { items: currentItems.value, total: totalItems.value }
}

// Export functions
const performExport = () => {
  if (exportType.value === 'CSV')
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    exportCSV()
  else if (exportType.value === 'Excel')
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    exportExcel()
}

const formatFileSize = (sizeInBytes: number): string => {
  if (sizeInBytes < 1024)
    return `${sizeInBytes} bytes`
  else if (sizeInBytes < 1024 ** 2)
    return `${(sizeInBytes / 1024).toFixed(2)} KB`
  else if (sizeInBytes < 1024 ** 3)
    return `${(sizeInBytes / 1024 ** 2).toFixed(2)} MB`
  else
    return `${(sizeInBytes / 1024 ** 3).toFixed(2)} GB`
}

const exportCSV = () => {
  if (files.value.length === 0) {
    console.error('No data to export')

    return
  }

  const parser = new Parser()
  const csv = parser.parse(files.value)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'transaction_transactions_export.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const exportExcel = () => {
  if (files.value.length === 0) {
    console.error('No data to export')

    return
  }

  const ws = XLSX.utils.json_to_sheet(files.value)
  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, ws, 'transaction Transactions')
  XLSX.writeFile(wb, 'transaction_transactions_export.xlsx')
}

onMounted(() => {
  loadItems({ page: 1, itemsPerPage: itemsPerPage.value, sortBy: [] })
})

watch(search, () => {
  totalItems.value = filterItems(files.value, search.value).length
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
          align="center"
          justify="space-between"
        >
          <!-- Title -->
          <VCol
            cols="12"
            md="4"
          >
            <VCardTitle>Files</VCardTitle>
          </VCol>

          <!-- Actions -->
          <VCol
            cols="12"
            md="8"
            class="text-md-end text-sm-start"
          >
            <VCardText>
              <VRow
                align="center"
                justify="end"
              >
                <VCol
                  cols="12"
                  sm="4"
                  md="3"
                >
                  <VTextField
                    v-model="search"
                    prepend-inner-icon="bx-search"
                    label="Search"
                    density="compact"
                    hide-details
                  />
                </VCol>
                <VCol
                  cols="12"
                  sm="4"
                  md="2"
                >
                  <VSelect
                    v-model="exportType"
                    :items="['CSV', 'Excel']"
                    label="Export"
                    density="compact"
                  />
                </VCol>
                <VCol
                  cols="12"
                  sm="4"
                  md="2"
                >
                  <VBtn
                    variant="tonal"
                    :disabled="!exportType"
                    @click="performExport"
                  >
                    Export
                  </VBtn>
                </VCol>
              </VRow>
            </VCardText>
          </VCol>
        </VRow>

        <!-- Divider -->
        <VCardText>
          <VDivider />
        </VCardText>

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
          <template #item.is_approved="{ item }">
            <VIcon
              v-if="item.raw.is_approved === 0"
              size="small"
              icon="bx-x-circle"
              color="error"
            />
            <VIcon
              v-else
              size="small"
              icon="bx-check-circle"
              color="success"
            />
          </template>
          <template #item.is_scanned="{ item }">
            <VIcon
              v-if="item.raw.is_scanned === 0"
              size="small"
              icon="bx-x-circle"
              color="error"
            />
            <VIcon
              v-else
              size="small"
              icon="bx-check-circle"
              color="success"
            />
          </template>
          <template #item.file_name="{ item }">
            {{ formatFileName(item.raw.file_name) }}
          </template>
          <template #item.file_size="{ item }">
            {{ formatFileSize(item.raw.file_size) }}
          </template>
          <template #item.reseller_name="{ item }">
            {{ item.raw.reseller_name || 'Not Assigned' }}
          </template>
          <template #item.action="{ item }">
            <VBtn
              icon
              variant="text"
              @click="openFileManagementModal(item.raw)"
            >
              <VIcon icon="bx-dots-vertical-rounded" />
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
    v-model="fileManagementModal"
    width="600"
    persistent
  >
    <VCard
      v-if="selectedFile"
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
            @click="fileManagementModal = false"
          />
        </VCol>
      </VRow>

      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <VCard
              variant="outlined"
              class="pa-4"
            >
              <div class="text-subtitle-1 mb-2">
                File Details
              </div>
              <p><strong>File Name:</strong> {{ formatFileName(selectedFile.file_name || '') }}</p>
              <p><strong>File Size:</strong> {{ formatFileSize(Number(selectedFile.file_size)) }}</p>
              <p>
                <strong>Approval Status:</strong>
                <VChip
                  :color="selectedFile.is_approved ? 'success' : 'error'"
                  size="small"
                >
                  {{ selectedFile.is_approved ? 'Approved' : 'Not Approved' }}
                </VChip>
              </p>
            </VCard>
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VCard
              variant="outlined"
              class="pa-4 h-100"
            >
              <div class="text-subtitle-1 mb-2">
                File Re-upload
              </div>
              <VRow>
                <VCol cols="12">
                  <VFileInput
                    v-model="uploadedFile"
                    prepend-icon="bx-upload"
                    label="Select File"
                    density="compact"
                    clearable
                    @change="handleFileSelect"
                  />
                </VCol>
                <VCol cols="12">
                  <VBtn
                    color="primary"
                    block
                    density="compact"
                    :loading="loading"
                    :disabled="!uploadedFile"
                    @click="uploadFile"
                  >
                    Upload File
                  </VBtn>
                </VCol>
              </VRow>
            </VCard>
          </VCol>
        </VRow>
      </VCardText>

      <VCardActions class="justify-space-between pa-4">
        <VBtn
          color="success"
          variant="outlined"
          density="compact"
          :disabled="selectedFile.is_approved === 1"
          @click="handleFileAction('approve')"
        >
          Approve
        </VBtn>
        <VBtn
          color="error"
          variant="outlined"
          density="compact"
          @click="handleFileAction('reject')"
        >
          Reject
        </VBtn>
        <VBtn
          color="primary"
          variant="outlined"
          density="compact"
          @click="viewFile"
        >
          Download File
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
