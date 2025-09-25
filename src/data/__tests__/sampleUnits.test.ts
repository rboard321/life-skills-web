import { describe, it, expect } from 'vitest'
import { sampleUnits } from '../sampleUnits'
import type { UserProgress, User, Class } from '../sampleUnits'

describe('Data Models', () => {
  describe('Unit Model', () => {
    it('should have valid structure for all sample units', () => {
      sampleUnits.forEach(unit => {
        expect(unit).toHaveProperty('id')
        expect(unit).toHaveProperty('title')
        expect(unit).toHaveProperty('description')
        expect(unit).toHaveProperty('videoUrl')
        expect(unit).toHaveProperty('activityUrl')
        expect(unit).toHaveProperty('activityType')
        expect(unit).toHaveProperty('order')

        // Validate types
        expect(typeof unit.id).toBe('number')
        expect(typeof unit.title).toBe('string')
        expect(typeof unit.description).toBe('string')
        expect(typeof unit.videoUrl).toBe('string')
        expect(typeof unit.activityUrl).toBe('string')
        expect(['h5p', 'wordwall']).toContain(unit.activityType)
        expect(typeof unit.order).toBe('number')
      })
    })

    it('should have unique IDs', () => {
      const ids = sampleUnits.map(unit => unit.id)
      const uniqueIds = [...new Set(ids)]
      expect(ids.length).toBe(uniqueIds.length)
    })

    it('should have sequential order starting from 1', () => {
      const orders = sampleUnits.map(unit => unit.order).sort((a, b) => a - b)
      const expectedOrders = Array.from({ length: sampleUnits.length }, (_, i) => i + 1)
      expect(orders).toEqual(expectedOrders)
    })

    it('should have valid YouTube embed URLs', () => {
      sampleUnits.forEach(unit => {
        expect(unit.videoUrl).toMatch(/^https:\/\/www\.youtube\.com\/embed\//)
      })
    })

    it('should have valid activity URLs', () => {
      sampleUnits.forEach(unit => {
        if (unit.activityType === 'h5p') {
          expect(unit.activityUrl).toMatch(/h5p\.org/)
        } else if (unit.activityType === 'wordwall') {
          expect(unit.activityUrl).toMatch(/wordwall\.net/)
        }
      })
    })
  })

  describe('UserProgress Model', () => {
    it('should create valid user progress object', () => {
      const progress: UserProgress = {
        unitId: 1,
        completedVideo: true,
        completedActivity: false,
        completedAt: new Date()
      }

      expect(progress.unitId).toBe(1)
      expect(progress.completedVideo).toBe(true)
      expect(progress.completedActivity).toBe(false)
      expect(progress.completedAt).toBeInstanceOf(Date)
    })

    it('should allow optional completedAt field', () => {
      const progress: UserProgress = {
        unitId: 1,
        completedVideo: false,
        completedActivity: false
      }

      expect(progress.completedAt).toBeUndefined()
    })
  })

  describe('User Model', () => {
    it('should create valid student user', () => {
      const student: User = {
        uid: 'test-uid',
        email: 'student@test.com',
        displayName: 'Test Student',
        role: 'student',
        assignedUnits: [1, 2, 3],
        completedUnits: [],
        classIds: ['class-1']
      }

      expect(student.role).toBe('student')
      expect(student.assignedUnits).toEqual([1, 2, 3])
      expect(Array.isArray(student.completedUnits)).toBe(true)
    })

    it('should create valid teacher user', () => {
      const teacher: User = {
        uid: 'teacher-uid',
        email: 'teacher@test.com',
        displayName: 'Test Teacher',
        role: 'teacher',
        assignedUnits: [],
        completedUnits: []
      }

      expect(teacher.role).toBe('teacher')
      expect(teacher.classIds).toBeUndefined()
    })
  })

  describe('Class Model', () => {
    it('should create valid class', () => {
      const classData: Class = {
        id: 'class-1',
        name: 'Life Skills 101',
        teacherId: 'teacher-uid',
        studentIds: ['student-1', 'student-2'],
        assignedUnits: [1, 2, 3],
        createdAt: new Date()
      }

      expect(classData.id).toBe('class-1')
      expect(classData.name).toBe('Life Skills 101')
      expect(classData.teacherId).toBe('teacher-uid')
      expect(classData.studentIds).toEqual(['student-1', 'student-2'])
      expect(classData.assignedUnits).toEqual([1, 2, 3])
      expect(classData.createdAt).toBeInstanceOf(Date)
    })
  })
})