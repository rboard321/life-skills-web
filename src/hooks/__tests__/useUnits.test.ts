import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useUnits } from '../useUnits'
import { sampleUnits } from '../../data/sampleUnits'

vi.mock('../../firebase', () => ({
  db: {},
}))

const mockGetDocs = vi.fn()

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: () => mockGetDocs(),
}))

const mockGetAssignedUnits = vi.fn()

vi.mock('../../utils/teacherAssignments', () => ({
  TeacherAssignmentManager: {
    getAssignedUnits: () => mockGetAssignedUnits(),
    getAllUnits: vi.fn()
  }
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { uid: 'test-user' },
    role: 'student'
  })
}))

vi.mock('../../contexts/StudentAuthContext', () => ({
  useStudentAuth: () => ({
    teacherId: 'teacher-1'
  })
}))

describe('useUnits Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return sample units when Firebase is empty', async () => {
    mockGetDocs.mockResolvedValue({
      empty: true,
      docs: []
    })

    const { result } = renderHook(() => useUnits())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.units).toEqual(sampleUnits)
    expect(result.current.error).toBe(null)
  })

  it('should return Firebase units when available', async () => {
    const firebaseUnits = [
      {
        id: 1,
        title: 'Firebase Unit',
        description: 'Unit from Firebase',
        videoUrl: 'https://youtube.com/embed/test',
        activityType: 'drag-drop',
        order: 1
      }
    ]

    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: firebaseUnits.map(unit => ({
        id: unit.id.toString(),
        data: () => unit
      }))
    })

    const { result } = renderHook(() => useUnits())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.units).toEqual(firebaseUnits)
  })

  it('should filter units for assigned students', async () => {
    const assignedUnits = sampleUnits.slice(0, 2)
    mockGetDocs.mockResolvedValue({
      empty: true,
      docs: []
    })
    mockGetAssignedUnits.mockResolvedValue(assignedUnits)

    const { result } = renderHook(() => useUnits(true))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.units).toEqual(assignedUnits)
  })

  it('should handle Firebase errors gracefully', async () => {
    mockGetDocs.mockRejectedValue(new Error('Firebase error'))

    const { result } = renderHook(() => useUnits())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should fallback to sample data and not set error (graceful fallback)
    expect(result.current.units).toEqual(sampleUnits)
    expect(result.current.error).toBe(null)
  })

  it('should sort units by order', async () => {
    const unorderedUnits = [
      { id: 3, order: 3, title: 'Third' },
      { id: 1, order: 1, title: 'First' },
      { id: 2, order: 2, title: 'Second' }
    ]

    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: unorderedUnits.map((unit, index) => ({
        id: index.toString(),
        data: () => ({
          ...unit,
          description: '',
          videoUrl: '',
          activityType: 'drag-drop'
        })
      }))
    })

    const { result } = renderHook(() => useUnits())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const orders = result.current.units.map(u => u.order)
    expect(orders).toEqual([1, 2, 3])
  })
})
