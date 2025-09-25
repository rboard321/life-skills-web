import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useUnits } from '../useUnits'
import { sampleUnits } from '../../data/sampleUnits'

// Mock Firebase
vi.mock('../../firebase', () => ({
  db: {},
}))

// Mock Auth Context
const mockCurrentUser = { uid: 'test-user' }
const mockRole = 'student'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: mockCurrentUser,
    role: mockRole,
  }),
}))

// Mock Firestore functions
const mockGetDocs = vi.fn()
const mockGetDoc = vi.fn()

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: () => mockGetDocs(),
  doc: vi.fn(),
  getDoc: () => mockGetDoc(),
}))

describe('useUnits Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return sample units when Firebase is empty', async () => {
    // Mock empty Firebase collection
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
    expect(result.current.userProgress).toEqual([])
  })

  it('should return Firebase units when available', async () => {
    const firebaseUnits = [
      {
        id: 1,
        title: 'Firebase Unit',
        description: 'Unit from Firebase',
        videoUrl: 'https://youtube.com/embed/test',
        activityUrl: 'https://h5p.org/test',
        activityType: 'h5p',
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
    const assignedUnits = [1, 3]
    const expectedUnits = sampleUnits.filter(unit => assignedUnits.includes(unit.id))

    // Mock empty Firebase collection (use sample data)
    mockGetDocs.mockResolvedValue({
      empty: true,
      docs: []
    })

    // Mock user document with assignments
    mockGetDoc.mockResolvedValue({
      data: () => ({
        assignedUnits,
        completedUnits: []
      })
    })

    const { result } = renderHook(() => useUnits(true))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.units).toEqual(expectedUnits)
    expect(result.current.units).toHaveLength(2)
    expect(result.current.units.map(u => u.id)).toEqual([1, 3])
  })

  it('should load user progress for students', async () => {
    const userProgress = [
      { unitId: 1, completedVideo: true, completedActivity: false }
    ]

    mockGetDocs.mockResolvedValue({
      empty: true,
      docs: []
    })

    mockGetDoc.mockResolvedValue({
      data: () => ({
        assignedUnits: [1, 2],
        completedUnits: userProgress
      })
    })

    const { result } = renderHook(() => useUnits(true))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.userProgress).toEqual(userProgress)
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
          activityUrl: '',
          activityType: 'h5p'
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