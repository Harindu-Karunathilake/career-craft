/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/jobs/route'

// Mock the global fetch
global.fetch = jest.fn()

const originalEnv = process.env

describe('Jobs API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv, FINDWORK_API_KEY: 'test-api-key' }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('returns 500 when FINDWORK_API_KEY is missing', async () => {
    delete process.env.FINDWORK_API_KEY
    const req = new NextRequest('http://localhost/api/jobs')
    const res = await GET(req)
    
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('Server Configuration Error: Missing Jobs API Key')
  })

  it('assembles the URL correctly and fetches data from the upstream API', async () => {
    const mockData = { results: [{ id: 1, title: 'Software Engineer' }] }
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    })

    const req = new NextRequest('http://localhost/api/jobs?search=react&location=remote&remote=true&page=2')
    const res = await GET(req)

    expect(global.fetch).toHaveBeenCalledTimes(1)
    
    // Check if fetch was called with the assembled query params
    const fetchCallUrl = (global.fetch as jest.Mock).mock.calls[0][0] // First param of first call
    const urlObj = new URL(fetchCallUrl)
    
    expect(urlObj.searchParams.get('search')).toBe('react')
    expect(urlObj.searchParams.get('location')).toBe('remote')
    expect(urlObj.searchParams.get('remote')).toBe('true')
    expect(urlObj.searchParams.get('page')).toBe('2')
    expect(urlObj.searchParams.get('sort_by')).toBe('date_posted') // the default in route.ts

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual(mockData)
  })

  it('returns appropriate error status when uppercase API fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'Invalid token',
    })

    const req = new NextRequest('http://localhost/api/jobs')
    const res = await GET(req)

    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('External API Error: Unauthorized')
  })
})
