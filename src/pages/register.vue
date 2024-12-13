<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core'
import { email, helpers, minLength, required, sameAs } from '@vuelidate/validators'
import config from '@/config'
import { useUserStore } from '@/stores/user'
import router from '@/router'

// import { useUserStore } from '@/stores/user'
import logo from '@images/logo.jpeg'

const baseURL: string = config.baseURL
const user = useUserStore()
const loading = ref(false)

// const user = useUserStore()

const token = ref('')

token.value = user.getUserInfo().token

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

interface LoginFormData {
  name: string
  email: string
  phone: string
  password: string
  password_confirmation: string
  role_id: string
}

const form = reactive<LoginFormData>({
  name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
  role_id: '2',
})

const loginFormRules = computed(() => {
  const min = 8

  return {
    name: { required },
    email: {
      required,
      email: helpers.withMessage('Email is invalid', email),
    },
    phone: { required },
    role_id: { required },
    password: {
      required,
      minLength: helpers.withMessage(
        `Password should be at least ${min} characters long`,
        minLength(min),
      ),
      passwordPattern: helpers.withMessage(
        `Password should contain at least 1 uppercase character, 
        1 lowercase character, 1 number, 1 special character and be at least 8 characters long`,
        helpers.regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/),
      ),
    },
    password_confirmation: {
      required,
      sameAsPassword: sameAs(form.password),
    },
  }
})

const v$ = useVuelidate(loginFormRules, form)

// const errors = ref<{
//   status: string
//   message: string
//   data: []
// } | undefined>()

async function submit() {
  const isFormValid = await v$.value.$validate()

  if (!isFormValid)
    return

  loading.value = true

  try {
    const response = await fetch(`${baseURL}/user/onboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    })

    const responseData = await response.json()

    if (!response.ok) {
      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = responseData.message || 'Registration failed'
      alertInfo.type = 'error'
      loading.value = false

      return
    }

    // Successful registration
    alertInfo.show = true
    alertInfo.title = 'Success'
    alertInfo.message = 'Registration successful!'
    alertInfo.type = 'success'

    // Optional: Redirect after a short delay
    setTimeout(() => {
      router.push('/')
    }, 2000)
  }
  catch (error) {
    console.error('Registration error:', error)
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'An unexpected error occurred'
    alertInfo.type = 'error'
  }
  finally {
    loading.value = false
  }
}

const emailErrorMessage = computed(() => v$.value.email.$errors[0]?.$message as string)
const passwordErrorMessage = computed(() => v$.value.password.$errors[0]?.$message as string)
const isConPasswordVisible = ref(false)
const isPasswordVisible = ref(false)
</script>

<template>
  <VSnackbar
    v-model="alertInfo.show"
    :color="alertInfo.type"
    elevation="74"
    :timeout="4000"
  >
    <p>{{ alertInfo.message }}</p>

    <template #actions>
      <VBtn
        color="white"
        icon="bx-x"
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
          Register
        </h5>
        <p class="mb-8 text-center text-subtitle-1 text-subheading font-weight-medium">
          Welcome. Register to get started
        </p>
      </VCardText>

      <VCardText>
        <VForm @submit.prevent="submit">
          <VRow>
            <!-- Name -->
            <VCol cols="12">
              <div class="text-emphasis font-weight-semibold pb-1 text-heading">
                Your name
              </div>
              <VTextField
                v-model="form.name"
                autofocus
                placeholder="John Doe"
                density="compact"
                class="mb-0"
                color="primary"
                clearable
                :error-messages="v$.name.$errors.map(e => e.$message)"
              />
            </VCol>

            <!-- Email -->
            <VCol cols="12">
              <div class="text-emphasis font-weight-semibold pb-1 text-heading">
                Your email address
              </div>
              <VTextField
                v-model="form.email"
                placeholder="johndoe@email.com"
                type="email"
                density="compact"
                class="mb-0"
                color="primary"
                clearable
                :error-messages="emailErrorMessage"
              />
            </VCol>

            <!-- Phone -->
            <VCol cols="12">
              <div class="text-emphasis font-weight-semibold pb-1 text-heading">
                Your Phone Number
              </div>
              <VTextField
                v-model="form.phone"
                type="tel"
                density="compact"
                class="mb-0"
                color="primary"
                clearable
                :error-messages="v$.phone.$errors.map(e => e.$message)"
              />
            </VCol>

            <!-- Password -->
            <VCol cols="12">
              <div class="text-emphasis font-weight-semibold pb-1 text-heading">
                Your password
              </div>
              <VTextField
                v-model="form.password"
                placeholder="********"
                class=""
                color="primary"
                density="compact"
                :type="isPasswordVisible ? 'text' : 'password'"
                clearable
                :append-inner-icon="isPasswordVisible ? 'bx-hide' : 'bx-show'"
                :error-messages="passwordErrorMessage"
                @click:append-inner="isPasswordVisible = !isPasswordVisible"
              />
            </VCol>

            <!-- Confirm Password -->
            <VCol cols="12">
              <div class="text-emphasis font-weight-semibold pb-1 text-heading">
                Confirm Your password
              </div>
              <VTextField
                v-model="form.password_confirmation"
                label="Confirm Password"
                placeholder="********"
                color="mon-green"
                :type="isConPasswordVisible ? 'text' : 'password'"
                :append-inner-icon="
                  isConPasswordVisible ? 'bx-hide' : 'bx-show'
                "
                :error-messages="v$.password_confirmation.$errors.map(e => e.$message)"
                @click:append-inner="
                  isConPasswordVisible = !isConPasswordVisible
                "
              />
            </VCol>

            <!-- Register button -->
            <VCol cols="12">
              <VBtn
                block
                size="large"
                type="submit"
                :loading="loading"
                class="text-subtitle-1 font-weight-medium"
                color="primary"
              >
                Register
              </VBtn>
            </VCol>

            <!-- Terms of Service -->
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
