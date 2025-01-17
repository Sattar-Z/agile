<script setup lang="ts">
import { Parser } from '@json2csv/plainjs'
import { useRouter } from 'vue-router'
import { VDataTableServer } from 'vuetify/labs/VDataTable'

import * as XLSX from 'xlsx'
import LoadingTable from './LoadingTable.vue'
import { callApi } from '@/helpers/request'
import { useUserStore } from '@/stores/user'

// import { toNigerianCurrency } from '@/helpers/numbers'

const props = defineProps<{
  termId: number | null
  session: string
  cohurt: string | null
}>()

const token = ref('')
const attendance = ref(0)

const user = useUserStore()
const router = useRouter()

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

const currentItems = ref<Lgas[]>([])
const selectedLgas = ref<Lgas | null>(null)
const LgaManagementModal = ref(false)

const headers = ref([
  { title: 'LGAS', align: 'start', sortable: false, key: 'name' },
  { title: 'NO of Schools', key: 'schools_count', align: 'center' },
  { title: 'NO of Students', key: 'students_count', align: 'center' },
  { title: 'Verified Accounts', key: 'verified_care_givers_count', align: 'center' },
  { title: 'Unverified Accounts', key: 'unverified_care_givers_count', align: 'center' },
  { title: 'Action', key: 'action', align: 'center' },
] as const)

const lgas = ref<Lgas[]>([])
const isLoaded = ref(false)
const totalItems = ref(0)
const itemsPerPage = ref(10)
const search = ref('')
const exportModal = ref(false)
const exportType = ref<'CSV' | 'Excel' | null>(null)

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
      attendance.value = responseData.data.overall_attendance
      totalItems.value = lgas.value.length
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

// Filter items based on search
const filterItems = (items: Lgas[], searchValue: string): Lgas[] => {
  return items.filter(item => {
    if (!item.name)
      return false

    return item.name?.toLowerCase().includes(searchValue.toLowerCase()) ?? false
  })
}

// Sort items
const sortItems = (items: Lgas[], sortBy: { key: string; order: string }[]): Lgas[] => {
  if (sortBy.length === 0)
    return items

  const [sortItem] = sortBy

  return [...items].sort((a, b) => {
    const aValue = a[sortItem.key as keyof Lgas]
    const bValue = b[sortItem.key as keyof Lgas]

    if (typeof aValue === 'string' && typeof bValue === 'string')
      return sortItem.order === 'desc' ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue)
    if (typeof aValue === 'number' && typeof bValue === 'number')
      return sortItem.order === 'desc' ? bValue - aValue : aValue - bValue

    return 0
  })
}

const loadItems = ({ page, itemsPerPage: itemsPerPageOption, sortBy }: any) => {
  const filteredItems = filterItems(lgas.value, search.value)
  const sortedItems = sortItems(filteredItems, sortBy)

  const start = (page - 1) * itemsPerPageOption
  const end = start + itemsPerPageOption

  currentItems.value = sortedItems.slice(start, end)
  totalItems.value = filteredItems.length

  return { items: currentItems.value, total: totalItems.value }
}

const openExportModal = () => {
  exportModal.value = true
  exportType.value = null
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
  loadItems({ page: 1, itemsPerPage: itemsPerPage.value, sortBy: [] })
})

watch(search, () => {
  totalItems.value = filterItems(lgas.value, search.value).length
})

onMounted(() => {
  fetchData()
})

onMounted(() => {
  const tokenCheckInterval = setInterval(() => {
    if (user.isTokenExpired()) {
      user.removeUser()
      clearInterval(tokenCheckInterval)
    }
  }, 20 * 60 * 1000) // Check every 5 minutes

  onUnmounted(() => {
    clearInterval(tokenCheckInterval)
  })
})

watch(
  () => [props.termId, props.session, props.cohurt],
  () => {
    fetchData()
  },
  { immediate: true },
)
</script>

<template>
  <!-- Snackbar -->
  <VSnackbar
    v-model="alertInfo.show"
    :color="alertInfo.type"
    :timeout="4000"
    elevation="4"
  >
    <p>{{ alertInfo.message }}</p>
    <template #actions>
      <VBtn
        icon="bx-x"
        variant="text"
        @click="alertInfo.show = false"
      />
    </template>
  </VSnackbar>

  <!-- Main Layout -->
  <VRow>
    <VCol>
      <VCard
        variant="tonal"
        color="purple"
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
        <VCardText class="my-auto text-h5">
          {{ attendance }} %
        </VCardText>
      </VCard>
    </VCol>
    <!-- Data Table Section -->
    <VCol
      v-if="isLoaded"
      cols="12"
    >
      <VCard>
        <VRow
          no-gutters
          justify="start"
        >
          <!-- Title -->
          <VCol
            cols="12"
            md="4"
          >
            <VCardText>
              <VCardTitle>All LGAs</VCardTitle>
            </VCardText>
          </VCol>
        </VRow>
        <VRow
          no-gutters
          justify="space-between"
        >
          <!-- Actions -->

          <VCol
            cols="12"
            md="3"
          >
            <VCardText>
              <VTextField
                v-model="search"
                prepend-inner-icon="bx-search"
                label="Search for LGAs"
                density="compact"
                hide-details
              />
            </VCardText>
          </VCol>

          <VCol
            cols="12"
            md="3"
          >
            <VCardText>
              <VBtn
                class="text-subtitle-1"
                text="Export Records"
                size="x-large"
                block
                density="compact"
                @click="openExportModal"
              />
            </VCardText>
          </VCol>
        </VRow>

        <!-- Data Table -->
        <VDataTableServer
          v-model:items-per-page="itemsPerPage"
          :headers="headers"
          :items="currentItems"
          :items-length="totalItems"
          :loading="!isLoaded"
          :search="search"
          class="transaction-table"
          @update:options="loadItems"
        >
          <template #item.is_approved="{ item }">
            <VIcon
              v-if="item.raw.is_approved === 0"
              size="small"
              icon="bx-x-circle"
              color="error"
            />
            <VIcon
              v-else
              size="small"
              icon="bx-check-circle"
              color="success"
            />
          </template>
          <template #item.is_scanned="{ item }">
            <VIcon
              v-if="item.raw.is_scanned === 0"
              size="small"
              icon="bx-x-circle"
              color="error"
            />
            <VIcon
              v-else
              size="small"
              icon="bx-check-circle"
              color="success"
            />
          </template>
          <template #item.action="{ item }">
            <RouterLink
              :to="{
                name: 'attendance-schools',
                params: {
                  id: item.raw.id,
                  name: item.raw.name,
                },
              }"
            >
              <VBtn
                density="compact"
                variant="tonal"
                text="View"
              />
            </RouterLink>
          </template>
        </VDataTableServer>
      </VCard>
    </VCol>

    <!-- Loading Indicator -->
    <VCol
      v-else
      cols="12"
    >
      <LoadingTable type="All LGAs" />
    </VCol>
  </VRow>
  <VDialog
    v-model="LgaManagementModal"
    width="600"
    persistent
  >
    <VCard
      v-if="selectedLgas"
      class="pa-4"
    >
      <VRow justify="space-between">
        <VCol cols="auto">
          <VCardTitle class="text-h5 text-center mb-4">
            File Management
          </VCardTitle>
        </VCol>
        <VCol cols="auto">
          <VBtn
            icon="bx-x"
            variant="text"
            @click="LgaManagementModal = false"
          />
        </VCol>
      </VRow>

      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="6"
          />

          <VCol
            cols="12"
            md="6"
          />
        </VRow>
      </VCardText>
    </VCard>
  </VDialog>
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

<style scoped>
.no-wrap {
  white-space: nowrap;
}

.v-data-table {
  font-size: 0.85rem;
}
</style>
