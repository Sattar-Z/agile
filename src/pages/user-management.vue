<script setup lang="ts">
import Register from './register.vue'
import UserTable from '@/views/user-management/UserTable.vue'

const newUser = ref(false)
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VBtn
        text="New User"
        @click="newUser = true"
      />
    </VCol>

    <VDialog
      v-model="newUser"
      width="600"
    >
      <VRow justify="end">
        <VCol cols="auto">
          <VBtn
            icon="bx-x"
            @click="newUser = false"
          />
        </VCol>
      </VRow>
      <Register />
    </VDialog>
    <VCol cols="12">
      <UserTable />
    </VCol>
  </VRow>
</template>
