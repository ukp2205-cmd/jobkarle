import { connect } from "net"

interface SMTPOptions {
  host: string
  port: number
  user: string
  password: string
  secure: boolean
}

interface EmailOptions {
  from: string
  to: string
  subject: string
  html: string
}

export async function sendEmailViaSMTP(emailOptions: EmailOptions, smtpOptions: SMTPOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = connect({
      host: smtpOptions.host,
      port: smtpOptions.port,
    })

    let buffer = ""
    const commands: string[] = []
    let commandIndex = 0

    const base64Encode = (str: string) => Buffer.from(str).toString("base64")

    // Build SMTP commands
    commands.push(`EHLO ${smtpOptions.host}`)
    commands.push(`AUTH LOGIN`)
    commands.push(base64Encode(smtpOptions.user))
    commands.push(base64Encode(smtpOptions.password))
    commands.push(`MAIL FROM:<${emailOptions.from}>`)
    commands.push(`RCPT TO:<${emailOptions.to}>`)
    commands.push(`DATA`)
    commands.push(
      `From: ${emailOptions.from}\r\nTo: ${emailOptions.to}\r\nSubject: ${emailOptions.subject}\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=utf-8\r\n\r\n${emailOptions.html}`,
    )
    commands.push(`.`)
    commands.push(`QUIT`)

    socket.on("connect", () => {
      console.log("[v0] SMTP Connected")
    })

    socket.on("data", (data) => {
      buffer += data.toString()
      const lines = buffer.split("\r\n")

      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i]
        console.log("[v0] SMTP Response:", line)

        if (line.match(/^220|^250|^334|^354|^235/)) {
          if (commandIndex < commands.length) {
            const command = commands[commandIndex]
            console.log("[v0] Sending command:", command.substring(0, 50))
            socket.write(`${command}\r\n`)
            commandIndex++
          }
        }

        if (line.match(/^550/)) {
          reject(new Error(`SMTP Error: ${line}`))
          socket.destroy()
        }

        if (line.match(/^221/)) {
          resolve()
          socket.destroy()
        }
      }

      buffer = lines[lines.length - 1]
    })

    socket.on("error", (error) => {
      console.error("[v0] SMTP Error:", error.message)
      reject(error)
    })

    socket.on("end", () => {
      console.log("[v0] SMTP Connection ended")
    })

    socket.setTimeout(30000, () => {
      reject(new Error("SMTP connection timeout"))
      socket.destroy()
    })
  })
}
