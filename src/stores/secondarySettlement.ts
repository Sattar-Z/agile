import moment from 'moment'
import { defineStore } from 'pinia'
import { type Ref, ref, watch } from 'vue'
import { callApi } from '../helpers/request'
import { useAlertStore } from './alert'

export const useSecondarySettlementStore = defineStore(
  'secondarySettlement',
  () => {
    const isLoaded = ref(false)
    const settlements = ref([])
    const statistics = ref({})
    const date = ref(moment().format('YYYY-MM-DD'))
    const alert = useAlertStore()
    const merchantId: Ref<null | string | number> = ref(null)
    const showMerchantSettlements = ref(false)

    const fetchSettlements = async () => {
      isLoaded.value = false
      try {
        const response = await callApi({
          url: `secondary-settlements/daily?date=${date.value}`,
          method: 'GET',
          authorized: true,
          showAlert: false,
        })

        const responseData = await response.json()

        if (!response.ok) {
          alert.setAlert({
            message: responseData.message,
            type: 'error',
          })

          return
        }

        settlements.value = responseData.data.settlements
        statistics.value = responseData.data.statistics

        isLoaded.value = true
      }
      catch (error) {
        alert.setAlert({
          message: 'Something went wrong please try again later',
          type: 'error',
        })
      }
      isLoaded.value = true
    }

    const setDate = (newDate: string) => {
      date.value = newDate
    }

    const setShowMerchantSettlements = (
      filterMerchantId: null | string | number = null,
      value = true,
    ) => {
      console.log('filterMerchantId', filterMerchantId)
      showMerchantSettlements.value = value
      merchantId.value = filterMerchantId
    }

    watch(date, () => {
      fetchSettlements()
    })

    return {
      setShowMerchantSettlements,
      showMerchantSettlements,
      setDate,
      isLoaded,
      settlements,
      statistics,
      date,
      fetchSettlements,
      merchantId,
    }
  },
)
