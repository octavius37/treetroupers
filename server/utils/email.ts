interface Email {
  to: string
  subject: string
  text: string
}

/**
 * Sends an email through Resend, if it is configured. Returns whether it was
 * sent; never throws, because a notification failing must not undo the action
 * that caused it.
 *
 * RESEND_API_KEY enables sending. RESEND_FROM is the sender, and must be on a
 * domain verified in Resend: the default test sender, onboarding@resend.dev,
 * can only deliver to the Resend account owner's own address.
 */
export async function sendEmail({ to, subject, text }: Email): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) { return false }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'Tree Troupe <onboarding@resend.dev>',
        to,
        subject,
        text,
      }),
    })
    if (!response.ok) {
      console.error('Resend API error:', await response.text())
      return false
    }
    return true
  }
  catch (error) {
    console.error('Could not send email:', error)
    return false
  }
}
