import { defineStore } from "pinia";
import { ref } from "vue";

export const useSidebarStore = defineStore("sidebar", () => {
  const open = ref(true);

  function toggle() {
    open.value = !open.value;
  }

  return { open, toggle };
});
