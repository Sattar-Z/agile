import {
  type NavigationGuardNext,
  type RouteLocationNormalized,
  createRouter,
  createWebHistory,
} from 'vue-router'
import { removeUser } from '@/helpers/auth'
import { isAdmin, isAuthenticated, isOfficer } from '@/middlewares/auth'

const adminOnly = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  if
  (isAdmin()) {
    next()
  }
  else {
    // Removing user because the login route will not be
    // accessible to the user if the user is still in the local storage
    removeUser()
    next({ name: 'login' })
  }
}

const merchantOnly = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  if (isOfficer()) {
    next()
  }
  else {
    // Removing user because the login route will not be
    // accessible to the user if the user is still in the local storage
    removeUser()
    next({ name: 'login' })
  }
}

const guest = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => (!isAuthenticated() ? next() : next({ name: from.name as string }))

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/dashboard' },
    {
      path: '/',
      component: () => import('../layouts/default.vue'),
      children: [
        {
          path: 'dashboard',
          component: () => import('../pages/dashboard.vue'),
        },
        {
          name: 'beneficiaries',
          path: 'beneficiaries',
          component: () => import('../pages/enrollment.vue'),
        },
        {
          name: 'disbursement',
          path: 'disbursement',
          component: () => import('../pages/disbursement.vue'),
        },
        {
          name: 'disbursement-pc',
          path: 'disbursement-pc',
          component: () => import('../pages/disbursement-pc.vue'),
        },
        {
          name: 'disbursement-accountant',
          path: 'disbursement-accountant',
          component: () => import('../pages/disbursement-accountant.vue'),
        },
        {
          name: 'disbursement-finance',
          path: 'disbursement-finance',
          component: () => import('../pages/disbursement-finance.vue'),
        },
        {
          name: 'attendance',
          path: 'attendance',
          component: () => import('../pages/attendance.vue'),
        },
        {
          name: 'schools',
          path: 'enrollment/schools/:id/:name',
          component: () => import('../pages/schools.vue'),
        },
        {
          name: 'attendance-schools',
          path: 'attendance/schools/:id/:name/:cohort/:term/:session',
          component: () => import('../pages/attendance-schools.vue'),
        },
        {
          name: 'students',
          path: 'enrollment/schools/students/:id/:name',
          component: () => import('../pages/students.vue'),
        },
        {
          name: 'attendance-students',
          path: 'attendance/schools/students/:id/:name/:cohort/:term/:session',
          component: () => import('../pages/attendance-students.vue'),
        },
        {
          name: 'register',
          path: 'register',
          component: () => import('../pages/register.vue'),
        },
        {
          name: 'report',
          path: 'report',
          component: () => import('../pages/report.vue'),
        },
        {
          name: 'user-management',
          path: 'user-management',
          component: () => import('../pages/user-management.vue'),
        },
        {
          name: 'account-settings-admin',
          path: 'account-settings-admin',
          component: () => import('../pages/account-settings-admin.vue'),
        },
        {
          path: 'account-settings',
          component: () => import('../pages/account-settings.vue'),
        },
        {
          path: 'typography',
          component: () => import('../pages/typography.vue'),
          beforeEnter: merchantOnly,
        },
        {
          path: 'icons',
          component: () => import('../pages/icons.vue'),
        },
        {
          path: 'cards',
          component: () => import('../pages/cards.vue'),
        },
        {
          path: 'tables',
          component: () => import('../pages/tables.vue'),
        },
        {
          path: 'form-layouts',
          component: () => import('../pages/form-layouts.vue'),
        },
      ],
    },
    {
      path: '/',
      component: () => import('../layouts/blank.vue'),
      children: [
        {
          name: 'login',
          path: 'login',
          component: () => import('../pages/login.vue'),
        },
        {
          path: '/:pathMatch(.*)*',
          component: () => import('../pages/[...all].vue'),
          beforeEnter: guest,
        },
      ],
    },
  ],
})

const unGuardedRoutes = ['login', 'otp', 'delete-account']

router.beforeEach((to, from, next) => {
  // If the route is guarded and not authenticated, redirect to login
  if (!unGuardedRoutes.includes(to.name as string) && !isAuthenticated())
    next({ name: 'login' })
  else if (unGuardedRoutes.includes(to.name as string) && isAuthenticated())
    next({ name: 'beneficiaries' })
  else next()
})

export default router
