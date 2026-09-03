interface ContactBody {
  name: string
  email: string
  subject: string
  message: string
}

// Sends contact-form submissions to the Tree Troupe inbox via Resend.
// Requires RESEND_API_KEY to be set (Vercel project env vars).
export default defineEventHandler(async (event) => {
  const body = await readBody<Partial<ContactBody>>(event)

  if (!body.name || !body.email || !body.subject || !body.message) {
    throw createError({ statusCode: 400, message: 'Name, email, subject, and message are required.' })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw createError({ statusCode: 500, message: 'Email service is not configured.' })
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Tree Troupe Contact Form <onboarding@resend.dev>',
      to: 'treetroupe@protonmail.com',
      reply_to: body.email,
      subject: `[Contact form] ${body.subject}`,
      text: `From: ${body.name} <${body.email}>\n\n${body.message}`,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Resend API error:', errorText)
    throw createError({ statusCode: 502, message: 'Failed to send message. Please try again later.' })
  }

  return { success: true }
})
