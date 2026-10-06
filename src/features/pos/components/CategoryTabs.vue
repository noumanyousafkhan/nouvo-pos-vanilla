<template>
  <div class="category-bar-wrap">
    <div class="category-bar" :class="{ 'scrollable': categories.length > 6 }">
      <div
        v-for="(cat, index) in categories"
        :key="cat.id"
        class="category-card"
        :class="{ active: cat.id === activeId, inactive: !cat.is_active }"
        :style="cardStyle(cat, index)"
        @click="$emit('select', cat.id)"
      >
        <div
          class="badge"
          :class="cat.is_active ? 'badge-available' : 'badge-restock'"
        >
          {{ cat.is_active ? 'Available' : 'Need to re-stock' }}
        </div>

        <div class="info">
          <div class="name">{{ cat.name }}</div>
          <div class="count">{{ getCount(cat.id, cat.name) }} Items</div>
        </div>

        <div class="icon" v-html="getIcon(cat.name, index, cat.id === activeId)"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { invokeSafe } from '@/utils/ipc'

const props = defineProps<{
  categories: any[]
  activeId: number | null
}>()

defineEmits<{ select: [number] }>()

const counts = ref<Record<number, number>>({})
const dealsCount = ref(0)

const ACTIVE_PALETTE = [
  { bg: '#025726', fg: '#FFFFFF' },
  { bg: '#F4A9A8', fg: '#FFFFFF' },
  { bg: '#C19A6B', fg: '#FFFFFF' },
  { bg: '#7BA88C', fg: '#FFFFFF' },
  { bg: '#E85A5A', fg: '#FFFFFF' },
  { bg: '#F5C842', fg: '#1A1A1A' }
]

const DEALS_COLOR = { bg: '#D4A84B', fg: '#FFFFFF' }
const INACTIVE = { bg: '#F5F1E8', fg: '#1A1A1A' }

function isDeals(cat: any): boolean {
  return String(cat?.name || '').trim().toLowerCase() === 'deals'
}

function cardStyle(cat: any, index: number) {
  if (cat.id !== props.activeId) {
    return { background: INACTIVE.bg, color: INACTIVE.fg }
  }
  if (isDeals(cat)) {
    return { background: DEALS_COLOR.bg, color: DEALS_COLOR.fg }
  }
  const c = ACTIVE_PALETTE[index % ACTIVE_PALETTE.length]
  return { background: c.bg, color: c.fg }
}

function getIcon(catName: string, index: number, isActive: boolean) {
  const fillColor = isActive ? '#FFFFFF' : '#C9C3B5'
  const accentColor = isActive ? '#025726' : '#F5F1E8'

  if (String(catName || '').trim().toLowerCase() === 'deals') {
    return `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 8 C41.5 8, 42.8 9, 43.3 10.4 L48.4 25 L63.7 25.1 C65.2 25.1, 66.4 26.3, 66.4 27.8 C66.4 28.5, 66.1 29.2, 65.6 29.7 L53.3 38.9 L57.7 53.9 C58.2 55.6, 57.3 57.4, 55.6 57.9 C54.9 58.1, 54.2 58.1, 53.6 57.8 L40 48.3 L26.4 57.8 C25 58.7, 23.1 58.3, 22.2 56.9 C21.9 56.3, 21.8 55.6, 22 55 L26.4 39.9 L14.1 29.7 C12.8 28.6, 12.7 26.7, 13.8 25.4 C14.4 24.8, 15.1 24.4, 15.9 24.4 L31.6 24.4 L36.7 10.4 C37.2 9, 38.5 8, 40 8 Z" fill="${fillColor}"/>
    </svg>`
  }

  const icons = [
    `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 12 L68 62 Q40 74 12 62 Z" fill="${fillColor}"/>
      <circle cx="34" cy="42" r="2.5" fill="${accentColor}"/>
      <circle cx="46" cy="46" r="2.5" fill="${accentColor}"/>
      <circle cx="40" cy="56" r="2.5" fill="${accentColor}"/>
      <circle cx="30" cy="52" r="2" fill="${accentColor}"/>
      <circle cx="48" cy="34" r="2" fill="${accentColor}"/>
    </svg>`,
    `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 32 Q14 14 40 14 Q66 14 66 32 Z" fill="${fillColor}"/>
      <rect x="12" y="34" width="56" height="6" rx="2" fill="${fillColor}" opacity="0.85"/>
      <rect x="12" y="42" width="56" height="6" rx="2" fill="${fillColor}"/>
      <path d="M14 50 Q14 66 40 66 Q66 66 66 50 Z" fill="${fillColor}"/>
      <circle cx="28" cy="24" r="1.5" fill="${accentColor}"/>
      <circle cx="42" cy="22" r="1.5" fill="${accentColor}"/>
      <circle cx="52" cy="26" r="1.5" fill="${accentColor}"/>
    </svg>`,
    `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 40 Q40 12 64 40 L60 60 Q40 52 20 60 Z" fill="${fillColor}"/>
      <path d="M16 40 Q40 30 64 40" stroke="${accentColor}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M20 48 Q40 42 60 48" stroke="${accentColor}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path d="M22 56 Q40 52 58 56" stroke="${accentColor}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    </svg>`,
    `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="40" cy="40" rx="22" ry="28" fill="${fillColor}"/>
      <path d="M26 26 Q40 20 54 26" stroke="${accentColor}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M26 34 Q40 28 54 34" stroke="${accentColor}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M26 42 Q40 36 54 42" stroke="${accentColor}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M26 50 Q40 44 54 50" stroke="${accentColor}" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`,
    `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 34 L26 68 Q27 72 32 72 L48 72 Q53 72 54 68 L58 34 Z" fill="${fillColor}"/>
      <rect x="20" y="30" width="40" height="6" rx="2" fill="${fillColor}"/>
      <rect x="28" y="14" width="5" height="18" rx="1.5" fill="${fillColor}"/>
      <rect x="37" y="10" width="5" height="22" rx="1.5" fill="${fillColor}"/>
      <rect x="46" y="16" width="5" height="16" rx="1.5" fill="${fillColor}"/>
    </svg>`,
    `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 26 L26 66 Q27 70 32 70 L48 70 Q53 70 54 66 L58 26 Z" fill="${fillColor}"/>
      <ellipse cx="40" cy="26" rx="18" ry="4" fill="${fillColor}"/>
      <rect x="42" y="6" width="3" height="20" rx="1.5" fill="${fillColor}" transform="rotate(15 43 16)"/>
      <path d="M16 40 Q20 42 22 46" stroke="${fillColor}" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`
  ]

  return icons[index % icons.length]
}

async function loadCounts() {
  const map: Record<number, number> = {}
  for (const cat of props.categories) {
    if (String(cat.name).trim().toLowerCase() === 'deals') continue
    try {
      const res = await invokeSafe<any>('menu:products:list', Number(cat.id), false)
      if (res.ok && Array.isArray(res.data)) map[cat.id] = res.data.length
    } catch {}
  }
  counts.value = map

  try {
    const dealsRes = await invokeSafe<any>('deals:list', true, false)
    if (dealsRes.ok) dealsCount.value = (dealsRes.data || []).length
  } catch {}
}

function getCount(id: number, name: string): number {
  if (String(name || '').trim().toLowerCase() === 'deals') return dealsCount.value
  return counts.value[id] ?? 0
}

watch(
  () => props.categories,
  (newCats) => {
    if (newCats && newCats.length > 0) loadCounts()
  },
  { immediate: true }
)
</script>

<style scoped>
.category-bar-wrap {
  width: 100%;
  overflow: hidden;
}

.category-bar {
  display: flex;
  gap: 12px;
  width: 100%;
}

/* 7+ categories → horizontal scroll */
.category-bar.scrollable {
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 2px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;
}

.category-bar.scrollable::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  background: transparent !important;
}

.category-bar.scrollable::-webkit-scrollbar-track,
.category-bar.scrollable::-webkit-scrollbar-thumb,
.category-bar.scrollable::-webkit-scrollbar-corner {
  display: none !important;
  background: transparent !important;
  width: 0 !important;
  height: 0 !important;
}

/*
  FIXED width = exactly 6 cards fit on screen.
  flex-shrink: 0 → card never squeezes.
  7th card overflows → scroll.
*/
.category-bar.scrollable .category-card {
  flex: 0 0 calc((100% - 60px) / 6);
  min-width: calc((100% - 60px) / 6);
  max-width: calc((100% - 60px) / 6);
  width: calc((100% - 60px) / 6);
}

/* Base card */
.category-card {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  height: 110px;
  border-radius: 16px;
  padding: 14px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  user-select: none;
}

.category-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.category-card.active {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.10);
}

.category-card.inactive {
  opacity: 0.65;
}

.badge {
  position: absolute;
  top: 12px;
  left: 12px;
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 999px;
  white-space: nowrap;
}

.badge-available {
  background: #FFFFFF;
  color: #025726;
}

.badge-restock {
  background: #E85A5A;
  color: #FFFFFF;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 65%;
  overflow: hidden;
  position: relative;
  z-index: 2;
}

.name {
  font-size: 17px;
  font-weight: 700;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.count {
  font-size: 11px;
  opacity: 0.75;
}

.icon {
  position: absolute;
  right: 6px;
  bottom: 4px;
  width: 68px;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  opacity: 0.9;
  z-index: 1;
}

.icon :deep(svg) {
  width: 100%;
  height: 100%;
}
</style>
