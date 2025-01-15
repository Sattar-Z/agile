<script setup lang="ts">
import { useTheme } from 'vuetify'
import { isAccountant, isAdmin, isCoordinator } from '@/middlewares/auth'
import { useUserStore } from '@/stores/user'
import illustrationJohnDark from '@images/cards/illustration-john-dark.png'
import illustrationJohnLight from '@images/cards/illustration-john-light.png'

const Admin = ref(isAdmin())
const Accountant = ref(isAccountant())
const coordinator = ref(isCoordinator())
const { global } = useTheme()
const user = useUserStore().getUser()
const illustrationJohn = computed(() => global.name.value === 'dark' ? illustrationJohnDark : illustrationJohnLight)
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
            Welcome {{ user.name }}
          </VCardTitle>
        </VCardItem>

        <VCardText>
          <span>
            Summaries and activities across all LGAs
          </span>
          <br>
          <VBtn
            v-if="Accountant"
            to="/financial-incentive-accountant"
            variant="tonal"
            class="mt-4"
            size="small"
            text="Payment requests"
          />
          <VBtn
            v-else-if="coordinator"
            to="/financial-incentive-coordinator"
            variant="tonal"
            class="mt-4"
            size="small"
            text="Finalize Payments"
          />
          <VBtn
            v-else-if="Admin"
            to="/financial-incentive"
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
        cols="12"
        sm="4"
        order="1"
        order-sm="2"
        class="text-center"
      >
        <img
          :src="illustrationJohn"
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
