<script setup lang="ts">
import { isAdmin } from '@/middlewares/auth'
import StudentTable from '@/views/pages/enrollment/StudentTable.vue'
import { useUserStore } from '@/stores/user'
import Table from '@/views/pages/enrollment/Table.vue'

const isCardSelected = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const token = ref('')
const loading = ref(false)
const uploadedFile = ref<File | null>(null)
const Admin = ref(isAdmin())
const user = useUserStore()

token.value = user.getUserInfo().token

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

const handleCardClick = () => {
  fileInput.value?.click()
}

const handleFileUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file)
    uploadedFile.value = file
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

async function submit() {
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
    const response = await fetch('https://staging-agile.moneta.ng/api/enrolement/file/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    // Handle response similarly to your existing code
    if (response.ok) {
      const { message } = await response.json()

      alertInfo.show = true
      alertInfo.title = 'Success'
      alertInfo.message = message
      alertInfo.type = 'success'
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

    // Handle response similarly to your existing code
    if (response.ok) {
      const { message } = await response.json()

      alertInfo.show = true
      alertInfo.title = 'Success'
      alertInfo.message = message
      alertInfo.type = 'success'
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
  <VRow>
    <VCol
      v-if="!Admin"
      cols="12"
    >
      <VCard
        class="mt-4 cursor-pointer"
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
        <VCardText class="d-flex flex-column align-center justify-center pa-8">
          <img
            src="@images/upload.svg"
            alt="Upload icon"
            class="mb-4"
            width="68"
            height="68"
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
            class="d-none"
            @change="handleFileUpload"
          >
        </VCardText>
      </VCard>
    </VCol>
    <VCol
      v-if="!Admin"
      cols="auto"
      class="mt-4"
    >
      <VBtn
        :loading="loading"
        color="primary"
        @click="submit"
      >
        Upload School Info
      </VBtn>
    </VCol>
    <VCol
      v-if="!Admin"
      cols="auto"
      class="mt-4"
    >
      <VBtn
        :loading="loading"
        variant="tonal"
        color="primary"
        @click="submitStudent"
      >
        Upload Student Info
      </VBtn>
    </VCol>
    <VCol
      v-if="Admin"
      cols="12"
    >
      <Table />
    </VCol>
    <VCol cols="12">
      <StudentTable />
    </VCol>
  </VRow>
</template>
