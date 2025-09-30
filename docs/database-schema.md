# Teacher Library System - Database Schema

## Collections Overview

### 1. `units` (Community Library)
```typescript
interface Unit {
  id: string; // Auto-generated document ID
  title: string;
  description: string;
  videoUrl: string;
  activityUrl: string;
  activityType: 'h5p' | 'wordwall';

  // Metadata
  createdBy: string; // Teacher user ID who created this
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean; // If false, only visible to creator
  tags: string[]; // For categorization/search
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // Minutes

  // Usage stats
  usageCount: number; // How many times assigned
  rating: number; // Average rating from teachers
  reviews: Review[]; // Teacher feedback
}

interface Review {
  teacherId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}
```

### 2. `classes` (Teacher Classes)
```typescript
interface Class {
  id: string; // Auto-generated document ID
  classCode: string; // 6-character unique code (e.g., "ABC123")
  name: string; // Class display name
  description?: string;

  // Teacher info
  teacherId: string; // Owner teacher's user ID
  teacherName: string; // Cached for quick display

  // Settings
  isActive: boolean;
  allowSelfEnrollment: boolean; // Students can join with code

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Stats
  studentCount: number; // Cached count
  assignedUnitsCount: number; // Cached count
}
```

### 3. `class_members` (Students in Classes)
```typescript
interface ClassMember {
  id: string; // Auto-generated
  classId: string;
  studentId: string;
  studentName: string; // Cached for quick display
  studentEmail: string; // Cached for quick display

  joinedAt: Date;
  status: 'active' | 'inactive';
  lastActive?: Date;
}
```

### 4. `assignments` (Units Assigned to Classes)
```typescript
interface Assignment {
  id: string; // Auto-generated
  classId: string;
  unitId: string;

  // Assignment details
  assignedBy: string; // Teacher ID
  assignedAt: Date;
  dueDate?: Date;

  // Cached unit info for quick display
  unitTitle: string;
  unitDescription: string;

  // Settings
  isRequired: boolean;
  allowRetakes: boolean;

  // Stats
  completionCount: number; // How many students completed
  totalStudents: number; // How many students in class when assigned
}
```

### 5. `users` (Enhanced)
```typescript
interface User {
  id: string; // User ID
  email: string;
  displayName: string;
  role: 'student' | 'teacher' | 'admin';

  // Profile
  avatar?: string;
  bio?: string;

  // For Students
  enrolledClasses?: string[]; // Array of class IDs
  currentClassCode?: string; // Primary class

  // For Teachers
  ownedClasses?: string[]; // Array of class IDs they created
  createdUnits?: string[]; // Array of unit IDs they created

  // Timestamps
  createdAt: Date;
  lastActive: Date;

  // Settings
  notifications: {
    emailUpdates: boolean;
    assignmentReminders: boolean;
  };
}
```

### 6. `student_progress` (Individual Progress Tracking)
```typescript
interface StudentProgress {
  id: string; // Auto-generated
  studentId: string;
  unitId: string;
  classId: string; // Which class context this was completed in
  assignmentId?: string; // If completed via assignment

  // Progress tracking
  completedVideo: boolean;
  completedActivity: boolean;
  completedAt?: Date;
  attemptsCount: number;

  // Video progress details
  videoProgress?: {
    watchedSeconds: number;
    totalSeconds: number;
    percentWatched: number;
    lastPosition: number;
  };

  // Activity details
  activityScore?: number;
  activityData?: any; // Store activity-specific data

  lastUpdated: Date;
}
```

## Composite Indexes Needed

```json
{
  "indexes": [
    {
      "collectionGroup": "units",
      "fields": [
        {"fieldPath": "isPublic", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "class_members",
      "fields": [
        {"fieldPath": "classId", "order": "ASCENDING"},
        {"fieldPath": "status", "order": "ASCENDING"}
      ]
    },
    {
      "collectionGroup": "assignments",
      "fields": [
        {"fieldPath": "classId", "order": "ASCENDING"},
        {"fieldPath": "assignedAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "student_progress",
      "fields": [
        {"fieldPath": "studentId", "order": "ASCENDING"},
        {"fieldPath": "classId", "order": "ASCENDING"}
      ]
    },
    {
      "collectionGroup": "student_progress",
      "fields": [
        {"fieldPath": "classId", "order": "ASCENDING"},
        {"fieldPath": "unitId", "order": "ASCENDING"}
      ]
    }
  ]
}
```

## Security Rules Strategy

### User Roles & Permissions:
- **Admin**: Full access to all collections
- **Teacher**:
  - Read all public units
  - Create/edit own units
  - Create/manage own classes
  - View own students' progress
- **Student**:
  - Read assigned units only
  - Join classes with code
  - Update own progress only