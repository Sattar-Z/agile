<script lang="ts" setup>
import { useRoute } from 'vue-router'

import AccountSettingsAccount from '@/views/pages/account-settings/AccountSettingsAccount.vue'

// import AccountSettingsNotification from '@/views/pages/account-settings/AccountSettingsNotification.vue'
// import AccountSettingsSecurity from '@/views/pages/account-settings/AccountSettingsSecurity.vue'

const route = useRoute()

const activeTab = ref(route.params.tab)

// tabs
const tabs = [
  { title: 'Term Updates', icon: 'bxs-graduation', tab: 'account' },

  // { title: 'Security', icon: 'bx-lock-open', tab: 'security' },
  // { title: 'Disbursements', icon: 'bxs-bank', tab: 'Disbursements' },
]
</script>

<template>
  <div>
    <VTabs
      v-model="activeTab"
      show-arrows
    >
      <VTab
        v-for="item in tabs"
        :key="item.icon"
        :value="item.tab"
      >
        <VIcon
          size="20"
          start
          :icon="item.icon"
        />
        {{ item.title }}
      </VTab>
    </VTabs>
    <VDivider />

    <VWindow
      v-model="activeTab"
      class="mt-5 disable-tab-transition"
    >
      <!-- Account -->
      <VWindowItem value="account">
        <AccountSettingsAccount />
      </VWindowItem>
    </VWindow>
  </div>
</template>
