import { ref } from "vue";
import { defineStore } from "pinia";

type AlertType = "success" | "error" | "warning" | "info";

interface Alert {
  message: string;
  type: AlertType;
  timeout?: number;
  show?: boolean;
  isModal?: boolean;
}

const useAlertStore = defineStore("alert", () => {
  const alert = ref<Alert>({
    message: "",
    type: "success",
    timeout: 5000,
    show: false,
    isModal: false,
  });

  const setAlert = ({
    message,
    type,
    timeout = 5000,
    show = true,
    isModal = false,
  }: Alert) => (alert.value = { message, type, timeout, show, isModal });

  const clearAlert = () =>
    (alert.value = {
      message: "",
      type: "success",
      timeout: 5000,
      show: false,
      isModal: false,
    });

  const getAlert = () => alert.value;

  return { setAlert, getAlert, clearAlert };
});

export { useAlertStore };
export type { AlertType };
