/**
 * @jest-environment node
 */
import { POST } from '@/app/api/auth/forgot-password/route'
import { adminAuth } from '@/lib/firebase-admin'
import { sendEmail } from '@/lib/mail'

jest.mock('@/lib/firebase-admin', () => ({
  adminAuth: jest.fn(),
}))

jest.mock('@/lib/mail', () => ({
  sendEmail: jest.fn(),
}))

describe('Forgot Password API Route', () => {
  let generatePasswordResetLinkMock: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    generatePasswordResetLinkMock = jest.fn()
    ;(adminAuth as jest.Mock).mockReturnValue({
      generatePasswordResetLink: generatePasswordResetLinkMock,
    })
  })

  it('returns 400 for invalid email shape', async () => {
    const req = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'not-an-email' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Invalid email address')
  })

  it('handles auth/user-not-found cleanly without revealing status explicitly', async () => {
    generatePasswordResetLinkMock.mockRejectedValue({ code: 'auth/user-not-found' })
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ email: 'fake@example.com' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200) // Expect 200 per route logic
    const json = await res.json()
    expect(json.message).toBe('If an account exists, a reset email has been sent.')
  })

  it('returns 200 on successful generation and email delivery', async () => {
    generatePasswordResetLinkMock.mockResolvedValue('http://reset-link')
    ;(sendEmail as jest.Mock).mockResolvedValue({ success: true })

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toBe('Password reset email sent')
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'user@example.com' }))
  })
})
