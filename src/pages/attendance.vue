<script setup lang="ts">
import LgasTable from '@/views/pages/attendance/LgasTable.vue'

const form = ref({
  session: '2024',
  term: '1',
  cohurt: '1',
})

interface Types {
  name: string
  value: string
}

const termSelect = ref<Types[]>([
  { name: '1st', value: '1' },
])

const cohortSelect = ref<Types[]>([
  { name: '1', value: '1' },
])

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
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
        :items="cohortSelect"
        item-title="name"
        item-value="value"
        density="compact"
        variant="solo-filled"
      />
    </VCol>
    <VCol cols="auto">
      <span class="text-caption">Session</span>
      <VSelect
        v-model="form.session"
        :items="['2024', '2025']"
        density="compact"
        variant="solo-filled"
      />
    </VCol>
    <VCol cols="auto">
      <span class="text-caption">Term</span>
      <VSelect
        v-model="form.term"
        :items="termSelect"
        item-title="name"
        item-value="value"
        density="compact"
        variant="solo-filled"
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
