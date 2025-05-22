<script setup lang="ts">
import LgasTable from '@/views/pages/attendance/LgasTable.vue'
import { useUserStore } from '@/stores/user'
import { callApi } from '@/helpers/request'

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

// Watch for session changes to reset term selection
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
        :items="availableTerms"
        item-title="term"
        item-value="id"
        density="compact"
        variant="solo-filled"
        :loading="termLoading"
        :disabled="!form.session"
      />
    </VCol>
  </VRow>

  <VRow>
    <VCol cols="12">
      <LgasTable
        :term-id="form.term"
        :session="form.session"
        :cohurt="form.cohurt"
      />
    </VCol>
  </VRow>
</template>
