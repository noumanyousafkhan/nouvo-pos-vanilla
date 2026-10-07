<template>
  <div class="bg-white rounded-3xl border border-nouvo-green/15 p-5 shadow-sm">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <span class="text-[16px]">📊</span>
        <span class="text-[13px] font-bold text-nouvo-ink uppercase tracking-wider">Sales Statistic</span>
      </div>

      <!-- 3-Dots Menu -->
      <div class="relative">
        <button
          type="button"
          class="cursor-pointer text-[14px] text-nouvo-gray w-8 h-8 rounded-lg hover:bg-nouvo-cream flex items-center justify-center transition-colors"
          @click.stop="menuOpen = !menuOpen"
        >⋯</button>

        <div
          v-if="menuOpen"
          class="absolute right-0 top-[36px] w-[200px] bg-white border border-nouvo-gray-border rounded-xl shadow-lg z-30 py-1"
        >
          <button
            type="button"
            class="cursor-pointer w-full text-left px-3 py-2 text-[13px] hover:bg-nouvo-cream flex items-center gap-2"
            @click="refreshChart"
          >
            <span>↻</span> <span>Refresh</span>
          </button>
          <button
            type="button"
            class="cursor-pointer w-full text-left px-3 py-2 text-[13px] hover:bg-nouvo-cream flex items-center gap-2"
            @click="exportPNG"
          >
            <span>🖼</span> <span>Export PNG</span>
          </button>
          <button
            type="button"
            class="cursor-pointer w-full text-left px-3 py-2 text-[13px] hover:bg-nouvo-cream flex items-center gap-2"
            @click="exportCSV"
          >
            <span>📄</span> <span>Export CSV</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Legend + Time Filters -->
    <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
      <div class="flex items-center gap-4 text-[11px]">
        <span v-for="(cat, i) in categories" :key="cat.id" class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full" :style="{ background: colorFor(i) }"></span>
          <span class="text-nouvo-gray">{{ cat.name }}</span>
        </span>
      </div>

      <div class="flex items-center gap-1 text-[11px]">
        <button
          type="button"
          class="cursor-pointer w-7 h-7 rounded-full bg-nouvo-cream flex items-center justify-center text-[12px] hover:bg-nouvo-green hover:text-white transition-colors mr-2"
          title="Refresh"
          @click="refreshChart"
        >↻</button>
        <button
          v-for="p in timeFilters"
          :key="p.value"
          class="cursor-pointer px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors"
          :class="activeTimeFilter === p.value ? 'bg-nouvo-green text-white' : 'text-nouvo-gray hover:bg-nouvo-cream'"
          @click="setFilter(p.value)"
        >{{ p.label }}</button>
      </div>
    </div>

    <!-- Chart -->
    <div v-if="buckets.length === 0" class="h-[240px] flex items-center justify-center text-nouvo-gray text-[13px]">
      No data
    </div>

    <div v-else class="relative">
      <svg
        ref="chartSvg"
        viewBox="0 0 800 260"
        class="w-full h-[260px]"
        @mousemove="onMouseMove"
        @mouseleave="hoveredIndex = null"
      >
        <g stroke="#F0F0F0" stroke-width="1" stroke-dasharray="2 4">
          <line v-for="i in 5" :key="i" x1="40" :y1="i * 45 + 10" x2="790" :y2="i * 45 + 10" />
        </g>

        <line
          v-if="hoveredIndex !== null"
          :x1="xForIndex(hoveredIndex)" y1="20"
          :x2="xForIndex(hoveredIndex)" y2="240"
          stroke="#B0B0B0" stroke-width="1" stroke-dasharray="3 3"
        />

        <path
          v-for="(cat, idx) in categories"
          :key="cat.id"
          :d="pathFor(cat.name)"
          fill="none"
          :stroke="colorFor(idx)"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <g v-for="(cat, idx) in categories" :key="'dots-' + cat.id">
          <circle
            v-for="(p, i) in pointsFor(cat.name)"
            :key="i"
            :cx="p.x"
            :cy="p.y"
            r="3.5"
            :fill="colorFor(idx)"
          />
        </g>

        <g font-size="10" fill="#8A8A8A">
          <text
            v-for="(b, i) in buckets"
            :key="'x' + i"
            :x="xForIndex(i)"
            y="255"
            text-anchor="middle"
          >{{ formatX(b.label) }}</text>
        </g>
      </svg>

      <div
        v-if="hoveredIndex !== null && hoveredData"
        class="absolute bg-white rounded-2xl shadow-lg border border-nouvo-gray-border/40 pointer-events-none z-10"
        style="width: 220px; padding: 12px;"
        :style="tooltipStyle"
      >
        <div class="flex items-center justify-between mb-2 whitespace-nowrap">
          <span class="text-[12px] font-bold text-nouvo-ink">{{ formatXFull(hoveredData.label) }}</span>
          <span class="text-[10px] text-nouvo-gray ml-2">{{ todayDate }}</span>
        </div>

        <div class="space-y-1.5">
          <div v-for="(cat, idx) in categories" :key="cat.id" class="flex items-center gap-2 text-[11px]">
            <span class="w-2 h-2 rounded-full shrink-0" :style="{ background: colorFor(idx) }"></span>
            <span class="text-nouvo-gray flex-1 truncate">{{ cat.name }}</span>
            <span class="font-bold text-nouvo-ink tabular-nums whitespace-nowrap">{{ currency }} {{ valueFor(cat.name, hoveredIndex) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{ data: any; currency: string; currentRange?: string }>()
const emit = defineEmits<{
  refresh: []
  'update:range': [string]
  'open-custom': []
}>()

const buckets = computed(() => props.data?.buckets ?? [])
const categories = computed(() => props.data?.categories ?? [])
const series = computed(() => props.data?.series ?? {})

const PALETTE = ['#025726', '#D4A84B', '#E85A5A']

const activeTimeFilter = ref(props.currentRange || 'all')
const hoveredIndex = ref<number | null>(null)
const menuOpen = ref(false)
const chartSvg = ref<SVGSVGElement | null>(null)

const timeFilters = [
  { value: 'today', label: 'Day' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'all', label: 'All' },
  { value: 'custom', label: 'Custom' }
]

const todayDate = computed(() => {
  const d = new Date()
  return `${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getDate()}, ${String(d.getFullYear()).slice(2)}`
})

const maxY = computed(() => {
  let max = 0
  for (const cat of categories.value) {
    const vals = series.value[cat.name] || []
    for (const v of vals) if (v > max) max = v
  }
  return max || 1
})

function colorFor(idx: number) { return PALETTE[idx % PALETTE.length] }

function xForIndex(i: number) {
  const n = buckets.value.length
  if (n <= 1) return 400
  return (i / (n - 1)) * 720 + 40
}

function yForValue(v: number) { return 240 - (v / maxY.value) * 200 }

function pointsFor(catName: string): Array<{ x: number; y: number }> {
  const vals = series.value[catName] || []
  return buckets.value.map((_: any, i: number) => ({
    x: xForIndex(i),
    y: yForValue(vals[i] || 0)
  }))
}

function pathFor(catName: string) {
  const pts = pointsFor(catName)
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M ${pts[0].x - 25} ${pts[0].y} L ${pts[0].x + 25} ${pts[0].y}`
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
}

function setFilter(v: string) {
  activeTimeFilter.value = v
  if (v === 'custom') {
    emit('open-custom')
    return
  }
  emit('update:range', v)
}

function refreshChart() {
  menuOpen.value = false
  emit('refresh')
}

function exportPNG() {
  menuOpen.value = false
  if (!chartSvg.value) return

  const svgData = new XMLSerializer().serializeToString(chartSvg.value)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const img = new Image()

  canvas.width = 1600
  canvas.height = 520

  img.onload = () => {
    if (!ctx) return
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const link = document.createElement('a')
    link.download = `sales-chart-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
}

function exportCSV() {
  menuOpen.value = false
  const rows: string[] = []

  // Header
  const catNames = categories.value.map((c: any) => c.name)
  rows.push(['Bucket', ...catNames].join(','))

  // Data rows
  for (let i = 0; i < buckets.value.length; i++) {
    const b = buckets.value[i]
    const vals = categories.value.map((c: any) => {
      const arr = series.value[c.name] || []
      return arr[i] ?? 0
    })
    rows.push([b.label, ...vals].join(','))
  }

  const csv = rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const link = document.createElement('a')
  link.download = `sales-chart-${Date.now()}.csv`
  link.href = URL.createObjectURL(blob)
  link.click()
}

function onClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.relative')) {
    menuOpen.value = false
  }
}

function onMouseMove(e: MouseEvent) {
  const svg = e.currentTarget as SVGElement
  const rect = svg.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * 800
  const n = buckets.value.length
  if (n === 0) return
  if (n === 1) { hoveredIndex.value = 0; return }
  const idx = Math.round(((x - 40) / 720) * (n - 1))
  hoveredIndex.value = Math.max(0, Math.min(n - 1, idx))
}

const hoveredData = computed(() => {
  if (hoveredIndex.value === null) return null
  return buckets.value[hoveredIndex.value]
})

const tooltipStyle = computed(() => {
  if (hoveredIndex.value === null) return {}
  const x = xForIndex(hoveredIndex.value)
  const pct = (x / 800) * 100
  let left = pct
  let transform = 'translateX(-50%)'
  if (pct < 16) { left = 0; transform = 'translateX(0)' }
  else if (pct > 84) { left = 100; transform = 'translateX(-100%)' }
  return { left: `${left}%`, transform, top: '10px' }
})

function valueFor(catName: string, idx: number | null) {
  if (idx === null) return 0
  const vals = series.value[catName] || []
  const v = vals[idx] || 0
  return Number(v).toLocaleString('en-US')
}

function formatX(label: any) {
  if (!label) return '—'
  const str = String(label)
  if (props.data?.format === 'hour') return `${str}:00`
  if (props.data?.format === 'day') return str.length >= 10 ? str.slice(5) : str
  return str
}

function formatXFull(label: any) {
  if (!label) return '—'
  const str = String(label)
  if (props.data?.format === 'hour') return `${str}:00`
  return str
}

onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>
