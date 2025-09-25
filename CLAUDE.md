# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` - Starts Vite dev server with hot reload
- **Build**: `npm run build` - TypeScript compilation followed by Vite build
- **Lint**: `npm run lint` - Run ESLint across the codebase
- **Preview**: `npm run preview` - Preview production build locally

## Project Architecture

### High-Level Structure
This is a React + TypeScript + Vite application for a life skills learning platform with Firebase backend integration. The app follows a hierarchical content structure: **Units** → **Lessons** → **Activities**.

### Authentication & Authorization
- Firebase Authentication with custom role-based access control
- `AuthContext` (`src/contexts/AuthContext.tsx`) provides authentication state
- Role system: `student` (default) and `teacher` (admin access)
- `ProtectedRoute` component handles route protection and admin-only access
- Teacher role grants admin panel access for content management

### Content Management System
- **Units**: Top-level learning modules with metadata (title, description, order)
- **Lessons**: Individual lessons within units containing video content and activities
- **Activities**: Interactive content embedded from H5P and Wordwall platforms
- Firebase Firestore collections: `units` (with nested lesson arrays), `users` (role data)

### Key Components Architecture

#### Route Structure (src/main.tsx)
- `/` - Dashboard (protected, shows unit grid)
- `/login`, `/signup`, `/forgot-password` - Authentication pages
- `/unit/:id` - Unit overview showing lessons list
- `/unit/:unitId/lesson/:lessonId` - Individual lesson with video and activities
- `/admin` - Admin panel (teacher role required)

#### Video System
- `VideoProgression` component handles YouTube video playback with progression tracking
- YouTube URL optimization utility (`src/utils/youtube.ts`) normalizes various YouTube URL formats
- Video completion triggers activity unlock
- Uses `react-player` for video playback with custom controls

#### Admin Content Management
- `AdminPage` supports three modes: Create Units, Add Lessons, Manage Units/Lessons
- Full CRUD operations for both units and lessons
- Dynamic activity management (H5P/Wordwall embeds)
- YouTube URL auto-optimization for embed compatibility

### Data Models (src/data/sampleUnits.ts)
```typescript
Unit: { id, title, description?, order, lessons?, totalLessons? }
Lesson: { id, title, description?, videoUrl, captionsUrl?, order, activities }
Activity: { id, type: 'h5p' | 'wordwall', url, title? }
```

### Firebase Configuration
- Configuration currently hardcoded in `src/firebase.ts`
- Environment variables supported via `.env.example` template
- Firebase services: Authentication, Firestore, (Auth exports from firebase.ts)

### State Management
- React Context for authentication (`AuthContext`)
- Custom hook `useUnits` for fetching units from Firestore
- Component-level state for UI interactions and form management

### Styling
- Tailwind CSS for styling with custom color scheme (blue primary)
- Responsive design with mobile-first approach
- Consistent card-based layouts for content presentation

## Development Notes

### Firebase Setup
Copy `.env.example` to `.env` and configure Firebase credentials. The storage bucket should end with `.appspot.com`. If encountering "invalid api key" errors, verify credentials match Firebase console values.

### Video URLs
The YouTube utility (`src/utils/youtube.ts`) accepts various YouTube URL formats (watch, share, embed, shorts) and converts them to optimized embed URLs with consistent parameters for embedded playback.

### Error Handling
Global error handlers are configured in `main.tsx` for unhandled promises and general errors. Firebase operations include try-catch blocks with user-friendly error messages.