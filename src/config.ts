/* eslint-disable @typescript-eslint/indent */
const environment = import.meta.env.VITE_APP_ENV
let baseURL = ''

switch (environment) {
case 'production':
  baseURL = import.meta.env.VITE_PRODUCTION_API_BASE_URL
  break
case 'staging':
  baseURL = import.meta.env.VITE_STAGING_API_BASE_URL
  break
default:
  baseURL = import.meta.env.VITE_LOCAL_API_BASE_URL
  break
}

export default {
  baseURL,
  recaptchaSiteKey: import.meta.env.RECAPTCHA_SITE_KEY,
  recaptchaSecretKey: import.meta.env.RECAPTCHA_SECRET_KEY,
}
