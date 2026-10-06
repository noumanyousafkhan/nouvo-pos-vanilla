<template>
  <div class="bg-white rounded-3xl border border-nouvo-green/15 p-5 shadow-sm">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <span class="text-[16px]">🕐</span>
        <span class="text-[13px] font-bold text-nouvo-ink uppercase tracking-wider">Recent Transactions</span>
      </div>
      <div class="flex items-center gap-1">
        <button class="cursor-pointer w-7 h-7 rounded-full bg-nouvo-cream flex items-center justify-center text-[12px]">↻</button>
        <button class="cursor-pointer px-3 py-1 rounded-full text-[11px] font-semibold bg-nouvo-green text-white">All</button>
      </div>
    </div>

    <div v-if="transactions.length === 0" class="py-10 text-center text-nouvo-gray text-[12px]">
      No transactions found
    </div>

    <div v-else>
      <!-- Header Row -->
      <div class="grid grid-cols-[24px_1fr_1.2fr_140px_100px] gap-4 px-3 pb-2 text-[10px] font-bold text-nouvo-gray uppercase tracking-wider border-b border-nouvo-gray-border/30">
        <div></div>
        <div>Customer</div>
        <div>Items</div>
        <div>Phone</div>
        <div class="text-right">Value</div>
      </div>

      <!-- Rows -->
      <div
        v-for="tx in transactions"
        :key="tx.id"
        class="grid grid-cols-[24px_1fr_1.2fr_140px_100px] gap-4 px-3 py-2.5 rounded-xl hover:bg-nouvo-cream/50 transition-colors items-center"
      >
        <div>
          <input type="checkbox" class="cursor-pointer" />
        </div>

        <!-- Customer -->
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-lg bg-nouvo-cream flex items-center justify-center text-[14px] shrink-0">
            👤
          </div>
          <div class="min-w-0">
            <div class="text-[12px] font-bold text-nouvo-ink truncate">
              {{ tx.customer_name || 'Walk-in' }}
            </div>
            <div class="text-[10px] text-nouvo-gray font-mono truncate">
              {{ tx.order_number }}
            </div>
          </div>
        </div>

        <!-- Items -->
        <div class="text-[11px] text-nouvo-gray truncate">
          {{ tx.items_summary || '—' }}
        </div>

        <!-- Phone -->
        <div class="text-[11px] text-nouvo-gray font-mono truncate">
          {{ tx.customer_phone || '—' }}
        </div>

        <!-- Value -->
        <div class="text-right">
          <div class="text-[13px] font-bold text-nouvo-ink">{{ currency }} {{ tx.total.toFixed(0) }}</div>
          <div class="text-[10px] text-nouvo-gray">{{ tx.payment_method === 'cash' ? '💵 Cash' : '💳 Card' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ transactions: any[]; currency: string }>()
</script>
