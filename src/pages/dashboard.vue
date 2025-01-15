<script setup lang="ts">
import AnalyticsCongratulations from '@/views/dashboard/AnalyticsCongratulations.vue'
import AnalyticsTotalRevenue from '@/views/dashboard/AnalyticsTotalRevenue.vue'
</script>

<template>
  <VRow>
    <!-- 👉 Congratulations -->
    <VCol cols="12">
      <AnalyticsCongratulations />
    </VCol>
    <VCol
      cols="12"
      md="4"
    >
      <VCard
        variant="tonal"
        color="info"
      >
        <VCardItem>
          <div class="d-flex">
            <VIcon
              class="my-auto mx-1"
              icon="bxs-graduation"
            />
            <VCardTitle class="my-auto">
              Total Beneficiaries Enrolled
            </VCardTitle>
          </div>
        </VCardItem>
        <VCardText class="my-auto text-h5">
          ...
        </VCardText>
      </VCard>
    </VCol>
    <VCol
      cols="12"
      md="4"
    >
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
          ... %
        </VCardText>
      </VCard>
    </VCol>
    <VCol
      cols="12"
      md="4"
    >
      <VCard
        variant="tonal"
        color="info"
      >
        <VCardItem>
          <div class="d-flex">
            <VIcon
              class="my-auto mx-1"
              icon="bx-money"
            />
            <VCardTitle class="my-auto">
              Total Disbursed
            </VCardTitle>
          </div>
        </VCardItem>
        <VCardText class="my-auto text-h5">
          ₦0.00
        </VCardText>
      </VCard>
    </VCol>

    <!-- 👉 Total Revenue -->
    <VCol
      cols="12"
      order="2"
      order-md="1"
    >
      <AnalyticsTotalRevenue />
    </VCol>
  </VRow>
</template>
