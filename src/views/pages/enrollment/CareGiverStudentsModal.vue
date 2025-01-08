<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  caregiver: any
}>()

defineEmits(['update:modelValue'])

const headers = [
  { title: 'Name', key: 'name', align: 'start' },
  { title: 'Admission No', key: 'student_admission_number', align: 'center' },
  { title: 'Class', key: 'class', align: 'center' },
  { title: 'DOB', key: 'date_of_birth', align: 'center' },
  { title: 'Disabilities', key: 'disabilities', align: 'center' },
  { title: 'School Distance', key: 'school_distance', align: 'center' },
]
</script>

<template>
  <VDialog
    :model-value="props.modelValue"
    width="800"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <VCard v-if="props.caregiver">
      <VCardTitle class="d-flex justify-space-between pa-4">
        <span>Students under {{ props.caregiver.name }}</span>
        <VBtn
          icon="bx-x"
          variant="text"
          @click="$emit('update:modelValue', false)"
        />
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-4">
        <VTable>
          <thead>
            <tr>
              <th
                v-for="header in headers"
                :key="header.key"
                :class="[header.align === 'center' ? 'text-center' : '']"
              >
                {{ header.title }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="student in props.caregiver.students"
              :key="student.id"
            >
              <td>{{ student.name }}</td>
              <td class="text-center">
                {{ student.student_admission_number }}
              </td>
              <td class="text-center">{{ student.class }}</td>
              <td class="text-center">
                {{ new Date(student.date_of_birth).toLocaleDateString() }}
              </td>
              <td class="text-center">{{ student.disabilities }}</td>
              <td class="text-center">{{ student.school_distance }}</td>
            </tr>
          </tbody>
        </VTable>
      </VCardText>
    </VCard>
  </VDialog>
</template>
