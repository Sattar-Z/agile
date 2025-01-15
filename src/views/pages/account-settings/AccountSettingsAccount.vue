<script lang="ts" setup>
import { callApi } from '@/helpers/request'

// Form fields for session configuration
const session = ref('2024')
const term = ref('2')
const startDate = ref('')
const endDate = ref('')
const cohurt = ref('1')
const isLoaded = ref(true)

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

const validateDates = (): boolean => {
  if (!startDate.value || !endDate.value)
    return false

  const start = new Date(startDate.value)
  const end = new Date(endDate.value)

  return start < end
}

const submitForm = async () => {
  if (!validateDates()) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'End date must be after start date'
    alertInfo.type = 'error'

    return
  }

  isLoaded.value = false
  try {
    const payload = {
      session: session.value,
      term: term.value,
      start_date: startDate.value,
      end_date: endDate.value,
      cohurt: cohurt.value,
    }

    const response = await callApi({
      method: 'POST',
      url: 'attendance/term',
      data: payload,
      authorized: true,
    })

    const responseData = await response.json()

    if (response.ok) {
      alertInfo.show = true
      alertInfo.title = 'Success'
      alertInfo.message = responseData.message || 'Session configuration saved successfully'
      alertInfo.type = 'success'
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
  <VCard title="Session Configuration">
    <VCardText>
      <VForm @submit.prevent="submitForm">
        <VRow>
          <VCol
            cols="12"
            sm="6"
          >
            <VTextField
              v-model="session"
              label="Session"
              type="text"
              placeholder="2025"
              :rules="[(v: any) => !!v || 'Session is required']"
            />
          </VCol>
          <VCol
            cols="12"
            sm="6"
          >
            <VTextField
              v-model="term"
              label="Term"
              type="text"
              placeholder="1st"
              :rules="[(v: any) => !!v || 'Term is required']"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol
            cols="12"
            sm="6"
          >
            <VTextField
              v-model="startDate"
              label="Start Date"
              type="date"
              :rules="[(v: any) => !!v || 'Start date is required']"
            />
          </VCol>
          <VCol
            cols="12"
            sm="6"
          >
            <VTextField
              v-model="endDate"
              label="End Date"
              type="date"
              :rules="[(v: any) => !!v || 'End date is required']"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol
            cols="12"
            sm="6"
          >
            <VTextField
              v-model="cohurt"
              label="Cohort"
              type="text"
              placeholder="1"
              :rules="[(v: any) => !!v || 'Cohort is required']"
            />
          </VCol>
        </VRow>
        <div class="d-flex flex-wrap gap-4 mt-4">
          <VBtn
            type="submit"
            :loading="!isLoaded"
          >
            Save Configuration
          </VBtn>
        </div>
      </VForm>
    </VCardText>
  </VCard>
</template>

<style lang="scss" scoped>
.v-table {
  th {
    text-align: start !important;
  }
}
</style>
