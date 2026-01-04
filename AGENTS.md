# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the React + TypeScript app. Key areas: `components/`, `contexts/`, `hooks/`, `utils/`, and data in `data/`.
- `src/assets/` and `public/` store static assets; `src/index.css` holds global styles.
- Tests live alongside code in `__tests__/` folders (example: `src/hooks/__tests__/`).
- Firebase setup is centralized in `src/firebase.ts`.
- Build output goes to `dist/` via Vite.

## Build, Test, and Development Commands
- `npm ci`: install dependencies from `package-lock.json`.
- `npm run dev`: start the Vite dev server with HMR.
- `npm run build`: type-check (`tsc -b`) and produce a production build in `dist/`.
- `npm run preview`: serve the production build locally.
- `npm run lint`: run ESLint across the repo.
- `npm run test`: run Vitest in watch mode.
- `npm run test:ui`: run Vitest UI.
- `npm run test:coverage`: run Vitest with coverage.

## Coding Style & Naming Conventions
- TypeScript + React with Vite; use ESM imports.
- 2-space indentation, semicolons, and single quotes are the prevailing style (see `src/main.tsx`).
- Component names are `PascalCase`, hooks are `useCamelCase`, and filenames match export names where possible.
- Linting is enforced with ESLint (`eslint.config.js`).

## Testing Guidelines
- Test runner: Vitest; DOM tests use Testing Library (`@testing-library/*`).
- Place tests in `__tests__/` next to related modules, using `*.test.ts` or `*.test.tsx`.
- Run targeted tests with `npx vitest path/to/file.test.tsx`.

## Commit & Pull Request Guidelines
- No formal convention detected; recent commits use short, descriptive phrases (e.g., "added admin panel...").
- Keep commits focused and descriptive; prefer imperative present tense (e.g., "add admin panel").
- PRs should include: a brief summary, testing performed, and screenshots for UI changes.

## Configuration & Environment
- Copy `.env.example` to `.env` and fill Firebase values before running locally.
- See `README.md` for environment variable details and troubleshooting notes.
