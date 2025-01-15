<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import VerticalNavSectionTitle from '@/@layouts/components/VerticalNavSectionTitle.vue'
import { isAccountant, isAdmin, isCoordinator, isHeadOfFinance } from '@/middlewares/auth'
import { useUserStore } from '@/stores/user'
import VerticalNavLayout from '@layouts/components/VerticalNavLayout.vue'
import VerticalNavLink from '@layouts/components/VerticalNavLink.vue'

// Components
// import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'
import UserProfile from '@/layouts/components/UserProfile.vue'

const route = useRoute()
const router = useRouter()
const currentRouteTitle = ref('Search') // Default to 'Search'
const Admin = ref(isAdmin())
const Accountant = ref(isAccountant())
const Finance = ref(isHeadOfFinance())
const coordinator = ref(isCoordinator())

// Define the navigation links with their corresponding routes and titles
const navLinks = [
  { title: 'Dashboard', to: '/dashboard' },
  { title: 'Enrollment', to: '/enrollment' },
  { title: 'Attendance', to: '/attendance' },
  { title: 'Financial Incentives', to: '/financial-incentives' },
  { title: 'Report', to: '/report' },
  { title: 'User Management', to: '/user-management' },
]

// Watch for route changes and update the title

watch(() => route.path, newPath => {
  const matchedLink = navLinks.find(link => link.to === newPath)

  currentRouteTitle.value = matchedLink ? matchedLink.title : 'Search'
}, { immediate: true })

const user = useUserStore().getUser()

function logout() {
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<template>
  <VerticalNavLayout>
    <!-- 👉 navbar -->
    <template #navbar="{ toggleVerticalOverlayNavActive }">
      <div class="d-flex h-100 align-center">
        <!-- 👉 Vertical nav toggle in overlay mode -->
        <IconBtn
          class="ms-n3 d-lg-none"
          @click="toggleVerticalOverlayNavActive(true)"
        >
          <VIcon icon="bx-menu" />
        </IconBtn>

        <!-- 👉 Search -->
        <div
          class="d-flex align-center cursor-pointer"
          style="user-select: none;"
        >
          <span class="d-none d-md-flex align-center text-disabled">
            <span class="me-3 text-body-1 font-weight-bold">{{ currentRouteTitle }}</span>
            <!-- <span class="meta-key">&#8984;K</span> -->
          </span>
        </div>

        <VSpacer />

        <UserProfile />
        <div class="me-2 mx-3">
          <VCardTitle class="text-body-1 pa-0">
            {{ user.name }}
          </VCardTitle>
          <VCardSubtitle class="text-caption pa-0">
            {{ user.email }}
          </VCardSubtitle>
        </div>
      </div>
    </template>

    <template #vertical-nav-content>
      <VerticalNavSectionTitle
        :item="{
          heading: 'Menu',
        }"
      />
      <VerticalNavLink
        :item="{
          title: 'Dashboard',
          icon: 'bx-home',
          to: '/dashboard',
        }"
      />
      <VerticalNavLink
        :item="{
          title: 'Enrollment',
          icon: 'bx-download',
          to: '/enrollment',
        }"
      />
      <VerticalNavLink
        :item="{
          title: 'Attendance',
          icon: 'bx-check-circle',
          to: '/attendance',
        }"
      />
      <VerticalNavLink
        v-if="Admin"
        :item="{
          title: 'Financial Incentives',
          icon: 'bxs-bank',
          to: '/financial-incentive',
        }"
      />
      <VerticalNavLink
        v-if="Accountant || Finance"
        :item="{
          title: 'Financial Incentives',
          icon: 'bxs-bank',
          to: '/financial-incentive-accountant',
        }"
      />
      <VerticalNavLink
        v-if="coordinator"
        :item="{
          title: 'Financial Incentives',
          icon: 'bxs-bank',
          to: '/financial-incentive-coordinator',
        }"
      />
      <VerticalNavLink
        :item="{
          title: 'report',
          icon: 'bx-receipt',
          to: '/',
        }"
      />
      <VerticalNavLink
        v-if="Admin"
        :item="{
          title: 'User Management',
          icon: 'bx-user',
          to: '/register',
        }"
      />
      <VerticalNavLink
        v-if="coordinator"
        :item="{
          title: 'Settings',
          icon: 'bx-cog',
          to: '/account-settings',
        }"
      />
      <VerticalNavLink
        v-if="Admin"
        :item="{
          title: 'Settings',
          icon: 'bx-cog',
          to: '/account-settings-admin',
        }"
      />
      <!--
        👉 Pages
        <VerticalNavSectionTitle
        :item="{
        heading: 'Pages',
        }"
        />
        <VerticalNavLink
        :item="{
        title: 'Account Settings',
        icon: 'mdi-account-cog-outline',
        to: '/account-settings',
        }"
        />
        <VerticalNavLink
        :item="{
        title: 'Login',
        icon: 'bx-log-in',
        to: '/login',
        }"
        />
        <VerticalNavLink
        :item="{
        title: 'Register',
        icon: 'bx-user-plus',
        to: '/register',
        }"
        />
        <VerticalNavLink
        :item="{
        title: 'Error',
        icon: 'bx-info-circle',
        to: '/no-existence',
        }"
        />
      -->
      <!-- 👉 User Interface -->
      <!--
        <VerticalNavSectionTitle
        :item="{
        heading: 'User Interface',
        }"
        />
        <VerticalNavLink
        :item="{
        title: 'Typography',
        icon: 'mdi-alpha-t-box-outline',
        to: '/typography',
        }"
        />
        <VerticalNavLink
        :item="{
        title: 'Icons',
        icon: 'bx-show',
        to: '/icons',
        }"
        />
        <VerticalNavLink
        :item="{
        title: 'Cards',
        icon: 'bx-credit-card',
        to: '/cards',
        }"
        />
        <VerticalNavLink
        :item="{
        title: 'Tables',
        icon: 'bx-table',
        to: '/tables',
        }"
        />
        <VerticalNavLink
        :item="{
        title: 'Form Layouts',
        icon: 'mdi-form-select',
        to: '/form-layouts',
        }"
        />
      -->
    </template>
    <template #after-vertical-nav-items>
      <VBtn
        style="margin-bottom: 27px;"
        prepend-icon="bx-exit"
        text="Exit"
        size="small"
        variant="outlined"
        color="error"
        @click="logout"
      />
    </template>

    <!-- 👉 Pages -->
    <slot />

    <!-- 👉 Footer -->
  </VerticalNavLayout>
</template>

<style lang="scss" scoped>
.meta-key {
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  block-size: 1.5625rem;
  line-height: 1.3125rem;
  padding-block: 0.125rem;
  padding-inline: 0.25rem;
}
</style>
