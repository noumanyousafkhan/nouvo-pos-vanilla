<template>
  <div class="px-0 flex items-center gap-3">
    <div class="relative flex items-center flex-1 bg-white border border-nouvo-gray-border rounded-xl h-12">
      <span class="absolute left-4 flex items-center justify-center text-nouvo-gray">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </span>
      <input
        :value="modelValue"
        type="text"
        placeholder="Search"
        class="w-full h-full pl-11 pr-4 bg-transparent border-none outline-none text-[13px] text-nouvo-ink placeholder:text-nouvo-gray"
        @input="onInput"
      />
    </div>

    <div class="relative shrink-0">
      <button
        type="button"
        class="cursor-pointer h-12 px-4 rounded-xl border flex items-center gap-2 transition-colors"
        :class="
          sortBy !== 'default'
            ? 'bg-nouvo-green text-white border-nouvo-green'
            : 'bg-white text-nouvo-ink border-nouvo-gray-border hover:bg-nouvo-cream'
        "
        @click.stop="filterOpen = !filterOpen"
        title="Sort / Filter"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="4" y1="6" x2="20" y2="6"/>
          <line x1="7" y1="12" x2="17" y2="12"/>
          <line x1="10" y1="18" x2="14" y2="18"/>
        </svg>
        <span class="text-[13px] font-semibold hidden sm:inline">Filter</span>
      </button>

      <div
        v-if="filterOpen"
        class="absolute right-0 top-[56px] bg-white border border-nouvo-gray-border rounded-xl shadow-lg z-40 w-56 py-1"
      >
        <div class="px-3 pt-2 pb-1 text-[10px] font-bold text-nouvo-gray uppercase tracking-wider">Sort By</div>
        <button
          v-for="opt in sortOptions"
          :key="opt.value"
          type="button"
          class="cursor-pointer w-full text-left px-3 py-2 text-[13px] hover:bg-nouvo-cream flex items-center justify-between"
          :class="sortBy === opt.value ? 'text-nouvo-green font-semibold' : 'text-nouvo-ink'"
          @click="selectSort(opt.value)"
        >
          <span>{{ opt.label }}</span>
          <span v-if="sortBy === opt.value" class="text-nouvo-green text-xs">✓</span>
        </button>

        <div class="border-t border-nouvo-gray-border/60 my-1"></div>

        <div class="px-3 pt-1 pb-1 text-[10px] font-bold text-nouvo-gray uppercase tracking-wider">Filter</div>
        <label class="cursor-pointer w-full text-left px-3 py-2 text-[13px] hover:bg-nouvo-cream flex items-center justify-between text-nouvo-ink">
          <span>Hide out of stock</span>
          <input
            type="checkbox"
            :checked="hideOutOfStock"
            @change="$emit('toggle-hide-oos', ($event.target as HTMLInputElement).checked)"
          />
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{
  modelValue: string
  sortBy: string
  hideOutOfStock: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [string]
  search: [string]
  'update:sortBy': [string]
  'toggle-hide-oos': [boolean]
}>()

const filterOpen = ref(false)

const sortOptions = [
  { value: 'default', label: 'Default' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'name-asc', label: 'Name: A → Z' },
  { value: 'name-desc', label: 'Name: Z → A' },
  { value: 'newest', label: 'Newest first' }
]

function onInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  emit('update:modelValue', value)
  emit('search', value)
}

function selectSort(value: string) {
  emit('update:sortBy', value)
  filterOpen.value = false
}

function onClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.relative')) {
    filterOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>
