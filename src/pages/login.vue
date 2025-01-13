<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core'
import { email, helpers, minLength, required } from '@vuelidate/validators'
import config from '@/config'
import { isAccountant, isCoordinator } from '@/middlewares/auth'
import router from '@/router'
import { useUserStore } from '@/stores/user'
import logo from '@images/logo.jpeg'

const baseURL: string = config.baseURL
const loading = ref(false)
const user = useUserStore()

const showAlert = ref(false)

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

interface LoginFormData {
  email: string
  password?: string
}

const form = reactive({
  email: '',
  password: '',
})

const loginFormRules = computed(() => {
  const min = 8

  // Conditional validation based on user type
  return {
    email: { required, email: helpers.withMessage('Email is invalid', email) },
    password: {
      required,
      minLength: helpers.withMessage(
        `Password should be at least ${min} characters long`,
        minLength(min),
      ),
    },
  }
})

const v$ = useVuelidate(loginFormRules, form)

const errors = ref<{
  status: string
  message: string
  data: []
} | undefined>()

async function submit(data: LoginFormData) {
  loading.value = true

  try {
    // Validate input
    const isValid = await v$.value.$validate()
    if (!isValid) {
      loading.value = false

      return
    }

    // Send login request
    const response = await fetch(`${baseURL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const responseData = await response.json()

    if (response.ok) {
      // Login successful
      const { data: profileData } = responseData

      user.setUser(profileData)
      localStorage.setItem('user', JSON.stringify(profileData))
      if (isAccountant())
        router.push('/dashboard')

      else if (isCoordinator())
        router.push('/dashboard')

      else
        router.push('/enrollment')
    }
    else {
      // Handle error response
      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = responseData.message || 'Something went wrong, please try again later'
      alertInfo.type = 'error'
    }
  }
  catch (error) {
    // Handle unexpected errors
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'An unexpected error occurred. Please try again later.'
    alertInfo.type = 'error'
  }
  finally {
    // Reset loading state
    loading.value = false
  }
}

const emailErrorMessage = computed(() => v$.value.email.$errors[0]?.$message as string)
const passwordErrorMessage = computed(() => v$.value.password.$errors[0]?.$message as string)

const isPasswordVisible = ref(false)

watch(errors, newErrors => {
  if (newErrors) {
    showAlert.value = true
    setTimeout(() => {
      showAlert.value = false
      errors.value = undefined // Clear the errors
    }, 4000) // 4000 milliseconds = 4 seconds
  }
})

onMounted(() => {
  const tokenCheckInterval = setInterval(() => {
    if (user.isTokenExpired()) {
      user.removeUser()
      clearInterval(tokenCheckInterval)
    }
  }, 5 * 60 * 1000) // Check every 5 minutes

  onUnmounted(() => {
    clearInterval(tokenCheckInterval)
  })
})
</script>

<template>
  <VSnackbar
    v-model="alertInfo.show"
    :color="alertInfo.type"
    :timeout="4000"
    elevation="4"
  >
    <p>{{ alertInfo.message }}</p>
    <template #actions>
      <VBtn
        icon="bx-x"
        variant="text"
        @click="alertInfo.show = false"
      />
    </template>
  </VSnackbar>
  <div class="auth-wrapper d-flex align-center justify-center pa-4">
    <VCard
      class="auth-card pa-2 pt-7"
      max-width="448"
    >
      <VCardItem class="justify-center pb-1.5">
        <VImg
          :src="logo"
          max-width="145"
          class="mx-auto my-2 mb-0"
        />
      </VCardItem>

      <VCardText class="pt-0">
        <h5 class="text-h4 mb-3 text-center font-weight-semibold text-heading">
          Login
        </h5>
        <p class="mb-8 text-center text-subtitle-1 text-subheading font-weight-medium">
          Welcome. Login to get started
        </p>
      </VCardText>

      <VCardText>
        <div class="text-emphasis font-weight-semibold pb-1 text-heading">
          Your email address
        </div>
        <VForm @submit.prevent="submit(form)">
          <VRow>
            <!-- email -->
            <VCol cols="12">
              <VTextField
                v-model="form.email"
                autofocus
                placeholder="johndoe@email.com"
                type="email"
                density="compact"
                class="mb-0"
                color="primary"
                clearable
                :error-messages="emailErrorMessage"
              />
            </VCol>

            <!-- password -->
            <VCol cols="12">
              <div class="text-emphasis font-weight-semibold pb-1 text-heading">
                Your password
              </div>
              <VTextField
                v-model="form.password"
                placeholder="****"
                class="mb-8"
                color="primary"
                density="compact"
                :type="isPasswordVisible ? 'text' : 'password'"
                clearable
                :append-inner-icon="isPasswordVisible ? 'bx-hide' : 'bx-show'"
                :error-messages="passwordErrorMessage"
                @click:append-inner="isPasswordVisible = !isPasswordVisible"
              />

              <!-- login button -->
              <VBtn
                block
                size="large"
                type="submit"
                :loading="loading"
                class="text-subtitle-1 font-weight-medium"
                color="primary"
              >
                Login
              </VBtn>
            </VCol>

            <!-- create account -->
            <VCol
              cols="12"
              class="text-center text-base font-weight-medium"
              style="font-weight: 500;"
            >
              <span class="text-grey-5">By clicking continue, you agree to our </span>
              <RouterLink
                class="text-primary ms-0"
                to="#"
              >
                Terms of Service
              </RouterLink>
              <span class="text-grey-5"> and</span>
              <RouterLink
                class="text-primary ms-0"
                to="#"
              >
                Privacy Policy
              </RouterLink>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </div>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth.scss";
</style>
