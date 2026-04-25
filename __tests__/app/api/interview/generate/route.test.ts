/**
 * @jest-environment node
 */
import { POST } from '@/app/api/interview/generate/route'
import { cacheGet, cacheSet } from '@/lib/redis'
import { generateObject } from 'ai'

jest.mock('@/lib/redis', () => ({
  cacheGet: jest.fn(),
  cacheSet: jest.fn(),
}))

jest.mock('ai', () => ({
  generateObject: jest.fn(),
}))

jest.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: jest.fn(() => jest.fn()),
  google: jest.fn(),
}))

const originalEnv = process.env

describe('Interview Generate API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv, GOOGLE_GENERATIVE_AI_API_KEY: 'test' }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('returns cached result immediately on cache hit', async () => {
    const cachedResponse = JSON.stringify({ questions: ['Q1'] })
    ;(cacheGet as jest.Mock).mockResolvedValue(cachedResponse)

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ role: 'SE', experience: 'Junior', questionCount: 1 })
    })
    
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('X-Cache')).toBe('HIT')

    const json = await res.json()
    expect(json.questions).toEqual(['Q1'])
    expect(generateObject).not.toHaveBeenCalled()
  })

  it('calls AI and sets cache on miss', async () => {
    ;(cacheGet as jest.Mock).mockResolvedValue(null)
    ;(generateObject as jest.Mock).mockResolvedValue({ object: { questions: ['Q2'] } })

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ role: 'SE', experience: 'Junior', questionCount: 1 })
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('X-Cache')).toBe('MISS')
    
    const json = await res.json()
    expect(json.questions).toEqual(['Q2'])
    
    expect(generateObject).toHaveBeenCalled()
    expect(cacheSet).toHaveBeenCalled()
  })
})
