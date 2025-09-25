import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import StudentDashboard from '../StudentDashboard'
import { sampleUnits } from '../../data/sampleUnits'

// Mock useUnits hook
const mockUnits = sampleUnits.slice(0, 3) // Use first 3 units
const mockUserProgress = [
  { unitId: 1, completedVideo: true, completedActivity: true },
  { unitId: 2, completedVideo: true, completedActivity: false }
]

const mockUseUnits = vi.fn(() => ({
  units: mockUnits,
  loading: false,
  error: null,
  userProgress: mockUserProgress
}))

vi.mock('../../hooks/useUnits', () => ({
  useUnits: mockUseUnits
}))

// Mock useAuth hook
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    currentUser: { displayName: 'Test Student' },
    role: 'student'
  }))
}))

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  )
}

describe('StudentDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render welcome message with student name', async () => {
    renderWithRouter(<StudentDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Hi, Test Student! 👋')).toBeInTheDocument()
    })

    expect(screen.getByText('Complete your assigned life skills units')).toBeInTheDocument()
  })

  it('should display progress statistics', async () => {
    renderWithRouter(<StudentDashboard />)

    await waitFor(() => {
      expect(screen.getByText('1/3')).toBeInTheDocument() // 1 completed out of 3
      expect(screen.getByText('Units Completed')).toBeInTheDocument()
    })
  })

  it('should render progress bar with correct percentage', async () => {
    renderWithRouter(<StudentDashboard />)

    await waitFor(() => {
      expect(screen.getByText('33%')).toBeInTheDocument() // 1/3 = 33%
    })
  })

  it('should display all assigned units', async () => {
    renderWithRouter(<StudentDashboard />)

    await waitFor(() => {
      mockUnits.forEach(unit => {
        expect(screen.getByText(unit.title)).toBeInTheDocument()
        expect(screen.getByText(unit.description)).toBeInTheDocument()
      })
    })
  })

  it('should show correct unit status badges', async () => {
    renderWithRouter(<StudentDashboard />)

    await waitFor(() => {
      expect(screen.getByText('✓ Completed')).toBeInTheDocument() // Unit 1
      expect(screen.getByText('Video Done')).toBeInTheDocument() // Unit 2
      expect(screen.getByText('Not Started')).toBeInTheDocument() // Unit 3
    })
  })

  it('should show progress steps for each unit', async () => {
    renderWithRouter(<StudentDashboard />)

    await waitFor(() => {
      // Should show Watch Video and Complete Activity steps
      expect(screen.getAllByText('Watch Video')).toHaveLength(3)
      expect(screen.getAllByText('Complete Activity')).toHaveLength(3)
    })
  })

  it('should show encouragement message for partial progress', async () => {
    renderWithRouter(<StudentDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Great job!')).toBeInTheDocument()
      expect(screen.getByText("You've completed 1 unit. Keep going to finish all your assigned units!")).toBeInTheDocument()
    })
  })

  it('should render unit links with correct URLs', async () => {
    renderWithRouter(<StudentDashboard />)

    await waitFor(() => {
      mockUnits.forEach(unit => {
        const link = screen.getByRole('link', { name: new RegExp(unit.title) })
        expect(link).toHaveAttribute('href', `/unit/${unit.id}/learn`)
      })
    })
  })
})

describe('StudentDashboard - Loading State', () => {
  it('should show loading spinner when units are loading', () => {
    mockUseUnits.mockReturnValue({
      units: [],
      loading: true,
      error: null,
      userProgress: []
    })

    renderWithRouter(<StudentDashboard />)

    expect(screen.getByText('Loading your units...')).toBeInTheDocument()
  })
})

describe('StudentDashboard - Empty State', () => {
  it('should show empty state when no units assigned', () => {
    mockUseUnits.mockReturnValue({
      units: [],
      loading: false,
      error: null,
      userProgress: []
    })

    renderWithRouter(<StudentDashboard />)

    expect(screen.getByText('No Units Assigned')).toBeInTheDocument()
    expect(screen.getByText("Your teacher hasn't assigned any units to you yet. Check back later!")).toBeInTheDocument()
  })
})

describe('StudentDashboard - Complete State', () => {
  it('should show congratulations when all units completed', () => {
    const completeProgress = mockUnits.map(unit => ({
      unitId: unit.id,
      completedVideo: true,
      completedActivity: true
    }))

    mockUseUnits.mockReturnValue({
      units: mockUnits,
      loading: false,
      error: null,
      userProgress: completeProgress
    })

    renderWithRouter(<StudentDashboard />)

    expect(screen.getByText('🏆')).toBeInTheDocument()
    expect(screen.getByText('Congratulations!')).toBeInTheDocument()
    expect(screen.getByText("You've completed all your assigned units! Great work on your life skills learning journey.")).toBeInTheDocument()
  })
})