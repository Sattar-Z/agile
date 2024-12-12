import { computed, ref, type Ref } from "vue";
import { defineStore } from "pinia";
import router from "@/router";
import { callApi } from "@/helpers/request";

export interface User {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  sso_id: number;
  api_token: string;
  api_test_token: string;
  mac: string;
  user_role: number;
  use_flutterwave: 1 | 0;
  use_paystack: 1 | 0;
  use_webpay: 1 | 0;
  use_paydirect: 1 | 0;
  use_nibss: 1 | 0;
  use_remita: 1 | 0;
  use_bank_module: 1 | 0;
  notify_me: boolean;
  notify_customer: boolean;
  enable_2fa: boolean;
  remita_merchantId: string | null;
  remita_api_key: string | null;
  remita_inline_key: string | null;
  remita_fee: string | number | null;
  paystack_secret_key: string | null;
  paystack_secret_test_key: string | null;
  flutterwave_secret_key: string | null;
  flutterwave_secret_test_key: string | null;
  nibssAccountID: string | number | null;
  college_fee: string | number | null;
  collegepay_payitem_id: string | number | null;
  collegepay_product_id: string | number | null;
  settlement_type: string | null;
  paydirect_percentage_fee: string | number;
  paydirect_fee: string | number | null;
  paydirect_group: string | null;
  cac_file_path?: string;
  authorization_file_path?: string;
  livemode?: number;
  token: string;
}

export const useSearchStore = defineStore("search", () => {
  const search = ref({});
  const searchParameter = ref("");

  function getSearchInfo(): Record<string, any> {
    return search.value;
  }

  function setSearchInfo(searchData: Record<string, any>) {
    search.value = searchData;
  }

  function setSearchParameter(param: string) {
    searchParameter.value = param;
  }

  return {
    setSearchInfo,
    getSearchInfo,
    setSearchParameter,
    searchParameter,
  };
});
