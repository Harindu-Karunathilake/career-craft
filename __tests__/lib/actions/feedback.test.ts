import { generateFeedbackAction } from '@/lib/actions/feedback'
import { generateObject } from 'ai'

// Mock the AI module
jest.mock('ai', () => ({
  generateObject: jest.fn(),
}))

// Mock the Google AI SDK
jest.mock('@ai-sdk/google', () => ({
  google: jest.fn(),
}))

describe('generateFeedbackAction Server Action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('generates feedback correctly for a valid transcript', async () => {
    const mockFeedback = {
      'Communication Skills': 85,
      'Technical Knowledge': 90,
      'Problem-Solving': 88,
      'Cultural & Role Fit': 95,
      'Confidence & Clarity': 82,
    }

    // Mock successful AI response
    ;(generateObject as jest.Mock).mockResolvedValue({
      object: mockFeedback,
    })

    const transcript = [
      { role: 'Interviewer', content: 'What is your greatest strength?' },
      { role: 'Candidate', content: 'My problem solving skills.' },
    ]

    const response = await generateFeedbackAction({ transcript })

    expect(generateObject).toHaveBeenCalled()
    expect(response.success).toBe(true)
    expect(response.feedback).toEqual(mockFeedback)
  })

  it('returns an error response on failure', async () => {
    // Mock failure
    ;(generateObject as jest.Mock).mockRejectedValue(new Error('API Error'))

    const transcript = [
      { role: 'Interviewer', content: 'What is your greatest weakness?' },
      { role: 'Candidate', content: 'I have none.' },
    ]

    const response = await generateFeedbackAction({ transcript })

    expect(response.success).toBe(false)
    expect(response.error).toBe('Failed to generate feedback')
  })
})
