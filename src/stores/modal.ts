import { ref, computed, type Ref } from "vue";
import { defineStore } from "pinia";

export interface Modal {
  showModal: boolean;
}
export const useModalStore = defineStore("modal", () => {
  const modal = ref<Modal>({
    showModal: false,
  });

  function getModal(): Ref<Modal> {
    return modal;
  }

  function setModal(modalData: Modal) {
    modal.value = modalData;
  }

  return { getModal, setModal };
});
