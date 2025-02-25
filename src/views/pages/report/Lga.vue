<script setup lang="ts">
import { Parser } from '@json2csv/plainjs'
import * as XLSX from 'xlsx'
import { callApi } from '@/helpers/request'
import { useUserStore } from '@/stores/user'

const props = defineProps<{
  termId: number | null
  session: string
  cohurt: string | null
}>()

const token = ref('')
const router = useRouter()

// const selectedCaregiverId = ref<number | null>(null)

const user = useUserStore()

token.value = user.getUserInfo().token

interface Lgas {
  id: number | null
  name: string | null
  daily_attendance_percentage: string | null
  schools_count: number | null
  students_count: number | null
  verified_care_givers_count: number | null
  unverified_care_givers_count: number | null
  created_at: string | null
}

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

// const currentItems = ref<CareGiver[]>([])
// const selectedCareGiver = ref<CareGiver | null>(null)
// const deleteModal = ref(false)
// const editModal = ref(false)

// const headers = ref([
//   { title: 'Name', align: 'start', sortable: true, key: 'name' },
//   { title: 'Phone', key: 'phone', align: 'center' },
//   { title: 'Community', key: 'community', align: 'center' },
//   { title: 'Students Count', key: 'students_count', align: 'center' },
//   { title: 'Gender', key: 'gender', align: 'center' },
//   { title: 'Income', key: 'income', align: 'center' },
//   { title: 'Account Status', key: 'is_bvn_verfied', align: 'center' },
//   { title: 'Action', key: 'action', align: 'center' },
// ] as const)

const lgas = ref<Lgas[]>([])
const isLoaded = ref(false)

// const itemsPerPage = ref(10)
// const search = ref('')
const exportModal = ref(false)

// Fetch caregivers
const fetchData = async () => {
  isLoaded.value = false
  try {
    const response = await callApi({
      url: `lgas?term_id=${props.termId}&session=${props.session}&cohurt=${props.cohurt}`,
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()

    if (response.ok) {
      lgas.value = Object.values(responseData.data.lgas)
    }
    else if (response.status === 401) {
      user.removeUser()
      router.push({ name: 'login' })
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
    if (user.isTokenExpired())
      user.removeUser()
  }
  finally {
    isLoaded.value = true
  }
}

const openExportModal = () => {
  exportModal.value = true
}

const exportCSV = () => {
  if (lgas.value.length === 0) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'No data to export'
    alertInfo.type = 'error'

    return
  }

  const parser = new Parser()
  const csv = parser.parse(lgas.value)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'lga_export.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  exportModal.value = false
}

const exportExcel = () => {
  if (lgas.value.length === 0) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'No data to export'
    alertInfo.type = 'error'

    return
  }

  const ws = XLSX.utils.json_to_sheet(lgas.value)
  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, ws, 'LGA Export')
  XLSX.writeFile(wb, 'lga_export.xlsx')

  exportModal.value = false
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <VCard
    class="cursor-pointer"
    variant="tonal"
    color="primary"
    @click="openExportModal"
  >
    <VCardItem class="text-center">
      Download LGA Report
    </VCardItem>
  </VCard>
  <VDialog
    v-model="exportModal"
    width="500"
    persistent
  >
    <VCard class="pa-6">
      <VRow justify="space-between">
        <VCol cols="auto">
          <VCardTitle class="text-h5 text-center mb-4">
            Export Records
          </VCardTitle>
        </VCol>
        <VCol cols="auto">
          <VBtn
            icon="bx-x"
            variant="text"
            @click="exportModal = false"
          />
        </VCol>
      </VRow>

      <VCardText>
        <VRow class="d-flex justify-center">
          <VCol
            cols="12"
            md="5"
            class="d-flex justify-center"
          >
            <VBtn
              color="primary"
              variant="elevated"
              size="x-large"
              class="mx-2"
              @click="exportCSV"
            >
              <VIcon
                start
                icon="bx-file"
              />
              CSV
            </VBtn>
            <VBtn
              color="success"
              variant="elevated"
              size="x-large"
              @click="exportExcel"
            >
              <VIcon
                start
                icon="bx-table"
              />
              Excel
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>
  </VDialog>
</template>
