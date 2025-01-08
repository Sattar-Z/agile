<script setup lang="ts">
import { callApi } from '@/helpers/request'

const props = defineProps<{
  modelValue: boolean
  studentId: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const loading = ref(false)
const studentData = ref<any>(null)

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

const fetchStudentDetails = async () => {
  if (!props.studentId)
    return

  loading.value = true
  try {
    const response = await callApi({
      url: `student/${props.studentId}`,
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()

    if (response.ok) {
      studentData.value = responseData.data
    }
    else {
      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = responseData.message || 'Failed to fetch student details'
      alertInfo.type = 'error'
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'Something went wrong while fetching student details'
    alertInfo.type = 'error'
  }
  finally {
    loading.value = false
  }
}

watch(() => props.studentId, newId => {
  if (newId)
    fetchStudentDetails()
})

watch(() => props.modelValue, newValue => {
  if (!newValue)
    studentData.value = null
})
</script>

<template>
  <VDialog
    :model-value="modelValue"
    width="800"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard>
      <VCardTitle class="d-flex justify-space-between align-center pa-4">
        <span>Student Details</span>
        <VBtn
          icon="bx-x"
          variant="text"
          @click="emit('update:modelValue', false)"
        />
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-4">
        <VProgressCircular
          v-if="loading"
          indeterminate
          class="d-flex mx-auto my-4"
        />

        <template v-else-if="studentData">
          <VRow>
            <!-- Basic Information -->
            <VCol
              cols="12"
              md="6"
            >
              <h3 class="text-h6 mb-4">
                Basic Information
              </h3>
              <div class="d-flex flex-column gap-2">
                <div><strong>Name:</strong> {{ studentData.name }}</div>
                <div><strong>Admission Number:</strong> {{ studentData.student_admission_number }}</div>
                <div><strong>Class:</strong> {{ studentData.class }}</div>
                <div><strong>Date of Birth:</strong> {{ studentData.date_of_birth }}</div>
                <div><strong>School Distance:</strong> {{ studentData.school_distance }}</div>
              </div>
            </VCol>

            <!-- Attendance Information -->
            <VCol
              cols="12"
              md="6"
            >
              <h3 class="text-h6 mb-4">
                Attendance Information
              </h3>
              <div class="d-flex flex-column gap-2">
                <div><strong>Attendance Rate:</strong> {{ studentData.attendance }}%</div>
                <div><strong>Lateness Rate:</strong> {{ studentData.lateness }}%</div>
              </div>
            </VCol>

            <!-- Caregiver Information -->
            <VCol
              cols="12"
              md="6"
            >
              <h3 class="text-h6 mb-4">
                Caregiver Information
              </h3>
              <div class="d-flex flex-column gap-2">
                <div><strong>Name:</strong> {{ studentData.care_giver.name }}</div>
                <div><strong>Phone:</strong> {{ studentData.care_giver.phone }}</div>
                <div><strong>Address:</strong> {{ studentData.care_giver.address }}</div>
                <div><strong>Community:</strong> {{ studentData.care_giver.community }}</div>
              </div>
            </VCol>

            <!-- School Information -->
            <VCol
              cols="12"
              md="6"
            >
              <h3 class="text-h6 mb-4">
                School Information
              </h3>
              <div class="d-flex flex-column gap-2">
                <div><strong>School:</strong> {{ studentData.school.name }}</div>
                <div><strong>School Code:</strong> {{ studentData.school.code }}</div>
                <div><strong>Education Level:</strong> {{ studentData.school.education_level }}</div>
                <div><strong>LGA:</strong> {{ studentData.lga.name }}</div>
              </div>
            </VCol>
          </VRow>
        </template>
      </VCardText>
    </VCard>

    <VSnackbar
      v-model="alertInfo.show"
      :color="alertInfo.type"
      :timeout="4000"
    >
      {{ alertInfo.message }}
      <template #actions>
        <VBtn
          icon="bx-x"
          @click="alertInfo.show = false"
        />
      </template>
    </VSnackbar>
  </VDialog>
</template>
