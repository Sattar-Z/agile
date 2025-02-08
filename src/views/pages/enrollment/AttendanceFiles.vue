<script setup lang="ts">
import { useRouter } from 'vue-router'
import LoadingTable from './LoadingTable.vue'
import ErrorDetailsModal from './modals/ErrorDetailsModal.vue'
import FileContentsDialog from './modals/FileContentsDialog.vue'
import { useUserStore } from '@/stores/user'
import { isAdmin } from '@/middlewares/auth'
import { callApi } from '@/helpers/request'

const users = useUserStore()
const errorDetailsModal = ref(false)
const currentErrorMessage = ref('')
const router = useRouter()
const Admin = ref(isAdmin())
const deleteLoad = ref(false)

const fileContents = ref<any[]>([])
const fileContentsModal = ref(false)
const fileContentHeaders = ref<any[]>([])
const fileContentSearch = ref('')
const selectedCategory = ref<'approved' | 'pending' | 'rejected' | null>(null)

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
  updated_at: string | null
  error_message: string | null
  scan_trial: string | null
}

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

const files = ref<Files[]>([])
const isLoaded = ref(false)
const selectedFile = ref<Files | null>(null)
const fileManagementModal = ref(false)

const showErrorDetails = (errorMessage: string) => {
  currentErrorMessage.value = errorMessage
  errorDetailsModal.value = true
}

// Filter for attendance files only
const filteredFiles = computed(() =>
  files.value.filter(file => file.file_type === 'attendance'),
)

// New computed properties for file categories using filtered files
const approvedFiles = computed(() =>
  filteredFiles.value.filter(file => file.is_approved === 1),
)

const pendingFiles = computed(() =>
  filteredFiles.value.filter(file => file.is_approved === 0 && !file.error_message),
)

const rejectedFiles = computed(() =>
  filteredFiles.value.filter(file => file.error_message && file.is_approved === 0),
)

const sortedFiles = computed(() => {
  return [...filteredFiles.value].sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime()
    const dateB = new Date(b.created_at || 0).getTime()

    return dateB - dateA
  })
})

const categoryMappings = {
  approved: () => sortedFiles.value.filter(file => file.is_approved === 1),
  pending: () => sortedFiles.value.filter(file => file.is_approved === 0 && !file.error_message),
  rejected: () => sortedFiles.value.filter(file => file.error_message && file.is_approved === 0),
} as const

const performApiCall = async (file: Files, action: 'approve' | 'reject') => {
  return callApi({
    url: `enrolement/file/${action}/${file.id}`,
    method: 'POST',
    authorized: true,
    showAlert: false,
  })
}

// Helper to update the local files array
const updateLocalFileState = (fileId: number | null, action: 'approve' | 'reject') => {
  if (fileId === null) {
    console.error('File ID is null, cannot update file state.')

    return
  }

  const fileIndex = files.value.findIndex(f => f.id === fileId)
  if (fileIndex !== -1) {
    files.value[fileIndex].is_approved = action === 'approve' ? 1 : 0

    if (action === 'reject')
      files.value[fileIndex].error_message = 'File rejected by user'
  }
}

// Helper to show alert messages
const showAlert = (title: string, message: string, type: 'success' | 'error') => {
  alertInfo.show = true
  alertInfo.title = title
  alertInfo.message = message
  alertInfo.type = type
}

// Helper to close the modal
const closeModalIfOpen = () => {
  if (fileManagementModal.value)
    fileManagementModal.value = false
}

const handleFileAction = async (file: Files, action: 'approve' | 'reject') => {
  try {
    const response = await performApiCall(file, action)
    const responseData = await response.json()

    if (response.ok) {
      updateLocalFileState(file.id, action)
      showAlert('Success', `File ${action}d successfully`, 'success')
      closeModalIfOpen()
    }
    else {
      throw new Error(responseData.message || 'Failed to perform action')
    }
  }
  catch (error) {
    const errorMessage
      = error instanceof Error ? error.message : 'Something went wrong'

    showAlert('Error', errorMessage, 'error')
  }
}

const viewFileLoad = ref(false)
const viewingFileId = ref<number | null>(null)

const viewFile = async (file: Files) => {
  if (!file.id)
    return
  viewingFileId.value = file.id
  viewFileLoad.value = true
  try {
    const response = await callApi({
      url: `enrolement/file/download/${file.id}`,
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    if (response.ok) {
      const csvData = await response.text()

      const parseCSV = (csv: string) => {
        const lines = csv.split('\n')
        const header1 = lines[0].split(',')

        fileContentHeaders.value = header1.map(header => ({
          title: header.trim(),
          key: header.trim(),
          sortable: true,
          align: 'start',
        }))

        const data = lines.slice(1)
          .filter(line => line.trim() !== '')
          .map(line => {
            const values = line.split(',')

            return header1.reduce((obj, header, index) => {
              obj[header.trim()] = values[index] ? values[index].trim() : ''

              return obj
            }, {} as any)
          })

        fileContents.value = data
        fileContentSearch.value = ''
        fileContentsModal.value = true
      }

      parseCSV(csvData)
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
  finally {
    viewFileLoad.value = false
    viewingFileId.value = null
  }
}

const formatDate = (date: string | null): string => {
  if (!date)
    return ''

  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const isNewFile = (date: string | null): boolean => {
  if (!date)
    return false
  const fileDate = new Date(date)
  const today = new Date()

  return fileDate.toDateString() === today.toDateString()
}

const currentFiles = computed(() => {
  return selectedCategory.value
    ? categoryMappings[selectedCategory.value]()
    : []
})

// Format functions
const formatFileName = (fileName: string): string => {
  const parts = fileName.split('_')

  parts.shift()

  return parts.join('_').replace('.csv', '')
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

const fetchData = async () => {
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
      // Explicitly type the data as Files[] and then filter
      const filesData = Object.values(responseData.data) as Files[]

      files.value = filesData.filter(file => file.file_type === 'attendance')
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

const deleteFileId = ref<number | null>(null)

const deleteFile = async (file: Files) => {
  deleteFileId.value = file.id
  deleteLoad.value = true

  try {
    const response = await callApi({
      url: `enrolement/file/delete/${file.id}`,
      method: 'POST',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()

    if (response.ok) {
      alertInfo.show = true
      alertInfo.title = 'Success'
      alertInfo.message = responseData.message || 'File Deleted'
      alertInfo.type = 'success'
      fetchData()
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
    alertInfo.message = error instanceof Error ? error.message : 'Something went wrong'
    alertInfo.type = 'error'
  }
  finally {
    deleteLoad.value = false
    deleteFileId.value = null
  }
}

onMounted(() => {
  fetchData()
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

  <VRow v-if="isLoaded">
    <template v-if="!selectedCategory">
      <VCol
        cols="12"
        md="4"
      >
        <VCard
          class="h-100"
          variant="tonal"
          color="primary"
          @click="selectedCategory = 'approved'"
        >
          <VCardTitle class="d-flex align-center pa-4">
            <VIcon
              icon="bx-check-circle"
              color="primary"
              size="48"
            />
            <span class="mx-4">Approved Attendance Files</span>
          </VCardTitle>
          <VCardText class="text-h4">
            {{ approvedFiles.length }}
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="4"
      >
        <VCard
          class="h-100"
          variant="tonal"
          color="primary"
          @click="selectedCategory = 'pending'"
        >
          <VCardTitle class="d-flex align-center pa-4">
            <VIcon
              icon="bx-time"
              color="primary"
              size="48"
            />
            <span class="mx-4">Pending Attendance Files</span>
          </VCardTitle>
          <VCardText class="text-h4">
            {{ pendingFiles.length }}
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="4"
      >
        <VCard
          class="h-100"
          variant="tonal"
          color="primary"
          @click="selectedCategory = 'rejected'"
        >
          <VCardTitle class="d-flex align-center pa-4">
            <VIcon
              icon="bx-x-circle"
              color="primary"
              size="48"
            />
            <span class="mx-4">Rejected Attendance Files</span>
          </VCardTitle>
          <VCardText class="text-h4">
            {{ rejectedFiles.length }}
          </VCardText>
        </VCard>
      </VCol>
    </template>

    <!-- Detailed Card View (when category is selected) -->
    <template v-else>
      <VCol cols="12">
        <VCard class="mb-4">
          <VCardTitle class="d-flex align-center justify-space-between pa-4">
            <div class="d-flex align-center">
              <VBtn
                icon
                variant="text"
                class="me-2"
                @click="selectedCategory = null"
              >
                <VIcon icon="bx-arrow-back" />
              </VBtn>
              {{ selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1) }} Files
            </div>
          </VCardTitle>
        </VCard>

        <VRow>
          <VCol
            v-for="file in currentFiles"
            :key="file.id"
            cols="12"
            md="6"
            lg="4"
          >
            <VCard>
              <VRow justify="space-between">
                <VCol cols="auto">
                  <VCardTitle class="d-flex align-center justify-space-between pa-4">
                    <div class="text-truncate">
                      {{ formatFileName(file.file_name || '') }}
                    </div>
                    <VChip
                      v-if="isNewFile(file.created_at)"
                      color="primary"
                      size="small"
                      class="ms-2"
                    >
                      New
                    </VChip>
                  </VCardTitle>
                </VCol>
                <VCol
                  v-if="file.error_message"
                  cols="auto"
                >
                  <VBtn
                    color="error"
                    variant="text"
                    density="compact"
                    icon="bx-error-circle"
                    @click="showErrorDetails(file.error_message)"
                  />
                </VCol>
              </VRow>
              <VCardText>
                <VRow>
                  <VCol cols="6">
                    <div class="text-caption">
                      Size
                    </div>
                    <div>{{ formatFileSize(Number(file.file_size)) }}</div>
                  </VCol>
                  <VCol cols="6">
                    <div class="text-caption">
                      Status
                    </div>
                    <VChip
                      :color="file.is_approved ? 'success' : file.error_message ? 'error' : 'warning'"
                      size="small"
                    >
                      {{ file.is_approved ? 'Approved' : file.error_message ? 'Rejected' : 'Pending' }}
                    </VChip>
                  </VCol>
                </VRow>
                <VRow class="mt-2">
                  <VCol cols="12">
                    <div class="text-caption">
                      Date Added
                    </div>
                    <div>{{ formatDate(file.created_at) }}</div>
                  </VCol>
                </VRow>
              </VCardText>
              <VDivider class="my-3" />
              <VCardActions>
                <VBtn
                  variant="outlined"
                  color="primary"
                  :loading="viewingFileId === file.id"
                  density="compact"
                  @click="viewFile(file)"
                >
                  View File
                </VBtn>
                <VSpacer />
                <VBtn
                  v-if="Admin && !file.is_approved && !file.error_message"
                  variant="outlined"
                  color="success"
                  density="compact"
                  @click="handleFileAction(file, 'approve')"
                >
                  Approve
                </VBtn>
                <VBtn
                  v-if="file.is_approved || file.error_message"
                  variant="outlined"
                  color="error"
                  :loading="deleteFileId === file.id"
                  density="compact"
                  @click="deleteFile(file)"
                >
                  Delete
                </VBtn>
                <VBtn
                  v-if="Admin && !file.error_message && !file.is_approved"
                  variant="outlined"
                  color="error"
                  density="compact"
                  @click="handleFileAction(file, 'reject')"
                >
                  Reject
                </VBtn>
              </VCardActions>
            </VCard>
          </VCol>
        </VRow>
      </VCol>
    </template>
  </VRow>

  <VRow v-else>
    <VCol cols="12">
      <LoadingTable type="Attendance Files" />
    </VCol>
  </VRow>

  <ErrorDetailsModal
    v-model="errorDetailsModal"
    :error-message="currentErrorMessage"
  />

  <FileContentsDialog
    v-model="fileContentsModal"
    :file-name="formatFileName(selectedFile?.file_name || '')"
    :file-contents="fileContents"
    :file-content-headers="fileContentHeaders"
  />
</template>

<style scoped>
.v-card {
  transition: transform 0.2s;
}

.v-card:hover {
  cursor: pointer;
  transform: translateY(-2px);
}

.v-card-title {
  font-size: 1.1rem;
}

.text-caption {
  color: rgba(var(--v-theme-on-surface), 0.6);
}
</style>
