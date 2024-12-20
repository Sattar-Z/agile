<script setup lang="ts">
import { ref } from 'vue'
import { VDataTableServer } from 'vuetify/labs/VDataTable'

interface FileContentsDialogProps {
  modelValue: boolean
  fileName: string
  fileContents: any[]
  fileContentHeaders: any[]
}

const props = defineProps<FileContentsDialogProps>()
const emit = defineEmits(['update:modelValue'])

const fileContentSearch = ref('')
const fileContentItemsPerPage = ref(10)
const fileContentCurrentItems = ref<any[]>([])
const totalFileContentItems = ref(0)

const filterFileContentItems = (items: any[], searchValue: string): any[] => {
  if (!searchValue)
    return items

  return items.filter(item =>
    Object.values(item).some(value =>
      String(value).toLowerCase().includes(searchValue.toLowerCase()),
    ),
  )
}

const sortFileContentItems = (items: any[], sortBy: { key: string; order: string }[]): any[] => {
  if (sortBy.length === 0)
    return items

  const [sortItem] = sortBy

  return [...items].sort((a, b) => {
    const aValue = a[sortItem.key]
    const bValue = b[sortItem.key]

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortItem.order === 'desc'
        ? bValue.localeCompare(aValue)
        : aValue.localeCompare(bValue)
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortItem.order === 'desc'
        ? bValue - aValue
        : aValue - bValue
    }

    return 0
  })
}

const loadFileContentItems = ({ page, itemsPerPage, sortBy }: any) => {
  const filteredItems = filterFileContentItems(props.fileContents, fileContentSearch.value)
  const sortedItems = sortFileContentItems(filteredItems, sortBy)

  const start = (page - 1) * itemsPerPage
  const end = start + itemsPerPage

  fileContentCurrentItems.value = sortedItems.slice(start, end)
  totalFileContentItems.value = filteredItems.length

  return {
    items: fileContentCurrentItems.value,
    total: totalFileContentItems.value,
  }
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    fullscreen
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard>
      <VToolbar
        dark
        color="secondary"
      >
        <VBtn
          icon="bx-x"
          color="error"
          @click="emit('update:modelValue', false)"
        />
        <VToolbarTitle>File Contents: {{ fileName }}</VToolbarTitle>
      </VToolbar>

      <VCardText>
        <VRow
          align="center"
          justify="space-between"
          class="mb-4"
        >
          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="fileContentSearch"
              prepend-inner-icon="bx-search"
              label="Search"
              density="compact"
              hide-details
            />
          </VCol>
        </VRow>

        <VDataTableServer
          v-model:items-per-page="fileContentItemsPerPage"
          :headers="fileContentHeaders"
          :items="fileContentCurrentItems"
          :items-length="totalFileContentItems"
          :search="fileContentSearch"
          density="compact"
          @update:options="loadFileContentItems"
        />
      </VCardText>
    </VCard>
  </VDialog>
</template>
