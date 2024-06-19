import { setupServer } from 'msw/node'
import { HttpResponse, http } from 'msw'

export const MOCK_SERVER_ENDPOINT = 'http://arbitrary.remote.server'

export const jsonHandler = vi.fn()

const restHandlers = [
  // simple echo api
  http.post(MOCK_SERVER_ENDPOINT, async ({ request }) => {
    const json = await request.json()
    jsonHandler(json)
    return HttpResponse.json(json)
  }),
]

export const server = setupServer(...restHandlers)
