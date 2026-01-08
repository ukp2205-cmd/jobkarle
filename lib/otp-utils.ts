import bcrypt from "bcryptjs"

/**
 * Generate a random 6-digit OTP
 */
export function generateOTP(): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  return otp
}

/**
 * Hash OTP using bcrypt
 */
export async function hashOTP(otp: string): Promise<string> {
  const saltRounds = 10
  const hash = await bcrypt.hash(otp, saltRounds)
  return hash
}

/**
 * Verify OTP against hash
 */
export async function verifyOTP(otp: string, hash: string): Promise<boolean> {
  const isValid = await bcrypt.compare(otp, hash)
  return isValid
}

/**
 * Format phone number to ensure +91 prefix
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, "")

  // If it starts with 91, add +
  if (cleaned.startsWith("91") && cleaned.length === 12) {
    return `+${cleaned}`
  }

  // If it's 10 digits, add +91
  if (cleaned.length === 10) {
    return `+91${cleaned}`
  }

  // If it already has +91, return as is
  if (phone.startsWith("+91")) {
    return phone
  }

  return `+91${cleaned}`
}

/**
 * Validate Indian phone number format
 */
export function isValidIndianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "")

  // Check if it's 10 digits or 12 digits with 91 prefix
  if (cleaned.length === 10) {
    return /^[6-9]\d{9}$/.test(cleaned)
  }

  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return /^91[6-9]\d{9}$/.test(cleaned)
  }

  return false
}
