import { server } from './test/mocks'

beforeAll(() => {
  server.listen()
})

beforeEach(() => {
  vi.clearAllMocks()
  server.resetHandlers()
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})
