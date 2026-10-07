<template>
  <div class="h-screen bg-nouvo-cream flex flex-col overflow-hidden">
    <PosTopBar />

    <div class="flex-1 overflow-y-auto px-6 lg:px-8 pb-6">
      <div class="flex items-center justify-between mb-5">
        <h1 class="text-2xl font-bold text-nouvo-green">Reports</h1>
        <ReportFilters v-model="filters" @apply="loadAll" @refresh="loadAll" />
      </div>

      <div v-if="loading" class="text-center text-nouvo-gray py-16 text-sm">Loading reports...</div>

      <div v-else class="flex flex-col gap-4">
        <KpiCards :kpis="data.kpis" :currency="currency" />

        <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
          <SalesChart
            :data="data.salesChart"
            :currency="currency"
            :current-range="filters.range"
            @refresh="loadAll"
            @update:range="onRangeChange"
            @open-custom="showCustomModal = true"
          />
          <ScoreCard :score="data.score" />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
          <ItemsRadarChart :data="data.itemsPerformance" />
          <TopProductsTable :products="data.topProducts" :currency="currency" />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
          <PaymentBreakdown :data="data.paymentBreakdown" :currency="currency" />
          <OrderTypeAnalysis :data="data.orderTypeAnalysis" :currency="currency" />
        </div>

        <CategoryPerformance :data="data.categoryPerformance" :currency="currency" />

        <RecentTransactions :transactions="data.recentTransactions" :currency="currency" />
      </div>
    </div>

    <DateRangeModal
      v-if="showCustomModal"
      :from="filters.dateFrom"
      :to="filters.dateTo"
      @close="showCustomModal = false"
      @apply="onCustomRangeApply"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PosTopBar from '@/features/pos/components/PosTopBar.vue'
import ReportFilters from './components/ReportFilters.vue'
import KpiCards from './components/KpiCards.vue'
import SalesChart from './components/SalesChart.vue'
import ScoreCard from './components/ScoreCard.vue'
import ItemsRadarChart from './components/ItemsRadarChart.vue'
import TopProductsTable from './components/TopProductsTable.vue'
import PaymentBreakdown from './components/PaymentBreakdown.vue'
import OrderTypeAnalysis from './components/OrderTypeAnalysis.vue'
import CategoryPerformance from './components/CategoryPerformance.vue'
import RecentTransactions from './components/RecentTransactions.vue'
import DateRangeModal from './components/DateRangeModal.vue'
import { useSettingsStore } from '@/stores/settings'
import { invokeSafe } from '@/utils/ipc'

const store = useSettingsStore()
const loading = ref(false)
const currency = ref('Rs.')
const showCustomModal = ref(false)

const filters = ref({
  range: 'all',
  dateFrom: undefined as string | undefined,
  dateTo: undefined as string | undefined,
  orderType: undefined,
  paymentMethod: undefined,
  includeVoided: false
})

const data = ref<any>({
  kpis: {
    revenue: 0,
    revenueTrend: 0,
    orderCount: 0,
    orderTrend: 0,
    avgOrder: 0,
    performance: 'No Data',
    dineInCount: 0,
    takeawayCount: 0,
    deliveryCount: 0
  },
  salesChart: { format: 'hour', buckets: [], categories: [], series: {} },
  topProducts: [],
  categoryPerformance: [],
  paymentBreakdown: [],
  orderTypeAnalysis: [],
  itemsPerformance: [],
  recentTransactions: [],
  score: { score: 0, totalOrders: 0, voidedOrders: 0, complaints: [] }
})

async function loadAll() {
  loading.value = true
  const res = await invokeSafe<any>('reports:fullDashboard', filters.value)
  loading.value = false
  if (res.ok && res.data) {
    data.value = res.data
  } else if (!res.ok) {
    console.error('Reports load failed:', (res as any).error?.message)
  }
}

function onRangeChange(newRange: string) {
  filters.value.range = newRange
  filters.value.dateFrom = undefined
  filters.value.dateTo = undefined
  loadAll()
}

function onCustomRangeApply(payload: { from: string; to: string }) {
  filters.value.range = 'custom'
  filters.value.dateFrom = payload.from
  filters.value.dateTo = payload.to
  showCustomModal.value = false
  loadAll()
}

onMounted(() => {
  currency.value = store.currency
  loadAll()
})
</script>
