<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center border-2 border-nouvo-green/30">

      <div class="w-16 h-16 rounded-full bg-nouvo-green text-white flex items-center justify-center mx-auto mb-4">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>

      <h2 class="text-[20px] font-bold text-nouvo-green mb-2">Order Placed!</h2>
      <p class="text-[13px] text-nouvo-gray mb-6">Order has been successfully recorded</p>

      <div class="bg-nouvo-cream rounded-2xl p-4 mb-6 text-left space-y-2">
        <div class="flex justify-between text-[13px]">
          <span class="text-nouvo-gray">Order #</span>
          <span class="font-mono font-semibold text-nouvo-ink">{{ order.order.order_number }}</span>
        </div>
        <div class="flex justify-between text-[13px]">
          <span class="text-nouvo-gray">Invoice #</span>
          <span class="font-mono font-semibold text-nouvo-ink">{{ order.order.invoice_number }}</span>
        </div>
        <div class="flex justify-between text-[14px] pt-2 border-t border-nouvo-green/20">
          <span class="text-nouvo-gray">Total</span>
          <span class="font-bold text-nouvo-green">{{ order.order.total.toFixed(1) }}</span>
        </div>
        <div v-if="order.order.payment_method === 'cash'" class="flex justify-between text-[13px]">
          <span class="text-nouvo-gray">Change</span>
          <span class="font-bold text-nouvo-green">{{ order.order.change.toFixed(1) }}</span>
        </div>
      </div>

      <!-- Reprint Buttons -->
      <div class="grid grid-cols-2 gap-2 mb-4">
        <button
          class="cursor-pointer bg-white border-2 border-nouvo-green/30 text-nouvo-green rounded-full py-2.5 text-[12px] font-bold hover:bg-nouvo-cream transition-colors flex items-center justify-center gap-1.5"
          @click="$emit('reprint', 'customer')"
        >
          🖨 Customer
        </button>
        <button
          class="cursor-pointer bg-white border-2 border-nouvo-green/30 text-nouvo-green rounded-full py-2.5 text-[12px] font-bold hover:bg-nouvo-cream transition-colors flex items-center justify-center gap-1.5"
          @click="$emit('reprint', 'kitchen')"
        >
          🍳 Kitchen
        </button>
      </div>

      <div class="flex gap-3">
        <button
          class="cursor-pointer flex-1 bg-white border-2 border-nouvo-green/30 text-nouvo-green rounded-full py-3 text-[13px] font-bold hover:bg-nouvo-cream transition-colors"
          @click="$emit('close')"
        >Close</button>
        <button
          class="cursor-pointer flex-1 bg-nouvo-green text-white rounded-full py-3 text-[13px] font-bold hover:bg-nouvo-green-dark transition-colors"
          @click="$emit('new-order')"
        >New Order</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ order: any }>()
defineEmits<{ close: []; 'new-order': []; reprint: [string] }>()
</script>
