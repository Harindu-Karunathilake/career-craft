/**
 * @jest-environment node
 */
import { POST } from '@/app/api/chat/route'
import { streamText } from 'ai'
import { google } from '@ai-sdk/google'

jest.mock('ai', () => ({
  streamText: jest.fn(),
  tool: jest.fn(),
}))

jest.mock('@ai-sdk/google', () => ({
  google: jest.fn(),
}))

const originalEnv = process.env

describe('Chat API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv, GOOGLE_GENERATIVE_AI_API_KEY: 'test-key' }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('fails with 500 when API key is missing', async () => {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY
    const req = new Request('http://localhost/api/chat', { method: 'POST', body: JSON.stringify({}) })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  it('successfully delegates to streamText', async () => {
    ;(streamText as jest.Mock).mockReturnValue({
      toTextStreamResponse: () => new Response('mock-stream', { status: 200 }),
    })

    const req = new Request('http://localhost/api/chat', { 
        method: 'POST', 
        body: JSON.stringify({ messages: [{ role: 'user', content: 'test' }] }) 
    })
    const res = await POST(req)
    
    expect(streamText).toHaveBeenCalled()
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toBe('mock-stream')
  })
})
