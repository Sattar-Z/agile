<script setup lang="ts">
import { toNigerianCurrency } from '@/helpers/numbers'
import { callApi } from '@/helpers/request'
import { useUserStore } from '@/stores/user'
import AnalyticsCongratulations from '@/views/dashboard/AnalyticsCongratulations.vue'
import AnalyticsTotalRevenue from '@/views/dashboard/AnalyticsTotalRevenue.vue'

const loading = ref(false)
const student = ref(0)
const attendance = ref(0)
const disbursement = ref(0)
const user = useUserStore()

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

const fetchData = async () => {
  loading.value = true
  try {
    const response = await callApi({
      url: 'dashboard',
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()
    if (!response.ok) {
      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = responseData.message || 'Dashboard failed to load'
      alertInfo.type = 'error'
    }
    else {
      student.value = responseData.data.student_count
      attendance.value = responseData.data.total_attendance_percentage
      disbursement.value = responseData.data.overall_disbursement
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'Dashboard error'
    alertInfo.type = 'error'
    if (user.isTokenExpired())
      user.removeUser()
  }
  finally {
    loading.value = false
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
  <VRow>
    <!-- 👉 Congratulations -->
    <VCol cols="12">
      <AnalyticsCongratulations />
    </VCol>
    <VCol
      cols="12"
      md="4"
    >
      <VCard
        variant="tonal"
        color="primary"
      >
        <VCardItem>
          <div class="d-flex">
            <VIcon
              class="my-auto mx-1"
              icon="bxs-graduation"
            />
            <VCardTitle class="my-auto">
              Total Beneficiaries Enrolled
            </VCardTitle>
          </div>
        </VCardItem>
        <VRow
          no-gutters
          justify="space-between"
        >
          <VCol cols="auto">
            <VCardText class="my-auto text-h5">
              {{ student || 0 }}
            </VCardText>
          </VCol>
          <VCol cols="auto">
            <VCardText>
              <VBtn
                text="View"
                to="/beneficiaries"
                size="small"
              />
            </VCardText>
          </VCol>
        </VRow>
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
        <VCardItem>
          <div class="d-flex">
            <VIcon
              class="my-auto mx-1"
              icon="bx-group"
            />
            <VCardTitle class="my-auto">
              Overall Attendance
            </VCardTitle>
          </div>
        </VCardItem>
        <VRow
          no-gutters
          justify="space-between"
        >
          <VCol cols="auto">
            <VCardText class="my-auto text-h5">
              {{ attendance }} %
            </VCardText>
          </VCol>
          <VCol cols="auto">
            <VCardText>
              <VBtn
                text="View"
                to="/attendance"
                size="small"
              />
            </VCardText>
          </VCol>
        </VRow>
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
        <VCardItem>
          <div class="d-flex">
            <VIcon
              class="my-auto mx-1"
              icon="bx-money"
            />
            <VCardTitle class="my-auto">
              Total Disbursed
            </VCardTitle>
          </div>
        </VCardItem>
        <VRow
          no-gutters
          justify="space-between"
        >
          <VCol cols="auto">
            <VCardText class="my-auto text-h5">
              {{ toNigerianCurrency(disbursement) }}
            </VCardText>
          </VCol>
          <VCol cols="auto">
            <VCardText>
              <VBtn
                text="View"
                to="/disbursement"
                size="small"
              />
            </VCardText>
          </VCol>
        </VRow>
      </VCard>
    </VCol>

    <!-- 👉 Total Revenue -->
    <VCol
      cols="12"
      order="2"
      order-md="1"
    >
      <AnalyticsTotalRevenue />
    </VCol>
  </VRow>
</template>
