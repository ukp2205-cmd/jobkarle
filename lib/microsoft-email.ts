import nodemailer from "nodemailer"

interface EmailOptions {
  to: string
  subject: string
  html?: string
  text?: string
  from?: string
}

let transporterInstance: nodemailer.Transporter | null = null

/**
 * Get or create SMTP transporter - simple, proven approach
 */
function getTransporter() {
  if (transporterInstance) {
    console.log("[v0] [microsoft-email.ts] Using cached transporter")
    return transporterInstance
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env

  // Hard fail early if config is missing
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
    throw new Error("Missing SMTP environment variables. Check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD")
  }

  const smtpPort = Number(SMTP_PORT)

  console.log("[v0] [microsoft-email.ts] Creating SMTP transporter with:")
  console.log(`[v0]   Host: ${SMTP_HOST}`)
  console.log(`[v0]   Port: ${smtpPort}`)
  console.log(`[v0]   Secure: ${smtpPort === 465}`)
  console.log(`[v0]   User: ${SMTP_USER}`)

  transporterInstance = nodemailer.createTransport({
    host: SMTP_HOST,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for 587
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  })

  console.log("[v0] [microsoft-email.ts] ✓ Transporter created")

  return transporterInstance
}

/**
 * Send email using SMTP
 */
export async function sendEmailViaMicrosoft(options: EmailOptions): Promise<any> {
  const startTime = Date.now()

  try {
    console.log("\n[v0] ========================================")
    console.log("[v0] [microsoft-email.ts] STARTING EMAIL SEND")
    console.log("[v0] ========================================")

    if (!options.to || !options.subject) {
      throw new Error("Missing required email fields: to, subject")
    }

    console.log(`[v0] Recipient: ${options.to}`)
    console.log(`[v0] Subject: ${options.subject}`)
    console.log(`[v0] HTML length: ${(options.html || "").length} chars`)

    // Get transporter
    console.log("[v0] [STEP 1] Getting SMTP transporter...")
    const smtpTransporter = getTransporter()

    if (!smtpTransporter) {
      throw new Error("Failed to create SMTP transporter")
    }

    console.log("[v0] [STEP 1] ✓ Transporter ready")

    // Prepare mail options
    console.log("[v0] [STEP 2] Preparing email...")
    const fromEmail = process.env.SMTP_FROM_EMAIL
    const fromName = process.env.SMTP_FROM_NAME || "JobKarle"

    if (!fromEmail) {
      throw new Error("Missing SMTP_FROM_EMAIL environment variable")
    }

    const mailOptions = {
      from: `${fromName} <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html || "",
      text: options.text || "",
    }
    console.log(`[v0] [STEP 2] ✓ From: ${mailOptions.from}`)

    // Send email
    console.log("[v0] [STEP 3] Sending email via SMTP...")
    const info = await smtpTransporter.sendMail(mailOptions)
    console.log("[v0] [STEP 3] ✓ Email sent")

    const duration = Date.now() - startTime

    console.log("[v0] ========================================")
    console.log("[v0] ✓ EMAIL SENT SUCCESSFULLY")
    console.log("[v0] ========================================")
    console.log(`[v0] Message ID: ${info.messageId}`)
    console.log(`[v0] Response: ${info.response}`)
    console.log(`[v0] Duration: ${duration}ms`)

    return {
      success: true,
      messageId: info.messageId,
      message: "Email sent successfully",
    }
  } catch (error: any) {
    const duration = Date.now() - startTime

    console.error("[v0] ========================================")
    console.error("[v0] ✗ EMAIL SEND FAILED")
    console.error("[v0] ========================================")
    console.error(`[v0] Error Type: ${error.name}`)
    console.error(`[v0] Error Message: ${error.message}`)
    console.error(`[v0] Duration before error: ${duration}ms`)

    return {
      success: false,
      error: error.message,
      code: error.code,
      name: error.name,
    }
  }
}
