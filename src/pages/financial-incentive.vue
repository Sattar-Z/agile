<script setup lang="ts">
import Students from '@/views/pages/disbursment/Students.vue'
import { callApi } from '@/helpers/request'
import { useUserStore } from '@/stores/user'

const studentLoading = ref(false)
const termLoading = ref(false)
const paymentLoading = ref(false)
const user = useUserStore()

// null as number | null
const form = ref({
  term: null as number | null,
  school: null as number | null,
  payment: null as number | null,
})

interface School {
  id: number
  name: string
}

interface Term {
  id: number
  term: string
}

const schools = ref<School[]>([])
const payment = ref<School[]>([])
const term = ref<Term[]>([])

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

const fetchStudentData = async () => {
  studentLoading.value = true
  try {
    const response = await callApi({
      url: 'schools',
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()
    if (!response.ok) {
      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = responseData.message || 'Schools list failed'
      alertInfo.type = 'error'
    }
    else {
      schools.value = responseData.data
      if (schools.value.length > 0)
        form.value.school = schools.value[0].id
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'Schools list error'
    alertInfo.type = 'error'
    if (user.isTokenExpired())
      user.removeUser()
  }
  finally {
    studentLoading.value = false
  }
}

const fetchTermData = async () => {
  termLoading.value = true
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
      term.value = responseData.data
      if (term.value.length > 0)
        form.value.term = term.value[0].id
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'Terms list error'
    alertInfo.type = 'error'
    if (user.isTokenExpired())
      user.removeUser()
  }
  finally {
    termLoading.value = false
  }
}

const fetchPaymentData = async () => {
  paymentLoading.value = true
  try {
    const response = await callApi({
      url: 'disbursement/payment_types',
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()
    if (!response.ok) {
      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = responseData.message || 'Payment list failed'
      alertInfo.type = 'error'
    }
    else {
      payment.value = responseData.data
      if (payment.value.length > 0)
        form.value.payment = payment.value[0].id
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'Payment list error'
    alertInfo.type = 'error'
    if (user.isTokenExpired())
      user.removeUser()
  }
  finally {
    paymentLoading.value = false
  }
}

onMounted(() => {
  fetchStudentData()
  fetchTermData()
  fetchPaymentData()
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
  <VRow justify="end">
    <VCol cols="auto">
      <span class="text-caption">Payment</span>
      <VAutocomplete
        v-model="form.payment"
        :items="payment"
        item-title="name"
        item-value="id"
        density="compact"
        variant="solo-filled"
        :loading="paymentLoading"
      />
    </VCol>
    <VCol cols="auto">
      <span class="text-caption">School</span>
      <VAutocomplete
        v-model="form.school"
        :items="schools"
        item-title="name"
        item-value="id"
        density="compact"
        variant="solo-filled"
        :loading="studentLoading"
      />
    </VCol>
    <VCol cols="auto">
      <span class="text-caption">Term</span>
      <VSelect
        v-model="form.term"
        :items="term"
        item-title="term"
        item-value="id"
        density="compact"
        variant="solo-filled"
      />
    </VCol>
  </VRow>

  <VRow>
    <VCol cols="12">
      <Students
        :term-id="form.term"
        :school="form.school"
        :payment="form.payment"
      />
    </VCol>
  </VRow>
</template>
