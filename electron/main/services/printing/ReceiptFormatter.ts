export interface ReceiptData {
  order: any
  items: any[]
  payment: any
  business: any
  receiptSettings: any
}

export class ReceiptFormatter {
  private static readonly LINE_WIDTH = 42

  static formatCustomer(data: ReceiptData): any[] {
    const lines: any[] = []
    const b = data.business
    const r = data.receiptSettings
    const o = data.order

    lines.push({ type: 'feed', lines: 2 })

    if (r.show_logo && b.logo_path) {
      lines.push({ type: 'image', path: b.logo_path, align: 'center', maxWidth: 384 })
      lines.push({ type: 'feed', lines: 1 })
    }

    if (b.name) {
      lines.push({ type: 'text', text: b.name, align: 'center', bold: true, size: 'large' })
    }
    if (b.slogan && b.slogan.trim() && b.slogan !== 'VP') {
      lines.push({ type: 'text', text: b.slogan, align: 'center', size: 'small' })
    }
    if (b.address) {
      lines.push({ type: 'text', text: b.address, align: 'center', size: 'small' })
    }
    const phones = [b.phone_1, b.phone_2].filter(Boolean).join(' / ')
    if (phones) {
      lines.push({ type: 'text', text: `Ph: ${phones}`, align: 'center', size: 'small' })
    }

    lines.push({ type: 'divider' })
    lines.push({ type: 'text', text: 'SALE INVOICE', align: 'center', bold: true })
    lines.push({ type: 'divider' })

    lines.push({ type: 'columns', left: `Invoice #: ${o.invoice_number}`, right: `Date: ${this.formatDate(o.created_at)}` })
    lines.push({ type: 'columns', left: `Order #:   ${o.order_number}`, right: `Time: ${this.formatTime(o.created_at)}` })
    lines.push({ type: 'columns', left: `Type:      ${this.formatOrderType(o.order_type)}`, right: o.table_number ? `Table: ${o.table_number}` : '' })
    if (o.customer_name) lines.push({ type: 'columns', left: `Customer:  ${o.customer_name}`, right: '' })
    if (o.customer_phone) lines.push({ type: 'columns', left: `Phone:     ${o.customer_phone}`, right: '' })

    lines.push({ type: 'divider' })
    lines.push({ type: 'columns', left: 'Item', right: 'Total', bold: true })
    lines.push({ type: 'divider' })

    // ================= ITEMS =================
    for (const item of data.items) {
      const qty = Number(item.quantity) || 1
      const lineTotal = Number(item.line_total) || 0
      const unitPrice = Number(item.unit_price) || 0
      const isDeal = !!item.deal_id

      const qtyStr = `x${qty}`
      const totalStr = lineTotal.toFixed(2)
      const rightBlock = `${qtyStr.padStart(4)}  ${totalStr.padStart(8)}`
      const LEFT_WIDTH = this.LINE_WIDTH - rightBlock.length

      const productName = String(item.product_name || '').trim()
      const nameLines = this.wrapText(productName, LEFT_WIDTH)

      lines.push({
        type: 'columns',
        left: this.padRight(nameLines[0] || '', LEFT_WIDTH),
        right: rightBlock
      })

      for (let i = 1; i < nameLines.length; i++) {
        lines.push({ type: 'text', text: nameLines[i] })
      }

      // Variant (only if NOT a deal)
      if (item.variant_name && !isDeal) {
        lines.push({ type: 'text', text: `(${item.variant_name})`, size: 'small' })
      }

      // Unit price line (only if qty > 1 AND not a deal)
      if (qty > 1 && !isDeal) {
        lines.push({ type: 'text', text: `  @ ${unitPrice.toFixed(2)} each`, size: 'small' })
      }

      // Children of a deal OR modifiers of a product — as "  + Name"
      const childOrMods = item.modifiers || []
      for (const mod of childOrMods) {
        const optionName = String(mod.option_name || '')
        const modPrice = Number(mod.price) > 0 ? `+${Number(mod.price).toFixed(2)}` : ''
        lines.push({
          type: 'columns',
          left: `  + ${optionName}`,
          right: modPrice,
          size: 'small'
        })
      }

      // Notes — only show for normal products (deal child notes suppressed)
      if (!isDeal && item.notes && String(item.notes).trim()) {
        lines.push({ type: 'text', text: `  > ${item.notes}`, size: 'small' })
      }

      // Blank line between items
      lines.push({ type: 'feed', lines: 1 })
    }
    // ================= /ITEMS =================

    lines.push({ type: 'divider' })
    const totalItems = data.items.reduce((s: number, i: any) => s + Number(i.quantity || 0), 0)
    lines.push({ type: 'text', text: `Total Items: ${totalItems}` })
    lines.push({ type: 'divider' })

    lines.push({ type: 'columns', left: 'Sub Total:', right: Number(o.subtotal).toFixed(2) })
    if (o.discount > 0) lines.push({ type: 'columns', left: 'Discount:', right: `-${Number(o.discount).toFixed(2)}` })
    if (o.tax > 0) {
      const taxLabel = b.tax_label || 'Tax'
      const taxRate = b.tax_rate || 0
      lines.push({ type: 'columns', left: `${taxLabel} (${taxRate}%):`, right: Number(o.tax).toFixed(2) })
    }
    if (o.delivery_charge > 0) lines.push({ type: 'columns', left: 'Delivery:', right: Number(o.delivery_charge).toFixed(2) })

    lines.push({ type: 'divider' })
    lines.push({ type: 'columns', left: 'NET TOTAL:', right: Number(o.total).toFixed(2), bold: true, size: 'large' })
    lines.push({ type: 'divider' })

    lines.push({ type: 'text', text: `Payment Method: ${String(o.payment_method).toUpperCase()}` })
    if (o.payment_method === 'cash') {
      lines.push({ type: 'columns', left: 'Amount Received:', right: Number(o.amount_received).toFixed(2) })
      lines.push({ type: 'columns', left: 'Change:', right: Number(o.change).toFixed(2), bold: true })
    }

    lines.push({ type: 'feed', lines: 2 })
    if (r.footer_line_1) lines.push({ type: 'text', text: r.footer_line_1, align: 'center', bold: true })
    if (r.footer_line_2) lines.push({ type: 'text', text: r.footer_line_2, align: 'center' })

    lines.push({ type: 'feed', lines: 1 })
    lines.push({ type: 'text', text: `Print Time: ${this.formatDateTime(new Date())}`, align: 'center', size: 'small' })
    if (o.id) lines.push({ type: 'text', text: `Ref: #${String(o.id).padStart(6, '0')}`, align: 'center', size: 'small' })

    lines.push({ type: 'feed', lines: 4 })
    return lines
  }

  static formatKitchen(data: ReceiptData): any[] {
    const lines: any[] = []
    const o = data.order

    lines.push({ type: 'feed', lines: 2 })
    lines.push({ type: 'text', text: 'KITCHEN COPY', align: 'center', bold: true, size: 'large' })
    lines.push({ type: 'divider' })
    lines.push({ type: 'columns', left: 'Order #:', right: o.order_number })
    lines.push({ type: 'columns', left: 'Type:', right: this.formatOrderType(o.order_type) })
    if (o.table_number) lines.push({ type: 'columns', left: 'Table:', right: o.table_number })
    lines.push({ type: 'columns', left: 'Time:', right: this.formatTime(o.created_at) })
    lines.push({ type: 'divider' })

    for (const item of data.items) {
      const isDeal = !!item.deal_id
      const name = item.variant_name && !isDeal
        ? `${item.product_name} (${item.variant_name})`
        : item.product_name

      lines.push({
        type: 'columns',
        left: `${item.quantity}x  ${name}`,
        right: '',
        bold: true,
        size: 'large'
      })

      for (const mod of item.modifiers || []) {
        lines.push({ type: 'text', text: `     + ${mod.option_name}`, size: 'large' })
      }

      if (!isDeal && item.notes && String(item.notes).trim()) {
        lines.push({ type: 'text', text: `     > ${item.notes}`, size: 'large', bold: true })
      }

      lines.push({ type: 'feed', lines: 1 })
    }

    lines.push({ type: 'divider' })
    const totalItems = data.items.reduce((s: number, i: any) => s + Number(i.quantity || 0), 0)
    lines.push({ type: 'text', text: `Total Items: ${totalItems}`, bold: true })
    lines.push({ type: 'feed', lines: 2 })
    lines.push({ type: 'text', text: '** KITCHEN COPY **', align: 'center', bold: true })
    lines.push({ type: 'feed', lines: 4 })
    return lines
  }

  private static padRight(text: string, width: number): string {
    if (text.length >= width) return text.slice(0, width)
    return text + ' '.repeat(width - text.length)
  }

  private static wrapText(text: string, width: number): string[] {
    if (!text) return ['']
    if (width <= 0) return [text]

    const words = text.split(/\s+/)
    const result: string[] = []
    let current = ''

    for (const word of words) {
      if (word.length > width) {
        if (current) { result.push(current); current = '' }
        let remaining = word
        while (remaining.length > width) {
          result.push(remaining.slice(0, width))
          remaining = remaining.slice(width)
        }
        current = remaining
        continue
      }
      const candidate = current ? `${current} ${word}` : word
      if (candidate.length <= width) current = candidate
      else { if (current) result.push(current); current = word }
    }
    if (current) result.push(current)
    return result.length > 0 ? result : ['']
  }

  static formatDate(iso: string): string {
    const d = new Date(iso)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    return `${dd}-${mm}-${d.getFullYear()}`
  }

  static formatTime(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  static formatDateTime(d: Date): string {
    return d.toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
  }

  static formatOrderType(t: string): string {
    if (t === 'dine_in') return 'Dine-In'
    if (t === 'takeaway') return 'Takeaway'
    if (t === 'delivery') return 'Delivery'
    return t
  }
}
