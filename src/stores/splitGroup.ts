import { ref, computed, type Ref } from "vue";
import { defineStore } from "pinia";

export interface SplitGroup {
  showModal: boolean;
}
export const useSplitGroupStore = defineStore("splitGroup", () => {
  const splitGroup = ref<SplitGroup>({
    showModal: false,
  });

  function getSplitGroup(): Ref<SplitGroup> {
    return splitGroup;
  }

  function setSplitGroup(splitGroupData: SplitGroup) {
    splitGroup.value = splitGroupData;
  }

  return { getSplitGroup, setSplitGroup };
});
