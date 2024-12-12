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

  // const token = '1098|Hs5Jk1bhTDqKhRRSB4NIVe1sF3yJwu3zlRH9uAir'

  // const token = '1042|AjvAHQFSS2FRYkVggE3qVS75F67ByMpowBdgg8Z7'

  // const token = '1110|Q7gkGV3efKZTOnXrGxSXJZ2iwguZ1fGNnvKOz9VL'

  // const token = '2940|iPu1A8m7EJD73XM0ivSbcDt2YR2eRsztHuveFQUR'
  // const token = '1064|gCOdmlV6jtkPHv39dTcSexKzMOKIlAxusojo92p3'

  //   const token = authorized
  //     ? Number(livemode) === 1
  //       ? api_token
  //       : api_test_token
  //     : null;

  if (authorized && !token)
    router.push('/login')

  const alertStore = useAlertStore()

  const fullUrl = appendBaseURL ? `${baseURL}/${url}` : url

  const response = await fetch(fullUrl, {
    method,
    headers: {
      ...headers,
      ...(authorized ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: data ? JSON.stringify(data) : null,
  })

  if (showAlert && !response.ok) {
    const { message } = await response.json()

    alertStore.setAlert({
      message:
        typeof message === 'string'
          ? message
          : 'An error occurred. Please try again later.',
      type: 'error',
      isModal,
    })
  }

  return response
}

export { callApi }
