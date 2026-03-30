/**
 * @jest-environment node
 */
import { POST } from '@/app/api/contact/route'
import { adminDb } from '@/lib/firebase-admin'
import { sendEmail } from '@/lib/mail'

// Mock Firebase
jest.mock('@/lib/firebase-admin', () => {
  const mAdd = jest.fn(() => Promise.resolve({ id: 'mock-id' }))
  const mCollection = jest.fn(() => ({ add: mAdd }))
  return {
    adminDb: jest.fn(() => ({ collection: mCollection })),
  }
})

// Mock Email Service
jest.mock('@/lib/mail', () => ({
  sendEmail: jest.fn(() => Promise.resolve()),
}))

// We need to provide dummy env variables expected by route
const originalEnv = process.env
beforeEach(() => {
  jest.clearAllMocks()
  process.env = { ...originalEnv, SMTP_USER: 'support@example.com' }
})

afterEach(() => {
  process.env = originalEnv
})

describe('Contact API Route', () => {
  it('returns 400 for missing fields', async () => {
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }), // Missing email, topic, message
    })

    // NextRequest extends Request, so passing a Request object often works seamlessly in tests
    const response = await POST(req as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required fields')
  })

  it('returns 200 and success id for valid contact submission', async () => {
    const payload = {
      name: 'John Doe',
      email: 'john@example.com',
      topic: 'Support',
      message: 'Hello world',
    }

    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const response = await POST(req as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.id).toBe('mock-id')

    // Verify mocks were invoked
    expect(adminDb().collection).toHaveBeenCalledWith('contact_messages')
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'support@example.com',
        subject: 'New Contact Form Submission: Support',
      })
    )
  })
})
