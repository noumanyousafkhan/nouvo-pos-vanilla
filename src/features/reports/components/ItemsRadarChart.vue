<template>
  <div class="bg-white rounded-3xl border border-nouvo-green/15 p-5 shadow-sm">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <span class="text-[16px]">📦</span>
        <span class="text-[13px] font-bold text-nouvo-ink uppercase tracking-wider">Items Performance</span>
      </div>
      <button class="text-[14px] text-nouvo-gray">⋯</button>
    </div>

    <div v-if="points.length === 0" class="h-[220px] flex items-center justify-center text-nouvo-gray text-[12px]">
      No data
    </div>

    <div v-else class="flex justify-center">
      <svg viewBox="0 0 320 320" class="w-[280px] h-[280px]">
        <g stroke="#E8E8E8" fill="none" stroke-width="1">
          <polygon v-for="ring in 4" :key="ring" :points="ringPoints(ring / 4)" />
        </g>
        <g stroke="#E8E8E8" stroke-width="1">
          <line
            v-for="(p, i) in points"
            :key="'l' + i"
            :x1="CX" :y1="CY"
            :x2="ringPoint(i, 1).x" :y2="ringPoint(i, 1).y"
          />
        </g>

        <!-- Yellow filled area -->
        <polygon
          :points="dataPolygon"
          fill="#F5C842"
          fill-opacity="0.35"
          stroke="#025726"
          stroke-width="2"
        />

        <!-- Green dots at vertices -->
        <circle v-for="(p, i) in dataPoints" :key="i" :cx="p.x" :cy="p.y" r="4" fill="#025726" stroke="#FFFFFF" stroke-width="1.5" />

        <!-- Labels -->
        <text
          v-for="(p, i) in labelPoints"
          :key="'t' + i"
          :x="p.x"
          :y="p.y"
          font-size="10"
          fill="#8A8A8A"
          text-anchor="middle"
        >{{ p.label }}</text>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ data: any[] }>()

const points = computed(() => props.data ?? [])
const maxValue = computed(() => Math.max(...points.value.map((p: any) => p.value), 1))

const CX = 160
const CY = 160
const RADIUS = 105

function angleForIndex(i: number) {
  return (Math.PI * 2 * i) / points.value.length - Math.PI / 2
}

function ringPoint(i: number, ratio: number) {
  const a = angleForIndex(i)
  return { x: CX + Math.cos(a) * RADIUS * ratio, y: CY + Math.sin(a) * RADIUS * ratio }
}

function ringPoints(ratio: number) {
  return points.value.map((_, i) => {
    const p = ringPoint(i, ratio)
    return `${p.x},${p.y}`
  }).join(' ')
}

const dataPoints = computed(() =>
  points.value.map((p: any, i: number) => {
    const r = p.value / maxValue.value
    return ringPoint(i, r)
  })
)

const dataPolygon = computed(() => dataPoints.value.map((p) => `${p.x},${p.y}`).join(' '))

const labelPoints = computed(() =>
  points.value.map((p: any, i: number) => {
    const rp = ringPoint(i, 1.18)
    return {
      x: rp.x,
      y: rp.y + 3,
      label: p.label.length > 14 ? p.label.slice(0, 14) + '…' : p.label
    }
  })
)
</script>
