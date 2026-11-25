interface ContactBody {
  name: string
  email: string
  subject: string
  message: string
  // Honeypot: hidden from people, so only bots fill it in.
  website: string
}

const MAX_LENGTH = { name: 100, email: 200, subject: 200, message: 5000 } as const
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/

function field(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

// Sends contact-form submissions to the Tree Troupe inbox via Resend.
// Requires RESEND_API_KEY (Vercel project env vars); RESEND_FROM sets the
// sender, as for the review emails (server/utils/email.ts).
export default defineEventHandler(async (event) => {
  const body = await readBody<Partial<ContactBody>>(event) ?? {}

  // A bot that filled the honeypot gets the same answer as a person, so it has
  // no reason to try again differently.
  if (field(body.website)) {
    return { success: true }
  }

  const fields = {
    name: field(body.name),
    email: field(body.email),
    // A subject is one line.
    subject: field(body.subject).replace(/\s+/g, ' '),
    message: field(body.message),
  }
  const { name, email, subject, message } = fields

  if (!name || !email || !subject || !message) {
    throw createError({ statusCode: 400, message: 'Name, email, subject, and message are required.' })
  }
  if (!EMAIL_PATTERN.test(email)) {
    throw createError({ statusCode: 400, message: 'Please enter a valid email address.' })
  }
  for (const [key, value] of Object.entries(fields)) {
    const max = MAX_LENGTH[key as keyof typeof MAX_LENGTH]
    if (value.length > max) {
      throw createError({ statusCode: 400, message: `The ${key} can be at most ${max} characters.` })
    }
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw createError({ statusCode: 500, message: 'Email service is not configured.' })
  }

  // Counted only for messages that would be sent, by the visitor's IP (Vercel
  // sets x-forwarded-for).
  await enforceRateLimit(event, 'contact', getRequestIP(event, { xForwardedFor: true }) ?? 'unknown')

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'Tree Troupe Contact Form <onboarding@resend.dev>',
      to: 'treetroupe@protonmail.com',
      reply_to: email,
      subject: `[Contact form] ${subject}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Resend API error:', errorText)
    throw createError({ statusCode: 502, message: 'Failed to send message. Please try again later.' })
  }

  return { success: true }
})
