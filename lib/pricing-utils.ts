/**
 * Pricing utility functions for calculating costs with GST and bulk discounts
 * These are pure calculation functions that don't require database access
 */

/**
 * Calculate price with 18% GST
 */
export function calculatePriceWithGST(basePrice: number) {
  const gstAmount = Math.round(basePrice * 0.18 * 100) / 100
  const totalPrice = basePrice + gstAmount

  return {
    basePrice,
    gstAmount,
    totalPrice,
  }
}

/**
 * Calculate pricing with 10% discount for 3+ jobs
 */
export function calculateBulkPricing(quantity: number, unitPrice: number) {
  const discountPercentage = quantity >= 3 ? 0.1 : 0
  const subtotal = unitPrice * quantity
  const discountAmount = Math.round(subtotal * discountPercentage * 100) / 100
  const finalSubtotal = subtotal - discountAmount
  const gstAmount = Math.round(finalSubtotal * 0.18 * 100) / 100
  const totalPrice = finalSubtotal + gstAmount

  return {
    quantity,
    unitPrice,
    discountPercentage,
    discountAmount,
    subtotal: finalSubtotal,
    gstAmount,
    totalPrice,
  }
}
