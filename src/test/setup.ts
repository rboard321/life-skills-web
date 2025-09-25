import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
  auth: {},
}))

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: '1', unitId: '1', lessonId: '1' }),
    useLocation: () => ({ pathname: '/' }),
  }
})

// Mock react-player
vi.mock('react-player', () => ({
  default: vi.fn(() => 'div'),
}))