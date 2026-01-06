# Repository Guidelines

## Project Structure & Module Organization
- `src/components/` holds UI components, with feature folders like `src/components/activities/` and `src/components/admin/`.
- `src/contexts/` contains auth providers (`AuthContext`, `StudentAuthContext`).
- `src/utils/` houses Firebase helpers, progress tracking, and assignment managers.
- `src/hooks/` includes shared hooks (ex: `useUnits`).
- `src/data/` holds sample seed data and types.
- Tests live under `src/**/__tests__/` with shared setup in `src/test/setup.ts`.

## Build, Test, and Development Commands
- `npm run dev` starts the Vite dev server for local development.
- `npm run build` runs TypeScript build (`tsc -b`) and creates the production bundle.
- `npm run preview` serves the production build locally.
- `npm run lint` runs ESLint across the codebase.
- `npm test`, `npm run test:ui`, `npm run test:coverage` run Vitest tests.

## Coding Style & Naming Conventions
- Use TypeScript + React with functional components.
- Indentation is 2 spaces and semicolons are used throughout existing files.
- Component files are `PascalCase.tsx` and hooks/utilities are `camelCase.ts`.
- Prefer updating existing Tailwind utility classes over introducing new CSS.

## Testing Guidelines
- Tests use Vitest with React Testing Library.
- Place tests in `src/**/__tests__/` and name them `*.test.ts` or `*.test.tsx`.
- Run `npm test` before large changes; add coverage runs when adding new features.

## Commit & Pull Request Guidelines
- Recent commits use short, descriptive, present-tense messages (ex: "fixing student assignments").
- PRs should include a brief summary, testing notes, and screenshots for UI changes.

## Configuration Notes
- Firebase is configured in `src/firebase.ts`. If you change auth or Firestore behavior, verify the rules and local login flows.
