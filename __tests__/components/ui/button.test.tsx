import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button component', () => {
  it('renders correctly with default text', () => {
    render(<Button>Click me</Button>)
    const buttonElement = screen.getByRole('button', { name: /click me/i })
    expect(buttonElement).toBeInTheDocument()
    expect(buttonElement).toHaveClass('bg-primary')
  })

  it('applies the correct variant classes', () => {
    render(<Button variant="destructive">Delete</Button>)
    const buttonElement = screen.getByRole('button', { name: /delete/i })
    expect(buttonElement).toHaveClass('bg-destructive')
  })

  it('renders as a custom child component when asChild is passed', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )
    const linkElement = screen.getByRole('link', { name: /link button/i })
    expect(linkElement).toBeInTheDocument()
    expect(linkElement).toHaveAttribute('href', '/test')
  })
})
