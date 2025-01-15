<script setup lang="ts">
import VueApexCharts from 'vue3-apexcharts'
import { useDisplay, useTheme } from 'vuetify'

import { hexToRgb } from '@layouts/utils'

const vuetifyTheme = useTheme()
const display = useDisplay()

const series = [
  { name: `${new Date().getFullYear() - 1}`, data: [1, 1, 1, 1, 1, 1, 1] },
]

const chartOptions = computed(() => {
  const currentTheme = vuetifyTheme.current.value.colors
  const variableTheme = vuetifyTheme.current.value.variables

  const disabledTextColor = `rgba(${hexToRgb(String(currentTheme['on-surface']))},${variableTheme['disabled-opacity']})`
  const primaryTextColor = `rgba(${hexToRgb(String(currentTheme['on-surface']))},${variableTheme['high-emphasis-opacity']})`
  const borderColor = `rgba(${hexToRgb(String(variableTheme['border-color']))},${variableTheme['border-opacity']})`

  return {
    bar: {
      chart: {
        stacked: true,
        parentHeightOffset: 0,
        toolbar: { show: false },
      },
      dataLabels: { enabled: false },
      stroke: {
        width: 6,
        lineCap: 'round',
        colors: [currentTheme.surface],
      },
      colors: [`rgba(${hexToRgb(String(currentTheme.primary))}, 1)`, `rgba(${hexToRgb(String(currentTheme.info))}, 1)`],
      legend: {
        offsetX: -10,
        position: 'top',
        fontSize: '14px',
        horizontalAlign: 'left',
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
      grid: {
        borderColor,
        padding: {
          bottom: 5,
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 10,
          columnWidth: '30%',
          endingShape: 'rounded',
          startingShape: 'rounded',
        },
      },
      xaxis: {
        axisTicks: { show: false },
        crosshairs: { opacity: 0 },
        axisBorder: { show: false },
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        labels: {
          style: {
            fontSize: '14px',
            colors: disabledTextColor,
            fontFamily: 'Public Sans',
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '14px',
            colors: disabledTextColor,
            fontFamily: 'Public Sans',
          },
        },
      },
      responsive: [
        {
          breakpoint: display.thresholds.value.xl,
          options: {
            plotOptions: {
              bar: { columnWidth: '43%' },
            },
          },
        },
        {
          breakpoint: display.thresholds.value.lg,
          options: {
            plotOptions: {
              bar: { columnWidth: '50%' },
            },
          },
        },
        {
          breakpoint: display.thresholds.value.md,
          options: {
            plotOptions: {
              bar: { columnWidth: '42%' },
            },
          },
        },
        {
          breakpoint: display.thresholds.value.sm,
          options: {
            plotOptions: {
              bar: { columnWidth: '45%' },
            },
          },
        },
      ],
    },
    radial: {
      chart: {
        sparkline: { enabled: true },
      },
      labels: ['Growth'],
      stroke: { dashArray: 5 },
      colors: [`rgba(${hexToRgb(String(currentTheme.primary))}, 1)`],
      states: {
        hover: {
          filter: { type: 'none' },
        },
        active: {
          filter: { type: 'none' },
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          opacityTo: 0.6,
          opacityFrom: 1,
          shadeIntensity: 0.5,
          stops: [30, 70, 100],
          inverseColors: false,
          gradientToColors: [currentTheme.primary],
        },
      },
      plotOptions: {
        radialBar: {
          endAngle: 150,
          startAngle: -140,
          hollow: { size: '55%' },
          track: { background: 'transparent' },
          dataLabels: {
            name: {
              offsetY: 25,
              fontWeight: 600,
              fontSize: '16px',
              color: currentTheme.secondary,
              fontFamily: 'Public Sans',
            },
            value: {
              offsetY: -15,
              fontWeight: 500,
              fontSize: '24px',
              color: primaryTextColor,
              fontFamily: 'Public Sans',
            },
          },
        },
      },
      responsive: [
        {
          breakpoint: 900,
          options: {
            chart: { height: 200 },
          },
        },
        {
          breakpoint: 735,
          options: {
            chart: { height: 200 },
          },
        },
        {
          breakpoint: 660,
          options: {
            chart: { height: 200 },
          },
        },
        {
          breakpoint: 600,
          options: {
            chart: { height: 280 },
          },
        },
      ],
    },
  }
})

const balanceData = [
  { icon: 'bxs-graduation', amount: '₦0.00', year: '2025', color: 'primary' },
  { icon: 'bxs-school', amount: '₦0.00', year: '2025', color: 'info' },
]
</script>

<template>
  <VRow>
    <VCol
      cols="12"
      sm="7"
      xl="8"
    >
      <VCard>
        <VCardItem class="pb-0">
          <VCardTitle>Attendance compliance rate (%)</VCardTitle>

          <template #append>
            <div class="me-n3">
              <MoreBtn />
            </div>
          </template>
        </VCardItem>

        <!-- bar chart -->
        <VueApexCharts
          id="bar-chart"
          type="bar"
          :height="336"
          :options="chartOptions.bar"
          :series="series"
        />
      </VCard>
    </VCol>

    <VCol
      cols="12"
      sm="5"
      xl="4"
    >
      <VCard>
        <VCardText class="text-center">
          <VBtn
            size="small"
            variant="tonal"
            append-icon="bx-chevron-down"
            class="mt-4"
          >
            2025
            <VMenu activator="parent">
              <VList>
                <VListItem
                  v-for="(item, index) in ['2025']"
                  :key="index"
                  :value="item"
                >
                  <VListItemTitle>{{ item }}</VListItemTitle>
                </VListItem>
              </VList>
            </VMenu>
          </VBtn>

          <!-- radial chart -->
          <VueApexCharts
            type="radialBar"
            :height="200"
            :options="chartOptions.radial"
            :series="[100]"
            class="mt-6"
          />

          <p class="font-weight-medium text-high-emphasis mb-7">
            Disbursement success
          </p>
          <div class="d-flex align-center justify-center gap-x-8 gap-y-4 py-2 flex-wrap">
            <div
              v-for="data in balanceData"
              :key="data.year"
              class="d-flex align-center gap-3"
            >
              <VAvatar
                :icon="data.icon"
                :color="data.color"
                size="38"
                rounded
                variant="tonal"
              />

              <div class="text-start">
                <span class="text-sm"> {{ data.year }}</span>
                <h6 class="text-base font-weight-medium">
                  {{ data.amount }}
                </h6>
              </div>
            </div>
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss">
#bar-chart .apexcharts-series[rel="2"] {
  transform: translateY(-10px);
}
</style>
