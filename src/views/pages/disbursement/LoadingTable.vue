<script setup lang="ts">
import { VDataTableServer } from 'vuetify/labs/VDataTable'

defineProps({ type: String })
</script>

<template>
  <VCard
    :title="type"
    loading
  >
    <VDataTableServer
      :items-length="0"
      item-key="name"
      loading-text="Loading... Please wait"
      loading
    />
  </VCard>
</template>
