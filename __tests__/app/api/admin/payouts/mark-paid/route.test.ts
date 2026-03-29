/**
 * @jest-environment node
 */
import { POST } from '@/app/api/admin/payouts/mark-paid/route'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

const mUpdate = jest.fn()
const mSet = jest.fn()
const mCommit = jest.fn()
const mBatch = jest.fn(() => ({ update: mUpdate, set: mSet, commit: mCommit }))

const mGet = jest.fn()
const mDoc = jest.fn(() => ({ get: mGet, id: 'some-id' }))
const mCollection = jest.fn(() => ({ doc: mDoc }))

jest.mock('@/lib/firebase-admin', () => ({
  adminAuth: jest.fn(),
  adminDb: jest.fn(),
}))

describe('Admin Mark Paid API', () => {
  let verifyIdTokenMock: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    verifyIdTokenMock = jest.fn()
    ;(adminAuth as jest.Mock).mockReturnValue({ verifyIdToken: verifyIdTokenMock })
    ;(adminDb as jest.Mock).mockReturnValue({ collection: mCollection, batch: mBatch })
  })

  it('fails with 403 when user is not admin', async () => {
    verifyIdTokenMock.mockResolvedValue({ uid: 'non-admin' })
    mGet.mockResolvedValueOnce({ data: () => ({ role: 'tutor' }) })

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { Authorization: 'Bearer jwt' }
    })
    
    const res = await POST(req as any)
    expect(res.status).toBe(403)
  })

  it('batches enrollment updates successfully', async () => {
    verifyIdTokenMock.mockResolvedValue({ uid: 'admin1' })
    // admin check
    mGet.mockResolvedValueOnce({ data: () => ({ role: 'admin' }) })
    // 2 enrollments checks via Promise.all
    mGet.mockResolvedValueOnce({ exists: true, data: () => ({ tutorShare: 50 }), ref: 'ref1' })
    mGet.mockResolvedValueOnce({ exists: true, data: () => ({ tutorShare: 150 }), ref: 'ref2' })

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { Authorization: 'Bearer jwt' },
      body: JSON.stringify({ tutorId: 'tut1', payoutIds: ['enr1', 'enr2'] })
    })

    const res = await POST(req as any)
    expect(res.status).toBe(200)
    
    const json = await res.json()
    expect(json.totalPayout).toBe(200)

    expect(mUpdate).toHaveBeenCalledTimes(2) // 2 enrollments updated
    expect(mSet).toHaveBeenCalledTimes(1)    // payout record set
    expect(mCommit).toHaveBeenCalledTimes(1)
  })
})
