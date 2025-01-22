<script setup lang="ts">
import { useRouter } from 'vue-router'
import { VDataTableServer } from 'vuetify/labs/VDataTable'
import LoadingTable from './LoadingTable.vue'
import { useUserStore } from '@/stores/user'
import { callApi } from '@/helpers/request'

const user = useUserStore()
const router = useRouter()
const loadingRoles = ref(false)
interface UserRole {
  id: number
  name: string
  status: number
  created_at: string
}

interface User {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  phone: string
  status: number
  created_at: string
  updated_at: string
  role_id: number
  role: UserRole
}

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

const currentItems = ref<User[]>([])
const selectedUser = ref<User | null>(null)
const userUpdateModal = ref(false)
const roles = ref<UserRole[]>([])

const headers = ref([
  { title: 'Name', align: 'start', sortable: true, key: 'name' },
  { title: 'Email', key: 'email', align: 'start', sortable: true },
  { title: 'Phone', key: 'phone', align: 'start' },
  { title: 'Role', key: 'role.name', align: 'center' },
  { title: 'Status', key: 'status', align: 'center' },
  { title: 'Created At', key: 'created_at', align: 'center' },
  { title: 'Action', key: 'action', align: 'center' },
] as const)

const users = ref<User[]>([])
const isLoaded = ref(false)
const totalItems = ref(0)
const itemsPerPage = ref(10)
const search = ref('')

async function fetchRoles() {
  loadingRoles.value = true
  try {
    const response = await callApi({
      url: 'roles',
      method: 'GET',
      authorized: true,
    })

    const responseData = await response.json()

    if (!response.ok) {
      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = 'Failed to fetch roles'
      alertInfo.type = 'error'

      return
    }

    // Ensure responseData is an array
    if (Array.isArray(responseData)) {
      roles.value = responseData.filter(role => role.status === 1) // Only get active roles
    }
    else if (responseData.data && Array.isArray(responseData.data)) {
      roles.value = responseData.data.filter((role: UserRole) => role.status === 1)
    }
    else {
      // If response is a single object, wrap it in an array
      roles.value = [responseData].filter(role => role.status === 1)
    }
  }
  catch (error) {
    console.error('Error fetching roles:', error)
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'Failed to load roles'
    alertInfo.type = 'error'
    roles.value = [] // Ensure roles is an array even on error
  }
  finally {
    loadingRoles.value = false
  }
}

const fetchData = async () => {
  isLoaded.value = false
  try {
    const response = await callApi({
      url: 'users',
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()

    if (response.ok) {
      users.value = responseData.data
      totalItems.value = users.value.length
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

const filterItems = (items: User[], searchValue: string): User[] => {
  return items.filter(item => {
    return item.name.toLowerCase().includes(searchValue.toLowerCase())
      || item.email.toLowerCase().includes(searchValue.toLowerCase())
      || item.phone.toLowerCase().includes(searchValue.toLowerCase())
  })
}

const getValue = (obj: any, key: string): any => {
  return key.includes('.')
    ? key.split('.').reduce((nestedObj, nestedKey) => nestedObj[nestedKey], obj)
    : obj[key]
}

const compareValues = (aValue: any, bValue: any, order: string): number => {
  if (typeof aValue === 'string' && typeof bValue === 'string')
    return order === 'desc' ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue)

  if (typeof aValue === 'number' && typeof bValue === 'number')
    return order === 'desc' ? bValue - aValue : aValue - bValue

  return 0
}

const sortItems = (items: User[], sortBy: { key: string; order: string }[]): User[] => {
  if (sortBy.length === 0)
    return items

  const [sortItem] = sortBy
  const { key, order } = sortItem

  return [...items].sort((a, b) => {
    const aValue = getValue(a, key)
    const bValue = getValue(b, key)

    return compareValues(aValue, bValue, order)
  })
}

const loadItems = ({ page, itemsPerPage: itemsPerPageOption, sortBy }: any) => {
  const filteredItems = filterItems(users.value, search.value)
  const sortedItems = sortItems(filteredItems, sortBy)

  const start = (page - 1) * itemsPerPageOption
  const end = start + itemsPerPageOption

  currentItems.value = sortedItems.slice(start, end)
  totalItems.value = filteredItems.length

  return { items: currentItems.value, total: totalItems.value }
}

const formData = ref({
  user_id: '',
  phone: '',
  name: '',
  status: false,
  role_id: null as number | null,
  password: '',
})

// Reset form to selected user's data
const resetForm = () => {
  if (selectedUser.value) {
    formData.value = {
      user_id: selectedUser.value.id.toString(),
      phone: selectedUser.value.phone,
      name: selectedUser.value.name,
      status: selectedUser.value.status === 1,
      role_id: selectedUser.value.role_id,
      password: '', // Password is empty by default as it's optional
    }
  }
}

const openUpdateModal = (auser: User) => {
  selectedUser.value = auser
  userUpdateModal.value = true
  resetForm()
}

const handleSubmit = async () => {
  try {
    const response = await callApi({
      url: 'users/update',
      method: 'POST',
      data: formData.value,
      authorized: true,
    })

    const responseData = await response.json()

    if (response.ok) {
      alertInfo.show = true
      alertInfo.title = 'Success'
      alertInfo.message = 'User updated successfully'
      alertInfo.type = 'success'
      userUpdateModal.value = false
      fetchData() // Refresh the table
    }
    else {
      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = responseData.message || 'Failed to update user'
      alertInfo.type = 'error'
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'Something went wrong please try again later'
    alertInfo.type = 'error'
  }
}

onMounted(() => {
  fetchData()
  fetchRoles()
  loadItems({ page: 1, itemsPerPage: itemsPerPage.value, sortBy: [] })
})

watch(search, () => {
  totalItems.value = filterItems(users.value, search.value).length
})
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
    <VCol
      v-if="isLoaded"
      cols="12"
    >
      <VCard>
        <VRow
          no-gutters
          justify="space-between"
        >
          <VCol
            cols="12"
            md="4"
          >
            <VCardText>
              <VCardTitle>Users Management</VCardTitle>
            </VCardText>
          </VCol>
          <VCol
            cols="12"
            md="4"
          >
            <VCardText>
              <VTextField
                v-model="search"
                prepend-inner-icon="bx-search"
                label="Search users"
                density="compact"
                hide-details
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
          class="user-table"
          @update:options="loadItems"
        >
          <template #item.status="{ item }">
            <VChip
              :color="item.raw.status === 1 ? 'success' : 'error'"
              size="small"
            >
              {{ item.raw.status === 1 ? 'Active' : 'Inactive' }}
            </VChip>
          </template>
          <template #item.created_at="{ item }">
            {{ new Date(item.raw.created_at).toLocaleDateString() }}
          </template>
          <template #item.action="{ item }">
            <VBtn
              color="primary"
              density="compact"
              variant="tonal"
              @click="openUpdateModal(item.raw)"
            >
              Update
            </VBtn>
          </template>
        </VDataTableServer>
      </VCard>
    </VCol>

    <!-- Loading Indicator -->
    <VCol
      v-else
      cols="12"
    >
      <LoadingTable type="Users" />
    </VCol>
  </VRow>

  <!-- Update User Modal -->
  <VDialog
    v-model="userUpdateModal"
    width="600"
    persistent
  >
    <VCard
      v-if="selectedUser"
      class="pa-4"
    >
      <VRow justify="space-between">
        <VCol cols="auto">
          <VCardTitle class="text-h5 text-center mb-4">
            Update User
          </VCardTitle>
        </VCol>
        <VCol cols="auto">
          <VBtn
            icon="bx-x"
            variant="text"
            @click="userUpdateModal = false"
          />
        </VCol>
      </VRow>

      <VCardText>
        <VForm @submit.prevent="handleSubmit">
          <VRow>
            <VCol cols="12">
              <VTextField
                v-model="formData.name"
                label="Name"
                placeholder="Enter name"
                density="compact"
              />
            </VCol>
            <VCol cols="12">
              <VTextField
                v-model="formData.phone"
                label="Phone"
                placeholder="Enter phone number"
                density="compact"
              />
            </VCol>

            <VCol cols="12">
              <VTextField
                v-model="formData.password"
                label="Password"
                placeholder="Enter new password (optional)"
                type="password"
                density="compact"
              />
            </VCol>

            <VCol cols="12">
              <VSelect
                v-model="formData.role_id"
                :items="roles"
                item-title="name"
                item-value="id"
                label="Role"
                density="compact"
              />
            </VCol>

            <VCol cols="12">
              <VSwitch
                v-model="formData.status"
                label="Active Status"
                color="success"
                true-value
                :false-value="false"
              />
            </VCol>

            <VCol
              cols="12"
              class="d-flex gap-4 justify-end"
            >
              <VBtn
                color="error"
                variant="tonal"
                @click="userUpdateModal = false"
              >
                Cancel
              </VBtn>
              <VBtn
                color="primary"
                type="submit"
              >
                Update User
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style scoped>
.user-table {
  font-size: 0.85rem;
}
</style>
