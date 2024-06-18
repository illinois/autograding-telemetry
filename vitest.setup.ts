import { server } from './test/mocks'

beforeAll(() => {
  server.listen()
})

beforeEach(() => {
  server.resetHandlers()
  vi.useFakeTimers()
})

afterEach(() => {
  server.resetHandlers()
  vi.useRealTimers()
})

afterAll(() => {
  server.close()
})
