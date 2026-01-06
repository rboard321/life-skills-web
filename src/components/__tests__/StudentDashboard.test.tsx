import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import StudentDashboard from '../StudentDashboard'
import { sampleUnits } from '../../data/sampleUnits'

const mockAssignedUnits = sampleUnits.slice(0, 2)
const mockGetAssignedUnits = vi.fn()

vi.mock('../../utils/teacherAssignments', () => ({
  TeacherAssignmentManager: {
    getAssignedUnits: () => mockGetAssignedUnits()
  }
}))

vi.mock('../../contexts/StudentAuthContext', () => ({
  useStudentAuth: () => ({
    teacherId: 'teacher-1',
    displayName: 'Test Student'
  })
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
    mockGetAssignedUnits.mockResolvedValue(mockAssignedUnits)
    renderWithRouter(<StudentDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Hi, Test Student! 👋')).toBeInTheDocument()
    })

    expect(screen.getByText('Complete your assigned life skills units')).toBeInTheDocument()
  })

  it('should display all assigned units', async () => {
    mockGetAssignedUnits.mockResolvedValue(mockAssignedUnits)
    renderWithRouter(<StudentDashboard />)

    await waitFor(() => {
      mockAssignedUnits.forEach(unit => {
        expect(screen.getByText(unit.title)).toBeInTheDocument()
        expect(screen.getByText(unit.description)).toBeInTheDocument()
      })
    })
  })

  it('should render unit links with correct URLs', async () => {
    mockGetAssignedUnits.mockResolvedValue(mockAssignedUnits)
    renderWithRouter(<StudentDashboard />)

    await waitFor(() => {
      mockAssignedUnits.forEach(unit => {
        const link = screen.getByRole('link', { name: new RegExp(unit.title) })
        expect(link).toHaveAttribute('href', `/unit/${unit.id}/learn`)
      })
    })
  })
})

describe('StudentDashboard - Empty State', () => {
  it('should show empty state when no units assigned', () => {
    mockGetAssignedUnits.mockResolvedValue([])

    renderWithRouter(<StudentDashboard />)

    return waitFor(() => {
      expect(screen.getByText('No Units Assigned')).toBeInTheDocument()
      expect(screen.getByText("Your teacher hasn't assigned any units to you yet. Check back later!")).toBeInTheDocument()
    })
  })
})
