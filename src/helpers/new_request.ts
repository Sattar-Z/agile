import config from '@/config'
import router from '@/router'
import { useAlertStore } from '@/stores/alert'

import { useUserStore } from '@/stores/user'

const baseURL: string = config.baseURL

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
}

/**

A function to make an API call using the fetch method.
@param url - The URL to fetch data from.
@param method - The HTTP method to use for the request.
@param headers - The headers to include in the request.
@param authorized - A boolean indicating whether or not the request requires authorization. The default is `false`
@param data - The data to include in the request body.
@param showAlert - A boolean indicating whether or not to show an alert in case of an error response. Default is `true`
@param isModal - A boolean indicating whether to display the alert on a modal. Default is `false`
@param appendBaseURL - A boolean indicating whether to append the baseURL to the url. Default is `true`
@returns The response from the API call.
*/
async function callApi({
  url,
  method,
  headers = defaultHeaders,
  authorized = false,
  data,
  showAlert = true,
  isModal = false,
  appendBaseURL = true,
}: {
  url: string
  method: Method
  headers?: any
  authorized?: boolean
  data?: any
  showAlert?: boolean
  isModal?: boolean
  appendBaseURL?: boolean
}) {
  const userStore = useUserStore()
  const user = userStore.getUser()
  const { token } = user.value

  if (authorized && !token)
    router.push('/login')

  const alertStore = useAlertStore()
  const fullUrl = appendBaseURL ? `${baseURL}/${url}` : url

  try {
    const response = await fetch(fullUrl, {
      method,
      headers: {
        ...headers,
        ...(authorized ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: data ? JSON.stringify(data) : null,
    })

    const responseData = await response.json() // Read JSON once here

    if (showAlert && !response.ok) {
      alertStore.setAlert({
        message:
          typeof responseData.message === 'string'
            ? responseData.message
            : 'An error occurred. Please try again later.',
        type: 'error',
        isModal,
      })
    }

    return { ok: response.ok, data: responseData, status: response.status }
  }
  catch (error) {
    console.error('API call error:', error)
    if (showAlert) {
      alertStore.setAlert({
        message: 'Network error. Please try again.',
        type: 'error',
        isModal,
      })
    }

    return { ok: false, data: null, status: 500 }
  }
}

export { callApi }
