<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
    <div class="bg-white rounded-card shadow-card-hover w-full max-w-3xl max-h-[90vh] flex flex-col">
      <header class="flex items-center justify-between px-6 py-4 border-b border-nouvo-gray-border">
        <div>
          <h2 class="text-lg font-bold text-nouvo-green">
            {{ productId ? 'Edit' : duplicateFrom ? 'Duplicate Product' : 'New' }} Product
          </h2>
          <p v-if="duplicateFrom" class="text-[11px] text-nouvo-gray mt-0.5">
            Copying from: {{ duplicateFrom.name }}
          </p>
        </div>
        <button type="button" class="cursor-pointer w-8 h-8 rounded-lg hover:bg-nouvo-cream text-nouvo-gray" @click="$emit('close')">✕</button>
      </header>

      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- Basic Info -->
        <section>
          <h3 class="text-sm font-bold text-nouvo-green mb-3">Basic Info</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NInput v-model="form.product.name" label="Name" required />
            <NSelect v-model.number="form.product.category_id" label="Category" :options="categoryOptions" required />
            <NInput v-model.number="form.product.price" label="Base Price" type="number" required />

            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-nouvo-ink mb-1.5">Image</label>
              <div class="flex items-center gap-3">
                <img v-if="form.product.image_path" :src="fileUrl(form.product.image_path)" class="w-20 h-20 object-contain rounded-lg border border-nouvo-gray-border bg-white" />
                <div v-else class="w-20 h-20 rounded-lg border border-dashed border-nouvo-gray-border flex items-center justify-center text-nouvo-gray text-xs">No Image</div>
                <NButton variant="secondary" size="sm" @click="pickImage">Choose Image</NButton>
                <NButton v-if="form.product.image_path" variant="ghost" size="sm" @click="form.product.image_path = ''">Remove</NButton>
              </div>
            </div>

            <div class="md:col-span-2">
              <NCheckbox v-model="form.product.is_active" label="Active" />
            </div>
          </div>
        </section>

        <!-- Variants -->
        <section>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-nouvo-green">Variants (Sizes / Flavours)</h3>
            <NButton size="sm" variant="secondary" @click="addVariant">+ Add Variant</NButton>
          </div>
          <p v-if="form.variants.length === 0" class="text-xs text-nouvo-gray">No variants.</p>
          <div class="space-y-2">
            <div v-for="(v, i) in form.variants" :key="i" class="flex items-center gap-2 p-2 bg-nouvo-cream rounded-lg">
              <input v-model="v.name" placeholder="Name (e.g. Small)" class="flex-1 px-3 py-2 border border-nouvo-gray-border rounded-lg text-sm outline-none focus:border-nouvo-green" />
              <input v-model.number="v.price_adjust" type="number" placeholder="+/-" class="w-24 px-3 py-2 border border-nouvo-gray-border rounded-lg text-sm outline-none focus:border-nouvo-green" />
              <label class="flex items-center gap-1 text-xs cursor-pointer">
                <input type="checkbox" v-model="v.is_default" class="cursor-pointer" />
                Default
              </label>
              <button type="button" class="cursor-pointer w-8 h-8 rounded hover:bg-nouvo-red/10 text-nouvo-red" @click="form.variants.splice(i, 1)">✕</button>
            </div>
          </div>
        </section>

        <!-- Modifiers -->
        <section>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-nouvo-green">Modifiers (Add-ons)</h3>
            <NButton size="sm" variant="secondary" @click="addModifier">+ Add Modifier</NButton>
          </div>
          <p v-if="form.modifiers.length === 0" class="text-xs text-nouvo-gray">No modifiers.</p>
          <div class="space-y-3">
            <div v-for="(m, mi) in form.modifiers" :key="mi" class="p-3 bg-nouvo-cream rounded-lg">
              <div class="flex items-center gap-2 mb-2">
                <input v-model="m.name" placeholder="Modifier name" class="flex-1 px-3 py-2 border border-nouvo-gray-border rounded-lg text-sm outline-none focus:border-nouvo-green" />
                <label class="flex items-center gap-1 text-xs cursor-pointer">
                  <input type="checkbox" v-model="m.is_required" class="cursor-pointer" />
                  Required
                </label>
                <label class="flex items-center gap-1 text-xs cursor-pointer">
                  <input type="checkbox" v-model="m.is_multiple" class="cursor-pointer" />
                  Multi
                </label>
                <button type="button" class="cursor-pointer w-8 h-8 rounded hover:bg-nouvo-red/10 text-nouvo-red" @click="form.modifiers.splice(mi, 1)">✕</button>
              </div>
              <div class="pl-4 space-y-1">
                <div v-for="(o, oi) in m.options" :key="oi" class="flex items-center gap-2">
                  <input v-model="o.name" placeholder="Option name" class="flex-1 px-3 py-1.5 border border-nouvo-gray-border rounded-lg text-xs outline-none focus:border-nouvo-green" />
                  <input v-model.number="o.price" type="number" placeholder="Price" class="w-24 px-3 py-1.5 border border-nouvo-gray-border rounded-lg text-xs outline-none focus:border-nouvo-green" />
                  <label class="flex items-center gap-1 text-xs cursor-pointer">
                    <input type="checkbox" v-model="o.is_default" class="cursor-pointer" />
                    Default
                  </label>
                  <button type="button" class="cursor-pointer w-7 h-7 rounded hover:bg-nouvo-red/10 text-nouvo-red text-xs" @click="m.options.splice(oi, 1)">✕</button>
                </div>
                <NButton size="sm" variant="ghost" @click="m.options.push({ name: '', price: 0, is_default: false })">+ Add Option</NButton>
              </div>
            </div>
          </div>
        </section>

        <p v-if="error" class="text-[12px] text-nouvo-red bg-red-50 px-3 py-2 rounded-lg">{{ error }}</p>
      </div>

      <footer class="flex justify-end gap-2 px-6 py-4 border-t border-nouvo-gray-border">
        <NButton variant="secondary" @click="$emit('close')">Cancel</NButton>
        <NButton :loading="saving" @click="save">
          {{ saving ? 'Saving...' : 'Save Product' }}
        </NButton>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { invokeSafe } from '@/utils/ipc'
import NInput from '@/components/ui/NInput.vue'
import NSelect from '@/components/ui/NSelect.vue'
import NButton from '@/components/ui/NButton.vue'
import NCheckbox from '@/components/ui/NCheckbox.vue'

const props = defineProps<{
  productId?: number | null
  categoryId?: number | null
  duplicateFrom?: any | null   // ← NEW: duplicate source
}>()

const emit = defineEmits<{ close: []; saved: [] }>()

const categories = ref<any[]>([])
const saving = ref(false)
const error = ref('')

const form = ref({
  product: {
    name: '',
    category_id: props.categoryId ?? 0,
    price: 0,
    image_path: '',
    is_active: true,
    has_variants: false,
    has_modifiers: false
  },
  variants: [] as any[],
  modifiers: [] as any[]
})

const categoryOptions = computed(() =>
  categories.value.map((c) => ({ value: c.id, label: c.name }))
)

async function loadCategories() {
  const res = await invokeSafe<any>('menu:categories:list', false)
  if (res.ok) categories.value = res.data || []
}

async function loadProduct() {
  if (!props.productId) return
  const res = await invokeSafe<any>('menu:products:getFull', props.productId)
  if (res.ok && res.data) {
    form.value.product = {
      ...res.data.product,
      image_path: res.data.product.image_path || '',
      is_active: !!res.data.product.is_active,
      has_variants: !!res.data.product.has_variants,
      has_modifiers: !!res.data.product.has_modifiers
    }
    form.value.variants = (res.data.variants || []).map((v: any) => ({
      name: v.name,
      price_adjust: v.price_adjust,
      is_default: !!v.is_default
    }))
    form.value.modifiers = (res.data.modifiers || []).map((m: any) => ({
      name: m.name,
      is_required: !!m.is_required,
      is_multiple: !!m.is_multiple,
      options: (m.options || []).map((o: any) => ({
        name: o.name,
        price: o.price,
        is_default: !!o.is_default
      }))
    }))
  }
}

/**
 * Duplicate mode — copy from an existing product.
 * Name gets " (Copy)" suffix so user can rename.
 */
async function loadDuplicate() {
  if (!props.duplicateFrom) return
  const src = props.duplicateFrom

  // Fetch full product details
  const res = await invokeSafe<any>('menu:products:getFull', src.id)
  if (res.ok && res.data) {
    form.value.product = {
      ...res.data.product,
      name: `${res.data.product.name} (Copy)`,   // ← Auto-suffix
      image_path: res.data.product.image_path || '',
      is_active: true,                            // ← New product active by default
      has_variants: !!res.data.product.has_variants,
      has_modifiers: !!res.data.product.has_modifiers
    }
    form.value.variants = (res.data.variants || []).map((v: any) => ({
      name: v.name,
      price_adjust: v.price_adjust,
      is_default: !!v.is_default
    }))
    form.value.modifiers = (res.data.modifiers || []).map((m: any) => ({
      name: m.name,
      is_required: !!m.is_required,
      is_multiple: !!m.is_multiple,
      options: (m.options || []).map((o: any) => ({
        name: o.name,
        price: o.price,
        is_default: !!o.is_default
      }))
    }))
  }
}

function addVariant() {
  form.value.variants.push({ name: '', price_adjust: 0, is_default: false })
}

function addModifier() {
  form.value.modifiers.push({ name: '', is_required: false, is_multiple: true, options: [] })
}

async function pickImage() {
  const res = await invokeSafe<any>('menu:images:pick')
  if (res.ok && res.data) {
    form.value.product.image_path = res.data
  }
}

async function save() {
  if (!form.value.product.name.trim()) { error.value = 'Name required'; return }
  if (!form.value.product.category_id) { error.value = 'Category required'; return }

  saving.value = true
  error.value = ''

  const payload = {
    product: {
      ...form.value.product,
      image_path: form.value.product.image_path || '',
      has_variants: form.value.variants.length > 0,
      has_modifiers: form.value.modifiers.length > 0
    },
    variants: form.value.variants
      .filter((v) => v.name.trim())
      .map((v) => ({
        name: v.name || '',
        price_adjust: Number(v.price_adjust) || 0,
        is_default: !!v.is_default
      })),
    modifiers: form.value.modifiers
      .filter((m) => m.name.trim())
      .map((m) => ({
        name: m.name || '',
        is_required: !!m.is_required,
        is_multiple: !!m.is_multiple,
        options: m.options
          .filter((o: any) => o.name.trim())
          .map((o: any) => ({
            name: o.name || '',
            price: Number(o.price) || 0,
            is_default: !!o.is_default
          }))
      }))
  }

  const res = await invokeSafe<any>('menu:products:upsertFull', payload)
  saving.value = false

  if (res.ok) {
    emit('saved')
  } else {
    error.value = res.error?.message || 'Save failed'
  }
}

function fileUrl(p: string): string {
  if (!p) return ''
  const normalized = p.replace(/\\/g, '/')
  const prefix = normalized.startsWith('/') ? 'file://' : 'file:///'
  return `${prefix}${normalized}`
}

onMounted(async () => {
  await loadCategories()
  if (props.productId) {
    await loadProduct()
  } else if (props.duplicateFrom) {
    await loadDuplicate()
  }
})
</script>
