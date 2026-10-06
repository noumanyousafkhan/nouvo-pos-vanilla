<template>
  <div class="h-screen bg-nouvo-cream flex flex-col overflow-hidden">
    <PosTopBar />

    <div class="flex-1 overflow-y-auto px-6 lg:px-8 pb-6">
      <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 class="text-2xl font-bold text-nouvo-green">Reports</h1>

        <div class="flex items-center gap-1 bg-white p-1 rounded-xl border border-nouvo-gray-border">
          <button
            v-for="p in timeFilters"
            :key="p.value"
            class="cursor-pointer px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors"
            :class="filters.range === p.value ? 'bg-nouvo-green text-white' : 'text-nouvo-gray hover:bg-nouvo-cream'"
            @click="setRange(p.value)"
          >{{ p.label }}</button>
        </div>
      </div>

      <div v-if="loading" class="text-center text-nouvo-gray py-16 text-sm">Loading reports...</div>

      <div v-else class="flex flex-col gap-4">
        <!-- KPIs -->
        <KpiCards :kpis="data.kpis" :currency="currency" />

        <!-- Chart + Score -->
        <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
          <SalesChart :data="data.salesChart" :currency="currency" @refresh="loadAll" />
          <ScoreCard :score="data.score" />
        </div>

        <!-- Radar + Top Products -->
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
          <ItemsRadarChart :data="data.itemsPerformance" />
          <TopProductsTable :products="data.topProducts" :currency="currency" />
        </div>

        <!-- Payment + Order Type -->
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
          <PaymentBreakdown :data="data.paymentBreakdown" :currency="currency" />
          <OrderTypeAnalysis :data="data.orderTypeAnalysis" :currency="currency" />
        </div>

        <!-- Category Performance -->
        <CategoryPerformance :data="data.categoryPerformance" :currency="currency" />

        <!-- Recent Transactions -->
        <RecentTransactions :transactions="data.recentTransactions" :currency="currency" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PosTopBar from '@/features/pos/components/PosTopBar.vue'
import KpiCards from './components/KpiCards.vue'
import SalesChart from './components/SalesChart.vue'
import ScoreCard from './components/ScoreCard.vue'
import ItemsRadarChart from './components/ItemsRadarChart.vue'
import TopProductsTable from './components/TopProductsTable.vue'
import PaymentBreakdown from './components/PaymentBreakdown.vue'
import OrderTypeAnalysis from './components/OrderTypeAnalysis.vue'
import CategoryPerformance from './components/CategoryPerformance.vue'
import RecentTransactions from './components/RecentTransactions.vue'
import { useSettingsStore } from '@/stores/settings'
import { invokeSafe } from '@/utils/ipc'

const store = useSettingsStore()
const loading = ref(false)
const currency = ref('Rs.')

const filters = ref({
  range: 'today',
  dateFrom: undefined,
  dateTo: undefined,
  includeVoided: false
})

const timeFilters = [
  { value: 'today', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'all', label: 'All' }
]

const data = ref<any>({
  kpis: { revenue: 0, revenueTrend: 0, orderCount: 0, orderTrend: 0, avgOrder: 0, performance: 'No Data' },
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
  try {
    const res = await invokeSafe<any>('reports:fullDashboard', filters.value)
    if (res.ok && res.data) {
      data.value = {
        kpis: res.data.kpis || data.value.kpis,
        salesChart: res.data.salesChart || data.value.salesChart,
        topProducts: res.data.topProducts || [],
        categoryPerformance: res.data.categoryPerformance || [],
        paymentBreakdown: res.data.paymentBreakdown || [],
        orderTypeAnalysis: res.data.orderTypeAnalysis || [],
        itemsPerformance: res.data.itemsPerformance || [],
        recentTransactions: res.data.recentTransactions || [],
        score: res.data.score || data.value.score
      }
    }
  } catch (err) {
    console.error('[reports] failed', err)
  } finally {
    loading.value = false
  }
}

function setRange(r: string) {
  filters.value.range = r
  loadAll()
}

onMounted(() => {
  currency.value = store.currency
  loadAll()
})
</script>
