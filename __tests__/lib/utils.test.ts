import { cn } from '@/lib/utils'

describe('cn utility', () => {
  it('merges tailwind classes correctly', () => {
    // Normal merge
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white')
    
    // Conflicting classes (tailing merge should handle it via tailwind-merge)
    expect(cn('px-2 py-1', 'p-4')).toBe('p-4')
    
    // Conditional classes
    expect(cn('text-sm', true && 'font-bold', false && 'text-lg')).toBe('text-sm font-bold')
    
    // Arrays and object structures
    expect(cn(['text-center', { 'bg-blue-500': true }])).toBe('text-center bg-blue-500')
  })
})
