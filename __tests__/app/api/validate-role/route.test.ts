/**
 * @jest-environment node
 */
import { POST } from '@/app/api/validate-role/route'
import { generateObject } from 'ai'

jest.mock('ai', () => ({
  generateObject: jest.fn(),
}))

jest.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: jest.fn(() => jest.fn()),
  google: jest.fn(),
}))

const originalEnv = process.env

describe('Validate Role API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv, GOOGLE_GENERATIVE_AI_API_KEY: 'test-api-key' }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('returns 500 when API key is missing', async () => {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY
    const req = new Request('http://localhost/api/validate-role', {
      method: 'POST',
      body: JSON.stringify({ role: 'Software Engineer' }),
    })
    const res = await POST(req)
    
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('Configuration Error')
  })

  it('returns 400 when role is omitted from request body', async () => {
    const req = new Request('http://localhost/api/validate-role', {
      method: 'POST',
      body: JSON.stringify({}), // empty role
    })
    const res = await POST(req)
    
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Role is required')
  })

  it('returns valid true output on valid IT role', async () => {
    // Mock the AI module response
    ;(generateObject as jest.Mock).mockResolvedValue({
      object: { isValid: true, message: 'Role is valid IT role' }
    })

    const req = new Request('http://localhost/api/validate-role', {
      method: 'POST',
      body: JSON.stringify({ role: 'Software Engineer' }),
    })
    
    const res = await POST(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(generateObject).toHaveBeenCalledTimes(1)
    expect(json.isValid).toBe(true)
    expect(json.message).toBe('Role is valid IT role')
  })

  it('handles validation failure gracefully on unhandled errors', async () => {
    // Mock standard hard-failure from AI engine
    ;(generateObject as jest.Mock).mockRejectedValue(new Error('Unknown Error'))

    const req = new Request('http://localhost/api/validate-role', {
      method: 'POST',
      body: JSON.stringify({ role: 'Gardener' }),
    })
    
    // As observed in route.ts, it fails open to avoid blocking
    const res = await POST(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.isValid).toBe(true)
    expect(json.message).toBe('Validation service unavailable, proceeding with caution.')
  })
})
