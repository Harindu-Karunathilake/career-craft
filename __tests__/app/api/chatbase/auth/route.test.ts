/**
 * @jest-environment node
 */
import { POST } from '@/app/api/chatbase/auth/route'
import { adminAuth } from '@/lib/firebase-admin'
import jwt from 'jsonwebtoken'

jest.mock('@/lib/firebase-admin', () => ({
  adminAuth: jest.fn(),
}))

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}))

const originalEnv = process.env

describe('Chatbase Auth API', () => {
  let verifyIdTokenMock: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    verifyIdTokenMock = jest.fn()
    ;(adminAuth as jest.Mock).mockReturnValue({ verifyIdToken: verifyIdTokenMock })
    process.env = { ...originalEnv, CHATBOT_IDENTITY_SECRET: 'super-secret' }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('fails with 401 on missing auth header', async () => {
    const req = new Request('http://localhost', { method: 'POST' })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('returns standard token structure when valid JWT succeeds', async () => {
    verifyIdTokenMock.mockResolvedValue({ uid: 'usr123', email: 'me@example.com' })
    ;(jwt.sign as jest.Mock).mockReturnValue('cb-jwt-token')

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { Authorization: 'Bearer firebase-token' }
    })
    
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.token).toBe('cb-jwt-token')
  })
})
