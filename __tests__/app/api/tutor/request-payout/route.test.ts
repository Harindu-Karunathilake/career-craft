/**
 * @jest-environment node
 */
import { POST } from '@/app/api/tutor/request-payout/route'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

// Thorough mocking of Firestore chain
const mSet = jest.fn()
const mGet = jest.fn()
const mWhere = jest.fn()
const mLimit = jest.fn()
const mDoc = jest.fn()
const mCollection = jest.fn()

jest.mock('@/lib/firebase-admin', () => ({
  adminAuth: jest.fn(),
  adminDb: jest.fn(),
}))

describe('Tutor Request Payout API Route', () => {
  let verifyIdTokenMock: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    
    verifyIdTokenMock = jest.fn()
    ;(adminAuth as jest.Mock).mockReturnValue({ verifyIdToken: verifyIdTokenMock })
    
    mCollection.mockReturnValue({ doc: mDoc, where: mWhere })
    mDoc.mockReturnValue({ get: mGet, set: mSet, id: 'req-id-123' })
    mWhere.mockReturnValue({ where: mWhere, limit: mLimit, get: mGet })
    mLimit.mockReturnValue({ get: mGet })
    
    ;(adminDb as jest.Mock).mockReturnValue({ collection: mCollection })
  })

  it('returns 401 Unauthorized if no token provided', async () => {
    const req = new Request('http://localhost', { method: 'POST' })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('returns 200 mapping a valid payout request correctly', async () => {
    verifyIdTokenMock.mockResolvedValue({ uid: 'tutor-xyz' })
    
    // 1st get: User doc (Role check)
    // 2nd get: Pending Requests empty
    // 3rd get: Paid Enrollments
    mGet
      .mockResolvedValueOnce({ data: () => ({ role: 'tutor', name: 'John', bankDetails: {} }) }) // user
      .mockResolvedValueOnce({ empty: true }) // payoutRequests
      .mockResolvedValueOnce({ docs: [ { id: 'enr1', data: () => ({ disbursed: false, tutorShare: 100 }) }] }) // enrollments

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-jwt' }
    })

    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.totalAmount).toBe(100)
    expect(json.requestId).toBe('req-id-123')
    expect(mSet).toHaveBeenCalledTimes(1)
  })
})
