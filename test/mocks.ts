import { setupServer } from 'msw/node'
import { HttpResponse, http } from 'msw'
import * as core from '@actions/core'

export const MOCK_SERVER_ENDPOINT = 'http://arbitrary.remote.server'

export const jsonHandlerMock = vi.fn()

const restHandlers = [
  // simple echo api
  http.post(MOCK_SERVER_ENDPOINT, async ({ request }) => {
    const json = await request.json()
    jsonHandlerMock(json)
    return HttpResponse.json(json)
  }),
]

export const server = setupServer(...restHandlers)

// eslint-disable-next-line antfu/top-level-function
const noop = (..._: any[]): any => {}
export const errorMock = vi.spyOn(core, 'error').mockImplementation(noop)
export const getInputMock = vi.spyOn(core, 'getInput').mockImplementation(noop)
export const setFailedMock = vi.spyOn(core, 'setFailed').mockImplementation(console.error)
