<script setup lang="ts">
import { isAdmin } from '@/middlewares/auth'
import { useUserStore } from '@/stores/user'
import AllStudentTable from '@/views/pages/enrollment/AllStudentTable.vue'
import LgasTable from '@/views/pages/enrollment/LgasTable.vue'
import CsvPreviewModal from '@/views/pages/enrollment/modals/CsvPreviewModal.vue'
import Table from '@/views/pages/enrollment/Table2.vue'

const isCardSelected = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const uploadedFile = ref<File | null>(null)
const Admin = ref(isAdmin())
const user = useUserStore().getUser()
const showPreviewModal = ref(false)
const csvData = ref<any[]>([])

const token = user.value.token

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

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

const handleFileDrop = async (event: DragEvent) => {
  event.preventDefault()

  const file = event.dataTransfer?.files[0]
  if (file) {
    fileInput.value!.files = event.dataTransfer.files
    uploadedFile.value = file
    await parseCSV(file)
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
    const response = await fetch('https://staging-agile.moneta.ng/api/enrolement/file/upload', {
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
</script>

<template>
  <VSnackbar
    v-model="alertInfo.show"
    :color="alertInfo.type"
    elevation="74"
    :timeout="4000"
  >
    <p>{{ alertInfo.message }}</p>
    <template #actions>
      <VBtn
        color="white"
        icon="bx-x"
        @click="alertInfo.show = false"
      />
    </template>
  </VSnackbar>

  <CsvPreviewModal
    v-model="showPreviewModal"
    :csv-data="csvData"
    :loading="loading"
    @confirm="submitStudent"
  />

  <VRow>
    <VCol
      v-if="!Admin"
      cols="8"
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
      cols="4"
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
      <AllStudentTable />
    </VCol>
    <VCol cols="12">
      <LgasTable />
    </VCol>
  </VRow>
</template>
