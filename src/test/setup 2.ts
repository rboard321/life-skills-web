import '@testing-library/jest-dom'

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
  default: vi.fn(({ onProgress, onDuration, onEnded, onReady }) => {
    // Simulate video events for testing
    setTimeout(() => {
      onReady?.()
      onDuration?.(100) // 100 seconds duration
      onProgress?.({ played: 0.5, playedSeconds: 50 }) // 50% progress
    }, 100)

    return <div data-testid="mock-video-player">Mock Video Player</div>
  }),
}))