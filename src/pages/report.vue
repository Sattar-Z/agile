<script setup lang="ts">
import { useRoute } from 'vue-router'
import { callApi } from '@/helpers/request'
import { useUserStore } from '@/stores/user'
import AllStudentTable from '@/views/pages/enrollment/AllStudentTable.vue'
import CareGiversTable from '@/views/pages/enrollment/CareGiversTable.vue'
import LgasTable from '@/views/pages/enrollment/LgasTable.vue'
import Beneficiaries from '@/views/pages/report/Beneficiaries.vue'
import CareGiver from '@/views/pages/report/CareGiver.vue'
import Lga from '@/views/pages/report/Lga.vue'

const termLoading = ref(false)

interface Term {
  id: number
  term: string
  session: string
  start_date: string
  end_date: string
  cohurt: string | null
}

const form = ref({
  session: '',
  term: null as number | null,
  cohurt: null as string | null,
})

const route = useRoute()

const activeTab = ref(route.params.tab)

// tabs
const tabs = [
  { title: 'Beneficiary', icon: 'bxs-graduation', tab: 'Beneficiary' },
  { title: 'Advanced', icon: 'bxs-flag', tab: 'Advanced' },
  { title: 'CareGivers', icon: 'bxs-donate-heart', tab: 'CareGivers' },
  { title: 'Payments', icon: 'bx-money', tab: 'Payments' },
  { title: 'Attendance', icon: 'bx-check', tab: 'Attendance' },
]

const terms = ref<Term[]>([])
const cohurts = ref<string[]>([])
const sessions = ref<string[]>([])

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

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
      terms.value = responseData.data

      // Extract unique cohurts and sessions
      cohurts.value = [...new Set(terms.value.map(t => t.cohurt).filter(Boolean))]
      sessions.value = [...new Set(terms.value.map(t => t.session))]

      // Set initial values
      if (terms.value.length > 0) {
        form.value.term = terms.value[0].id
        form.value.session = terms.value[0].session
      }
      if (cohurts.value.length > 0)
        form.value.cohurt = cohurts.value[0]
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

onMounted(() => {
  fetchTermData()
})
</script>

<template>
  <VRow justify="end">
    <VCol cols="auto">
      <span class="text-caption">Cohort</span>
      <VSelect
        v-model="form.cohurt"
        :items="cohurts"
        density="compact"
        variant="solo-filled"
        :loading="termLoading"
      />
    </VCol>
    <VCol cols="auto">
      <span class="text-caption">Session</span>
      <VSelect
        v-model="form.session"
        :items="sessions"
        density="compact"
        variant="solo-filled"
        :loading="termLoading"
      />
    </VCol>
    <VCol cols="auto">
      <span class="text-caption">Term</span>
      <VSelect
        v-model="form.term"
        :items="terms"
        item-title="term"
        item-value="id"
        density="compact"
        variant="solo-filled"
        :loading="termLoading"
      />
    </VCol>
  </VRow>
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
      class="mt-5 disable-tab-transition"
    >
      <VWindowItem value="Beneficiary">
        <Beneficiaries />
        <AllStudentTable />
      </VWindowItem>
      <VWindowItem value="Advanced">
        <Lga
          :term-id="form.term"
          :session="form.session"
          :cohurt="form.cohurt"
        />

        <LgasTable
          :term-id="form.term"
          :session="form.session"
          :cohurt="form.cohurt"
        />
      </VWindowItem>
      <VWindowItem value="CareGivers">
        <CareGiver />
        <CareGiversTable />
      </VWindowItem>
    </VWindow>
  </div>
</template>
