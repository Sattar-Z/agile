<script setup lang="ts">
import moment from 'moment'

interface CareGiver {
  id: number | null
  bvn_id: number | null
  nin_id: number | null
  name: number | null
  phone: string | null
  date_of_birth: string | null
  community: string | null
  gender: string | null
  qualification: string | null
  income: string | null
  is_employed: string | null
  certificate: number | null
  is_bvn_verfied: number | null
  is_nin_verfied: number | null
  date_collected: string | null
  status: string | null
  created_at: string | null
  updated_at: string | null
}

interface Students {
  id: number | null
  school_id: number | null
  lga_id: number | null
  care_giver_id: number | null
  name: string | null
  date_of_birth: string | null
  student_admission_number: string | null
  class: string | null
  disabilities: string | null
  uniform: number | null
  text_book: number | null
  school_distance: string | null
  materials: number | null
  care_giver: CareGiver
  created_at: string | null
  updated_at: string | null
}

defineProps<{
  modelValue: boolean
  student: Students | null
}>()

const emit = defineEmits(['update:modelValue'])

const closeDialog = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <div class="pa-4 text-center justify-center">
    <VDialog
      v-model="$props.modelValue"
      fullscreen
      location="right"
      width="25%"
      transition="dialog-bottom-transition"
    >
      <VCard color="background">
        <VToolbar color="surface">
          <VBtn
            icon="bx-x"
            @click="closeDialog"
          />
          <VToolbarTitle>Student Details</VToolbarTitle>
        </VToolbar>
        <VCardText>
          <VContainer v-if="student">
            <VRow>
              <VCol cols="12">
                <span class="font-weight-bold text-caption">Name:</span>
                <span class="text-caption mx-3">{{ student.name }}</span>
              </VCol>
              <VCol cols="12">
                <span class="font-weight-bold text-caption">Admission Number:</span>
                <span class="text-caption mx-3">{{ student.student_admission_number }}</span>
              </VCol>
              <VCol cols="12">
                <span class="font-weight-bold text-caption">Date of Birth:</span>
                <span class="text-caption mx-3">{{ moment(student.date_of_birth).format('Do MMMM YYYY') }}</span>
              </VCol>
              <VCol cols="12">
                <span class="font-weight-bold text-caption">Class:</span>
                <span class="text-caption mx-3">{{ student.class }}</span>
              </VCol>
              <VCol cols="12">
                <span class="font-weight-bold text-caption">Disabilities:</span>
                <span class="text-caption mx-3">{{ student.disabilities || 'None' }}</span>
              </VCol>

              <VCol cols="12">
                <VDivider class="my-4" />
                <h3 class="text-subtitle-1 font-weight-bold">
                  Care Giver Details
                </h3>
              </VCol>

              <VCol cols="12">
                <span class="font-weight-bold text-caption">Care Giver Name:</span>
                <span class="text-caption mx-3">{{ student.care_giver.name }}</span>
              </VCol>
              <VCol cols="12">
                <span class="font-weight-bold text-caption">Care Giver Phone:</span>
                <span class="text-caption mx-3">{{ student.care_giver.phone }}</span>
              </VCol>
              <VCol cols="12">
                <span class="font-weight-bold text-caption">Care Giver Status:</span>
                <VChip
                  :color="student.care_giver.is_bvn_verfied === 1 ? 'success' : 'error'"
                  size="small"
                  density="compact"
                  class="mx-3"
                >
                  {{ student.care_giver.is_bvn_verfied === 1 ? 'Verified' : 'Unverified' }}
                </VChip>
              </VCol>
            </VRow>
          </VContainer>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>
