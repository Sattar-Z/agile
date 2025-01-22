<script setup lang="ts">
import { isAccountant, isAdmin, isCoordinator, isHeadOfFinance } from '@/middlewares/auth'
import { useUserStore } from '@/stores/user'
import Girl from '@images/cards/muslim_girl.png'

const Admin = ref(isAdmin())
const Accountant = ref(isAccountant())
const Finance = ref(isHeadOfFinance())
const coordinator = ref(isCoordinator())
const user = useUserStore().getUser()
</script>

<template>
  <VCard class="text-center text-sm-start">
    <VRow no-gutters>
      <VCol
        cols="12"
        sm="8"
        order="2"
        order-sm="1"
      >
        <VCardItem>
          <VCardTitle class="text-md-h5 text-primary">
            Welcome {{ user.role.name }}
          </VCardTitle>
        </VCardItem>

        <VCardText>
          <span>
            Summaries and activities across all LGAs
          </span>
          <br>
          <VBtn
            v-if="Accountant || Finance"
            to="/disbursement-accountant"
            variant="tonal"
            class="mt-4"
            size="small"
            text="Payment requests"
          />
          <VBtn
            v-else-if="coordinator"
            to="/disbursement-coordinator"
            variant="tonal"
            class="mt-4"
            size="small"
            text="Finalize Payments"
          />
          <VBtn
            v-else-if="Admin"
            to="/disbursement"
            variant="tonal"
            class="mt-4"
            size="small"
            text="Initiate Payments"
          />
          <VBtn
            v-else
            to="/enrollment"
            variant="tonal"
            class="mt-4"
            size="small"
            text="View Students"
          />
        </VCardText>
      </VCol>

      <VCol
        hidden
        cols="12"
        sm="4"
        order="1"
        order-sm="2"
        class="text-center"
      >
        <img
          :src="Girl"
          :height="$vuetify.display.xs ? '150' : '175'"
          :class="$vuetify.display.xs ? 'mt-6 mb-n2' : 'position-absolute'"
          class="john-illustration flip-in-rtl"
        >
      </VCol>
    </VRow>
  </VCard>
</template>

<style lang="scss" scoped>
.john-illustration {
  inset-block-end: -0.0625rem;
  inset-inline-end: 3rem;
}
</style>
