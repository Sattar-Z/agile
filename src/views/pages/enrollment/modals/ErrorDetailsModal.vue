<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  errorMessage: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const parsedErrors = ref<string[]>([])

// Parse the error message string into an array of individual errors
const parseErrorMessage = (message: string) => {
  try {
    // Check if the message is a JSON string containing an array
    if (message.startsWith('[') && message.endsWith(']')) {
      const errors = JSON.parse(message)

      return errors.map((error: string) => error.trim())
    }

    // If not JSON, split by comma if multiple errors exist
    else if (message.includes(',')) {
      return message.split(',').map(error => error.trim())
    }

    // Return single message as array
    return [message]
  }
  catch (e) {
    // Fallback to original message if parsing fails
    return [message]
  }
}

// Watch for changes in error message
watch(() => props.errorMessage, newMessage => {
  parsedErrors.value = parseErrorMessage(newMessage)
}, { immediate: true })
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="900"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard class="mx-4">
      <VCardTitle class="text-h6 pa-4">
        File Error Details
      </VCardTitle>
      <VCardText class="pa-4">
        <VAlert
          type="error"
          variant="outlined"
          icon="bx-error-circle"
        >
          <template v-if="parsedErrors.length > 1">
            <div class="mb-2 font-weight-medium">
              The following errors were found:
            </div>
            <VList
              density="compact"
              class="bg-transparent"
            >
              <VListItem
                v-for="(error, index) in parsedErrors"
                :key="index"
                class="ps-0"
              >
                <template #prepend>
                  <VIcon
                    icon="bx-error"
                    size="small"
                    color="error"
                    class="me-2"
                  />
                </template>
                <VListItemTitle class="text-body-2">
                  {{ error }}
                </VListItemTitle>
              </VListItem>
            </VList>
          </template>
          <template v-else>
            {{ parsedErrors[0] }}
          </template>
        </VAlert>
      </VCardText>
      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn
          color="primary"
          @click="emit('update:modelValue', false)"
        >
          Close
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
