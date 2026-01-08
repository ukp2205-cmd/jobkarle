import * as net from "net"
import * as tls from "tls"

interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmailRawSMTP(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const { to, subject, html, from } = options

  const smtpHost = process.env.SMTP_HOST || "smtp.zoho.in"
  const smtpPort = Number.parseInt(process.env.SMTP_PORT || "587")
  const smtpUser = process.env.SMTP_USER || ""
  const smtpPassword = process.env.SMTP_PASSWORD || ""
  const smtpFrom = from || process.env.SMTP_FROM_EMAIL || smtpUser
  const smtpFromName = process.env.SMTP_FROM_NAME || "JobKarle"

  console.log(`[v0] Raw SMTP: Connecting to ${smtpHost}:${smtpPort}`)

  return new Promise((resolve, reject) => {
    // Create TCP socket connection
    const socket = net.createConnection(smtpPort, smtpHost)
    let isSecure = false
    let currentSocket: net.Socket | tls.TLSSocket = socket

    const responses: string[] = []
    let buffer = ""

    const sendCommand = (command: string): Promise<string> => {
      return new Promise((resolveCmd, rejectCmd) => {
        console.log(`[v0] SMTP > ${command.replace(smtpPassword, "***")}`)

        const timeout = setTimeout(() => {
          rejectCmd(new Error("SMTP command timeout"))
        }, 30000)

        const onData = (data: Buffer) => {
          buffer += data.toString()
          const lines = buffer.split("\r\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            console.log(`[v0] SMTP < ${line}`)
            responses.push(line)

            // Check if this is a final response (format: "250 OK" or "250-Continue")
            if (/^\d{3} /.test(line)) {
              clearTimeout(timeout)
              currentSocket.removeListener("data", onData)
              resolveCmd(line)
              return
            }
          }
        }

        currentSocket.on("data", onData)
        currentSocket.write(command + "\r\n")
      })
    }

    socket.on("error", (err) => {
      console.error("[v0] SMTP socket error:", err)
      reject({ success: false, error: err.message })
    })

    socket.on("connect", async () => {
      console.log("[v0] SMTP: Connected to server")

      try {
        // Wait for server greeting (220)
        await sendCommand("")

        // Send EHLO
        await sendCommand(`EHLO ${smtpHost}`)

        await sendCommand("STARTTLS")

        console.log("[v0] SMTP: Starting TLS encryption...")

        // Upgrade to TLS
        const tlsSocket = tls.connect({
          socket: currentSocket as net.Socket,
          servername: smtpHost,
          rejectUnauthorized: false,
        })

        currentSocket = tlsSocket
        isSecure = true

        // Wait for TLS handshake
        await new Promise<void>((resolveTLS) => {
          tlsSocket.once("secureConnect", () => {
            console.log("[v0] SMTP: TLS connection established")
            resolveTLS()
          })
        })

        // Send EHLO again after TLS
        await sendCommand(`EHLO ${smtpHost}`)

        await sendCommand("AUTH LOGIN")
        await sendCommand(Buffer.from(smtpUser).toString("base64"))
        await sendCommand(Buffer.from(smtpPassword).toString("base64"))

        console.log("[v0] SMTP: Authentication successful")

        await sendCommand(`MAIL FROM:<${smtpFrom}>`)
        await sendCommand(`RCPT TO:<${to}>`)
        await sendCommand("DATA")

        const emailContent = [
          `From: ${smtpFromName} <${smtpFrom}>`,
          `To: ${to}`,
          `Subject: ${subject}`,
          "MIME-Version: 1.0",
          "Content-Type: text/html; charset=UTF-8",
          "",
          html,
          ".",
        ].join("\r\n")

        await sendCommand(emailContent)

        // Quit
        await sendCommand("QUIT")

        console.log("[v0] SMTP: Email sent successfully")
        currentSocket.end()
        resolve({ success: true })
      } catch (error) {
        console.error("[v0] SMTP: Error during email send:", error)
        currentSocket.end()
        reject({ success: false, error: error instanceof Error ? error.message : String(error) })
      }
    })
  })
}
