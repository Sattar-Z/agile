<script setup lang="ts">
import { Parser } from '@json2csv/plainjs'
import * as XLSX from 'xlsx'
import { callApi } from '@/helpers/request'
import { useUserStore } from '@/stores/user'

const token = ref('')
const router = useRouter()

// const selectedCaregiverId = ref<number | null>(null)

const user = useUserStore()

token.value = user.getUserInfo().token

interface Student {
  id: number
  name: string
  date_of_birth: string
  student_admission_number: string
  class: string
  disabilities: string
  school_distance: string
  created_at: string
  updated_at: string
}

interface Accounts {
  id: number
  care_giver_id: number
  account_name: string
  account_number: string
  bank_code: number | null
  created_at: string | null
  updated_at: string | null
  bvn_id: number | null
  is_verified: number | null
  kyc_level: number | null
  error_message: string | null
}

interface Bvn {
  id: number
  bvn: string
  is_approved: number
  is_verified: number
  created_at: string
  updated_at: string
  error_message: string
  is_pending: number
}

interface CareGiver {
  id: number
  bvn_id: number
  nin_id: number
  name: string
  phone: string
  address: string
  community: string
  gender: string
  date_of_birth: string
  qualification: string
  income: string
  photo: string
  signature: string
  certificate: number
  is_employed: number
  date_collected: string
  is_bvn_verfied: number
  is_nin_verfied: number
  status: number
  created_at: string
  updated_at: string
  lga_id: number
  students_count: number
  bvn: Bvn
  accounts: Accounts
  students: Student[]
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

const caregivers = ref<CareGiver[]>([])
const isLoaded = ref(false)
const totalItems = ref(0)

// const itemsPerPage = ref(10)
// const search = ref('')
const exportModal = ref(false)

// Fetch caregivers
const fetchData = async () => {
  isLoaded.value = false
  try {
    const response = await callApi({
      url: 'care_givers',
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()

    if (response.ok) {
      caregivers.value = responseData.data
      totalItems.value = caregivers.value.length
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
  }
  finally {
    isLoaded.value = true
  }
}

const openExportModal = () => {
  exportModal.value = true
}

const exportCSV = () => {
  if (caregivers.value.length === 0) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'No data to export'
    alertInfo.type = 'error'

    return
  }

  const parser = new Parser()
  const csv = parser.parse(caregivers.value)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'caregivers_export.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  exportModal.value = false
}

const exportExcel = () => {
  if (caregivers.value.length === 0) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'No data to export'
    alertInfo.type = 'error'

    return
  }

  const ws = XLSX.utils.json_to_sheet(caregivers.value)
  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, ws, 'Caregivers Export')
  XLSX.writeFile(wb, 'caregivers_export.xlsx')

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
      Download Care Givers Report
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
