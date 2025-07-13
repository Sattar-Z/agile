<script setup lang="ts">
import { callApi } from '@/helpers/request'
import { isAdmin } from '@/middlewares/auth'
import { useUserStore } from '@/stores/user'
import CsvPreviewModal from '@/views/pages/enrollment/modals/CsvPreviewModal.vue'
import StudentTable from '@/views/pages/enrollment/StudentTable.vue'
import Table from '@/views/pages/enrollment/Table2.vue'

interface Term {
  id: number
  term: string
  start_date: string
  end_date: string
  cohurt: string | null
  created_at: string
  updated_at: string
}

interface SessionData {
  session: string
  terms: Term[]
}

const termLoading = ref(false)
const isCardSelected = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const uploadedFile = ref<File | null>(null)
const Admin = ref(isAdmin())
const user = useUserStore().getUser()
const showPreviewModal = ref(false)
const csvData = ref<any[]>([])
const token = user.value.token
const dataInitialized = ref(false)

const form = ref({
  session: '',
  term: null as number | null,
  cohurt: null as string | null,
})

const sessionData = ref<SessionData[]>([])
const cohurts = ref<string[]>([])
const sessions = computed(() => sessionData.value.map(s => s.session))

const availableTerms = computed(() => {
  if (!form.value.session)
    return []
  const selectedSession = sessionData.value.find(s => s.session === form.value.session)

  return selectedSession ? selectedSession.terms : []
})

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

const isFormReady = computed(() => {
  return dataInitialized.value
         && form.value.session
         && form.value.term !== null
         && form.value.cohurt !== null
})

const fetchTermData = async () => {
  termLoading.value = true
  dataInitialized.value = false
  try {
    const response = await callApi({
      url: 'attendance/terms',
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()
    if (!response.ok) {
      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = responseData.message || 'Terms list failed'
      alertInfo.type = 'error'
    }
    else {
      sessionData.value = responseData.data

      // Extract unique cohurts from all terms
      const allTerms = sessionData.value.flatMap(s => s.terms)

      cohurts.value = [...new Set(allTerms.map(t => t.cohurt).filter(Boolean) as string[])]

      // Set initial values
      if (sessionData.value.length > 0) {
        form.value.session = sessionData.value[0].session
        if (sessionData.value[0].terms.length > 0)
          form.value.term = sessionData.value[0].terms[0].id
      }
      if (cohurts.value.length > 0)
        form.value.cohurt = cohurts.value[0]
      dataInitialized.value = true
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'Terms list error'
    alertInfo.type = 'error'
    if (useUserStore().isTokenExpired())
      useUserStore().removeUser()
  }
  finally {
    termLoading.value = false
  }
}

const handleCardClick = () => {
  fileInput.value?.click()
}

const parseCSV = async (file: File) => {
  const text = await file.text()
  const lines = text.split('\n')
  const headers = lines[0].split(',').map(header => header.trim())

  const parsedData = lines.slice(1).map(line => {
    const values = line.split(',')

    return headers.reduce((obj, header, index) => {
      obj[header] = values[index]?.trim()

      return obj
    }, {} as any)
  }).filter(row => Object.values(row).some(value => value))

  csvData.value = parsedData
  showPreviewModal.value = true
}

const handleFileUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    uploadedFile.value = file
    await parseCSV(file)
  }
}

const handleFileDrop = (event: DragEvent) => {
  event.preventDefault()

  const file = event.dataTransfer?.files[0]
  if (file) {
    fileInput.value!.files = event.dataTransfer.files
    uploadedFile.value = file
  }
  isCardSelected.value = false
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isCardSelected.value = true
}

const handleDragLeave = () => {
  isCardSelected.value = false
}

async function submitStudent() {
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
  formData.append('file_type', 'students')

  try {
    const response = await fetch('https://nas-agile.com.ng/api/enrolement/file/upload', {
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

      // Reset the form after successful upload
      uploadedFile.value = null
      csvData.value = []
      if (fileInput.value)
        fileInput.value.value = ''
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
    showPreviewModal.value = false
  }
}

watch(() => form.value.session, newSession => {
  if (newSession) {
    const selectedSession = sessionData.value.find(s => s.session === newSession)
    if (selectedSession && selectedSession.terms.length > 0)
      form.value.term = selectedSession.terms[0].id
    else
      form.value.term = null
  }
  else {
    form.value.term = null
  }
})

onMounted(() => {
  fetchTermData()
})
</script>

<template>
  <VSnackbar
    v-model="alertInfo.show"
    :color="alertInfo.type"
    elevation="74"
    :timeout="4000"
  >
    <p>
      {{ alertInfo.message }}
    </p>

    <template #actions>
      <VBtn
        color="white"
        icon="bx-x"
        @click="alertInfo.show = false"
      />
    </template>
  </VSnackbar>
  <div v-if="!dataInitialized">
    <VRow justify="end">
      <VCol cols="auto">
        <span class="text-caption">Cohort</span>
        <VSkeleton
          type="text"
          height="40"
          width="120"
        />
      </VCol>
      <VCol cols="auto">
        <span class="text-caption">Session</span>
        <VSkeleton
          type="text"
          height="40"
          width="150"
        />
      </VCol>
      <VCol cols="auto">
        <span class="text-caption">Term</span>
        <VSkeleton
          type="text"
          height="40"
          width="120"
        />
      </VCol>
    </VRow>
    <VRow>
      <VCol cols="12">
        <VSkeleton type="table" />
      </VCol>
    </VRow>
  </div>
  <div v-else>
    <CsvPreviewModal
      v-model="showPreviewModal"
      :csv-data="csvData"
      :loading="loading"
      @confirm="submitStudent"
    />
    <VRow justify="end">
      <VCol cols="auto">
        <span class="text-caption">Cohort</span>
        <VSelect
          v-model="form.cohurt"
          :items="[
            { title: '1', value: '1' },
            { title: '2', value: '2' },
            { title: '3', value: '3' },
            { title: '4', value: '4' },
            { title: '5', value: '5' },
          ]"
          density="compact"
          variant="solo-filled"
        />
      </VCol>
      <VCol cols="auto">
        <span class="text-caption">Session</span>
        <VSelect
          v-model="form.session"
          :items="sessions"
          density="compact"
          variant="solo-filled"
        />
      </VCol>
      <VCol cols="auto">
        <span class="text-caption">Term</span>
        <VSelect
          v-model="form.term"
          :items="availableTerms"
          item-title="term"
          item-value="id"
          density="compact"
          variant="solo-filled"
          :disabled="!form.session"
        />
      </VCol>
    </VRow>
    <VRow>
      <VCol
        v-if="!Admin"
        cols="12"
        md="8"
      >
        <VCard variant="outlined">
          <VCardText>
            <VBtn
              icon="bx-upload"
              class="mx-2"
              size="small"
              variant="tonal"
            />Enrollment Summary
          </VCardText>

          <VDivider />
          <VCardItem>
            <Table />
          </VCardItem>
        </VCard>
      </VCol>
      <VCol
        v-if="!Admin"
        cols="12"
        md="4"
      >
        <VCard
          class="border-4 border-dashed cursor-pointer"
          :class="{
            'border-4 border-dashed border-primary': isCardSelected,
            'border-4 border-dashed border-success': uploadedFile,
          }"
          variant="outlined"
          color="primary"
          @click="handleCardClick"
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleFileDrop"
        >
          <VCardText class="d-flex flex-column align-center justify-center pa-8 my-3">
            <img
              src="@images/upload.svg"
              alt="Upload icon"
              class="mb-4"
              width="78"
              height="78"
            >
            <h3 class="text-h5 font-weight-medium mb-2">
              {{
                uploadedFile
                  ? `File selected: ${uploadedFile.name}`
                  : (isCardSelected ? 'Drop your files here' : 'Click to upload files')
              }}
            </h3>
            <p class="text-body-1 text-grey-darken-1">
              Maximum size: 50MB
            </p>
            <input
              ref="fileInput"
              type="file"
              accept=".csv"
              class="d-none"
              @change="handleFileUpload"
            >
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        v-if="Admin"
        cols="12"
      >
        <VCard
          variant="outlined"
          closable
        >
          <VCardText>
            <VBtn
              icon="bx-upload"
              class="mx-2"
              size="small"
              variant="tonal"
            />Enrollment Summary
          </VCardText>

          <VDivider />
          <VCardItem>
            <Table />
          </VCardItem>
        </VCard>
      </VCol>
      <VCol cols="12">
        <StudentTable
          v-if="isFormReady"
          :term-id="form.term"
          :session="form.session"
          :cohurt="form.cohurt"
        />
        <div
          v-else
          class="d-flex justify-center align-center"
          style="min-height: 100px;"
        >
          <VProgressCircular
            indeterminate
            color="primary"
            size="32"
          />
          <span class="mx-3">Loading data...</span>
        </div>
      </VCol>
    </VRow>
  </div>
</template>
