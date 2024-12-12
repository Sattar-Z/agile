import { ref, type Ref } from "vue";
import { defineStore } from "pinia";
import { callApi } from "@/helpers/request";

export interface Merchant {
  id: number;
  name: string;
  created_at: string;
  authorization_file_path: string;
  cac_file_path: string;
  Last_2_faCode: string;
  compliance: object;
}
export type MerchantList = Merchant[];

export const useMerchantStore = defineStore("merchant", () => {
  //State
  const merchant = ref<Merchant>({
    id: 0,
    name: "",
    created_at: "",
    authorization_file_path: "",
    cac_file_path: "",
    Last_2_faCode: "",
    compliance: {},
  });

  const merchants = ref<MerchantList>([]);

  const filter = ref("");

  // Getters
  function getMerchant(): Ref<Merchant> {
    return merchant;
  }

  function getMerchants(): Ref<MerchantList> {
    return merchants;
  }

  function getFilter() {
    return filter;
  }

  //Actions
  async function fetchMerchantList() {
    const response = await callApi({
      url: `merchants?filter=${filter.value}`,
      method: "GET",
      authorized: true,
    });

    const data = await response.json();

    setMerchants(data.data);
  }

  //Mutations
  function setMerchant(merchantData: Merchant) {
    merchant.value = merchantData;
  }

  function setFilter(filterData: string) {
    filter.value = filterData;
  }

  function setMerchants(merchantsData: MerchantList) {
    merchants.value = merchantsData;
  }

  return {
    getMerchant,
    setMerchant,
    fetchMerchantList,
    getMerchants,
    setMerchants,
    setFilter,
    getFilter,
  };
});
