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
          name: 'enrollment',
          path: 'enrollment',
          component: () => import('../pages/enrollment.vue'),
        },
        {
          name: 'financial-incentive',
          path: 'financial-incentive',
          component: () => import('../pages/financial-incentive.vue'),
        },
        {
          name: 'financial-incentive-accountant',
          path: 'financial-incentive-accountant',
          component: () => import('../pages/financial-incentive-accountant.vue'),
        },
        {
          name: 'financial-incentive-coordinator',
          path: 'financial-incentive-coordinator',
          component: () => import('../pages/financial-incentive-coordinator.vue'),
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
          path: 'attendance/schools/:id/:name',
          component: () => import('../pages/attendance-schools.vue'),
        },
        {
          name: 'students',
          path: 'enrollment/schools/students/:id/:name',
          component: () => import('../pages/students.vue'),
        },
        {
          name: 'attendance-students',
          path: 'attendance/schools/students/:id/:name',
          component: () => import('../pages/attendance-students.vue'),
        },
        {
          path: 'register',
          component: () => import('../pages/register.vue'),
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
    next({ name: 'enrollment' })
  else next()
})

export default router
