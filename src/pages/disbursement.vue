<script setup lang="ts">
import { callApi } from '@/helpers/request'
import { useUserStore } from '@/stores/user'
import SchoolTable from '@/views/pages/disbursement/SchoolTable.vue'
import Students from '@/views/pages/disbursement/Students.vue'

const studentLoading = ref(false)
const lgaLoading = ref(false)
const termLoading = ref(false)
const paymentLoading = ref(false)
const user = useUserStore()

// null as number | null
const form = ref({
  term: null as number | null,
  school: null as number | null,
  lga: null as number | null,
  payment: null as number | null,
  cohurt: null as string | null,
  session: null as string | null,
})

interface School {
  id: number
  name: string
}

interface Term {
  id: number
  term: string
  session: string
  start_date: string
  end_date: string
  cohurt: string | null
}

const schools = ref<School[]>([])
const lga = ref<School[]>([])
const payment = ref<School[]>([])
const term = ref<Term[]>([])
const cohurts = ref<string[]>([])
const session = ref<string[]>([])

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

const route = useRoute()

const activeTab = ref(route.params.tab)

// tabs
const tabs = [
  { title: 'School', icon: 'bxs-school', tab: 'school' },
  { title: 'Students', icon: 'bxs-graduation', tab: 'student' },
]

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

const fetchSchoolData = async () => {
  lgaLoading.value = true
  try {
    const response = await callApi({
      url: 'lgas',
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()
    if (!response.ok) {
      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = responseData.message || 'LGA list failed'
      alertInfo.type = 'error'
    }
    else {
      lga.value = responseData.data.lgas
      if (lga.value.length > 0)
        form.value.lga = lga.value[0].id
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'LGA list error'
    alertInfo.type = 'error'
    if (user.isTokenExpired())
      user.removeUser()
  }
  finally {
    lgaLoading.value = false
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
      session.value = [...new Set(term.value.map(t => t.session).filter(Boolean))]
      cohurts.value = [...new Set(term.value.map(t => t.cohurt).filter(Boolean))]
      if (term.value.length > 0)
        form.value.term = term.value[0].id
      if (cohurts.value.length > 0)
        form.value.cohurt = cohurts.value[0]
      if (session.value.length > 0)
        form.value.session = session.value[0]
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

const handleViewSchool = (schoolId: number) => {
  form.value.school = schoolId
  activeTab.value = 'student'
}

onMounted(() => {
  fetchStudentData()
  fetchTermData()
  fetchPaymentData()
  fetchSchoolData()
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
  <div>
    <VTabs
      v-model="activeTab"
      show-arrows
      align-tabs="center"
    >
      <VTab
        v-for="item in tabs"
        :key="item.icon"
        :value="item.tab"
      >
        <VIcon
          size="20"
          start
          :icon="item.icon"
        />
        {{ item.title }}
      </VTab>
    </VTabs>
    <VDivider />
    <VWindow
      v-model="activeTab"
      class="mt-5"
    >
      <!-- School -->
      <VWindowItem value="school">
        <VRow>
          <VCol cols="auto">
            <span class="text-caption">Cohurt</span>
            <VSelect
              v-model="form.cohurt"
              :items="cohurts"
              density="compact"
              variant="solo-filled"
              :loading="termLoading"
            />
          </VCol>
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
            <span class="text-caption">Session</span>
            <VSelect
              v-model="form.session"
              :items="session"
              density="compact"
              variant="solo-filled"
              :loading="termLoading"
            />
          </VCol>
          <VCol cols="auto">
            <span class="text-caption">LGA</span>
            <VAutocomplete
              v-model="form.lga"
              :items="lga"
              item-title="name"
              item-value="id"
              density="compact"
              variant="solo-filled"
              :loading="lgaLoading"
            />
          </VCol>
          <VCol cols="12">
            <SchoolTable
              :payment="form.payment"
              :session="session"
              :lga-id="form.lga"
              :cohurt="form.cohurt"
              @view-school="handleViewSchool"
            />
          </VCol>
        </VRow>
      </VWindowItem>
      <!-- Student -->
      <VWindowItem value="student">
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
            <span class="text-caption">Cohurt</span>
            <VSelect
              v-model="form.cohurt"
              :items="cohurts"
              density="compact"
              variant="solo-filled"
              :loading="termLoading"
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
              :cohurt="form.cohurt"
            />
          </VCol>
        </VRow>
      </VWindowItem>
    </VWindow>
  </div>
</template>
