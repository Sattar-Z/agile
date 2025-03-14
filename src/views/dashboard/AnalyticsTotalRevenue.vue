<script setup lang="ts">
import VueApexCharts from 'vue3-apexcharts'
import { useDisplay, useTheme } from 'vuetify'
import { callApi } from '@/helpers/request'
import { useUserStore } from '@/stores/user'

import { hexToRgb } from '@layouts/utils'

interface School {
  type: string
  total_students: number
  schools_count: number
}

interface Lga {
  lga_id: number
  lga_name: string
  schools: School[]
  total_students: number
}

interface AttendanceData {
  lga_id: number
  lga_name: string
  attendance_pacentage: number
  total_students: number
}

const lgas = ref<Lga[]>([])
const vuetifyTheme = useTheme()
const display = useDisplay()
const lgaLoading = ref(false)
const user = useUserStore()
const attendanceData = ref<AttendanceData[]>([])
const pieChartLoading = ref(false)

const alertInfo = reactive({
  show: false,
  message: '',
  title: '',
  type: 'error' as 'error' | 'success' | 'warning' | 'info',
})

// Chart data will be computed from the API response
const chartSeries = computed(() => {
  if (!lgas.value || lgas.value.length === 0) {
    return [
      { name: 'Junior', data: [] },
      { name: 'Senior', data: [] },
    ]
  }

  // Extract data for both Junior and Senior schools per LGA
  const juniorData = lgas.value.map(lga => {
    const juniorSchool = lga.schools.find(school => school.type === 'Junior')

    return juniorSchool ? juniorSchool.total_students : 0
  })

  const seniorData = lgas.value.map(lga => {
    const seniorSchool = lga.schools.find(school => school.type === 'Senior')

    return seniorSchool ? seniorSchool.total_students : 0
  })

  return [
    { name: 'Junior', data: juniorData },
    { name: 'Senior', data: seniorData },
  ]
})

// LGA names for chart categories
const lgaNames = computed(() => {
  return lgas.value.map(lga => lga.lga_name)
})

const fetchData = async () => {
  lgaLoading.value = true
  try {
    const response = await callApi({
      url: 'compliance/chart',
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()
    if (!response.ok) {
      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = responseData.message || 'LGA list failed'
      alertInfo.type = 'error'
    }
    else {
      // Update to match the new API response format
      lgas.value = responseData.data
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'LGA list error'
    alertInfo.type = 'error'
    if (user.isTokenExpired())
      user.removeUser()
  }
  finally {
    lgaLoading.value = false
  }
}

const fetchPieChartData = async () => {
  pieChartLoading.value = true
  try {
    const response = await callApi({
      url: 'compliance/pie-chart',
      method: 'GET',
      authorized: true,
      showAlert: false,
    })

    const responseData = await response.json()
    if (!response.ok) {
      alertInfo.show = true
      alertInfo.title = 'Error'
      alertInfo.message = responseData.message || 'Attendance data failed'
      alertInfo.type = 'error'
    }
    else {
      attendanceData.value = responseData
    }
  }
  catch (error) {
    alertInfo.show = true
    alertInfo.title = 'Error'
    alertInfo.message = 'Attendance data error'
    alertInfo.type = 'error'
    if (user.isTokenExpired())
      user.removeUser()
  }
  finally {
    pieChartLoading.value = false
  }
}

const pieChartSeries = computed(() => {
  return attendanceData.value.map(item => item.attendance_pacentage)
})

const pieChartLabels = computed(() => {
  return attendanceData.value.map(item => item.lga_name)
})

const chartOptions = computed(() => {
  const currentTheme = vuetifyTheme.current.value.colors
  const variableTheme = vuetifyTheme.current.value.variables

  const disabledTextColor = `rgba(${hexToRgb(String(currentTheme['on-surface']))},${variableTheme['disabled-opacity']})`
  const primaryTextColor = `rgba(${hexToRgb(String(currentTheme['on-surface']))},${variableTheme['high-emphasis-opacity']})`
  const borderColor = `rgba(${hexToRgb(String(variableTheme['border-color']))},${variableTheme['border-opacity']})`

  return {
    bar: {
      chart: {
        stacked: false,
        parentHeightOffset: 0,
        toolbar: { show: false },
      },
      dataLabels: { enabled: false },
      stroke: {
        width: 1,
        colors: [currentTheme.surface],
      },
      colors: [`rgba(${hexToRgb(String(currentTheme.primary))}, 1)`, `rgba(${hexToRgb(String(currentTheme.info))}, 1)`],
      legend: {
        position: 'top',
        fontSize: '14px',
        fontFamily: 'Public Sans',
        labels: {
          colors: currentTheme.secondary,
        },
        itemMargin: {
          vertical: 4,
          horizontal: 10,
        },
        markers: {
          width: 8,
          height: 8,
          radius: 10,
          offsetX: -4,
        },
      },
      states: {
        hover: {
          filter: { type: 'none' },
        },
        active: {
          filter: { type: 'none' },
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 3,
          columnWidth: '40%', // Reduce this for more spacing between groups
          endingShape: 'rounded',
          startingShape: 'rounded',
          horizontal: false,
          dataLabels: {
            position: 'top', // Add data labels for clarity
          },

          // Make sure grouped is explicitly set
          grouped: true,
        },
      },
      xaxis: {
        axisTicks: { show: false },
        crosshairs: { opacity: 0 },
        axisBorder: { show: false },
        categories: lgaNames.value.map(value => value.slice(0, 3)), // Use LGA names for the x-axis categories
        labels: {
          style: {
            fontSize: '14px',
            colors: disabledTextColor,
            fontFamily: 'Public Sans',
          },
          rotate: -45,
          rotateAlways: false,
          hideOverlappingLabels: true,
          trim: true,
          maxHeight: 120,
        },
      },
      yaxis: {
        title: {
          text: 'Number of Students',
          style: {
            fontSize: '14px',
            fontFamily: 'Public Sans',
            color: primaryTextColor,
          },
        },
        labels: {
          style: {
            fontSize: '14px',
            colors: disabledTextColor,
            fontFamily: 'Public Sans',
          },
          formatter(val: any) {
            return val.toFixed(0)
          },
        },
      },
      tooltip: {
        custom({ series, seriesIndex, dataPointIndex, w }) {
          const lga = lgas.value[dataPointIndex]
          const schoolType = seriesIndex === 0 ? 'Junior' : 'Senior'
          const schoolInfo = lga.schools.find(s => s.type === schoolType)

          return `
            <div class="custom-tooltip" style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 5px;">${lga.lga_name} - ${schoolType}</div>
              <div style="margin-bottom: 3px;">Students: ${series[seriesIndex][dataPointIndex]}</div>
              <div>Schools: ${schoolInfo ? schoolInfo.schools_count : 0}</div>
            </div>
          `
        },
      },
      responsive: [
        {
          breakpoint: display.thresholds.value.xl,
          options: {
            plotOptions: {
              bar: { columnWidth: '83%' },
            },
          },
        },
        {
          breakpoint: display.thresholds.value.lg,
          options: {
            plotOptions: {
              bar: { columnWidth: '90%' },
            },
          },
        },
        {
          breakpoint: display.thresholds.value.md,
          options: {
            plotOptions: {
              bar: { columnWidth: '82%' },
            },
          },
        },
        {
          breakpoint: display.thresholds.value.sm,
          options: {
            plotOptions: {
              bar: { columnWidth: '85%' },
            },
          },
        },
      ],
    },
    pie: {
      chart: {
        type: 'pie',
        toolbar: { show: false },
      },
      labels: pieChartLabels.value,
      legend: {
        position: 'bottom',
        fontSize: '13px',
        fontFamily: 'Public Sans',
        labels: {
          colors: currentTheme.secondary,
        },
        markers: {
          width: 10,
          height: 10,
          radius: 5,
        },
        itemMargin: {
          horizontal: 8,
          vertical: 3,
        },
      },
      tooltip: {
        y: {
          formatter: (val: any) => `${val}%`,
        },
      },
      stroke: {
        width: 0,
      },
      dataLabels: {
        enabled: true,
        formatter: (val: any) => `${Math.round(val)}%`,
        style: {
          fontSize: '12px',
          fontFamily: 'Public Sans',
          fontWeight: 'normal',
        },
        dropShadow: {
          enabled: false,
        },
      },
      responsive: [
        {
          breakpoint: 900,
          options: {
            chart: { height: 300 },
            legend: { position: 'bottom' },
          },
        },
        {
          breakpoint: 600,
          options: {
            chart: { height: 280 },
            legend: { position: 'bottom' },
          },
        },
      ],
    },
  }
})

onMounted(() => {
  fetchData()
  fetchPieChartData()
})
</script>

<template>
  <!-- Snackbar -->
  <VSnackbar
    v-model="alertInfo.show"
    :color="alertInfo.type"
    :timeout="4000"
    elevation="4"
  >
    <p>{{ alertInfo.message }}</p>
    <template #actions>
      <VBtn
        icon="bx-x"
        variant="text"
        @click="alertInfo.show = false"
      />
    </template>
  </VSnackbar>
  <VRow>
    <VCol
      cols="12"
      md="8"
    >
      <VCard :loading="lgaLoading">
        <VCardItem class="pb-0">
          <VCardTitle>LGA Student Distribution</VCardTitle>

          <template #append>
            <div class="me-n3">
              <MoreBtn />
            </div>
          </template>
        </VCardItem>

        <VCardText class="pt-2 pb-0">
          <p class="text-sm text-disabled mb-4">
            Comparison of junior and senior students across Local Government Areas
          </p>
        </VCardText>

        <div class="position-relative">
          <!-- No data message -->
          <div
            v-if="!lgaLoading && lgas.length === 0"
            class="d-flex justify-center align-center py-10"
          >
            <p class="text-disabled">
              No data available
            </p>
          </div>

          <!-- bar chart -->
          <VueApexCharts
            v-if="lgas.length > 0"
            id="bar-chart"
            type="bar"
            :height="Math.max(330)"
            :options="chartOptions.bar"
            :series="chartSeries"
          />
        </div>
      </VCard>
    </VCol>

    <VCol
      cols="12"
      md="4"
    >
      <VCard :loading="pieChartLoading">
        <VCardText class="text-center">
          <h6 class="text-h6 font-weight-medium mt-4">
            Attendance Percentages by LGA
          </h6>

          <div class="position-relative">
            <!-- No data message -->
            <div
              v-if="!pieChartLoading && attendanceData.length === 0"
              class="d-flex justify-center align-center py-10"
            >
              <p class="text-disabled">
                No attendance data available
              </p>
            </div>

            <!-- Pie chart -->
            <VueApexCharts
              v-if="attendanceData.length > 0"
              type="pie"
              :height="300"
              :options="chartOptions.pie"
              :series="pieChartSeries"
              class="mt-6"
            />
          </div>

          <p class="font-weight-medium text-high-emphasis mt-4 mb-2">
            LGA Attendance Compliance
          </p>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss">

.custom-tooltip {
  border-radius: 5px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 15%);
  font-family: "Public Sans", sans-serif;
  padding-block: 8px;
  padding-inline: 12px;
}
</style>
