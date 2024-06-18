import * as core from '@actions/core'
import type { MockInstance } from 'vitest'

import { http } from 'msw'
import * as main from '../src/main'
import { MOCK_SERVER_ENDPOINT, server } from './mocks'

// Mock the action's main function
const runMock = vi.spyOn(main, 'run')

// polyfill
const PromiseWithResolvers: typeof Promise.withResolvers = (() => {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { resolve, reject, promise }
}) as any

// Mock the GitHub Actions core library
type SpiedFunction<F> = F extends ({
  new (...args: infer A): infer R
}) | ((...args: infer A) => infer R) ? MockInstance<A, R> : never

let errorMock: SpiedFunction<typeof core.error>
let getInputMock: SpiedFunction<typeof core.getInput>
let setFailedMock: SpiedFunction<typeof core.setFailed>

describe('action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const noop = (..._: any[]): any => {}
    errorMock = vi.spyOn(core, 'error').mockImplementation(noop)
    getInputMock = vi.spyOn(core, 'getInput').mockImplementation(noop)
    setFailedMock = vi.spyOn(core, 'setFailed').mockImplementation(noop)
  })

  it('should fail if nothing is set', async () => {
    getInputMock.mockImplementation(() => '')
    await main.run()
    expect(runMock).toHaveReturned()
    expect(setFailedMock).toHaveBeenNthCalledWith(
      1,
      'Either an endpoint must be specified or an artifact must be created.',
    )
    expect(errorMock).not.toHaveBeenCalled()
  })

  it('should send telemetry info to endpoint', async () => {
    vi.setSystemTime(new Date(2024, 0, 1))
    const input = {
      endpoint: MOCK_SERVER_ENDPOINT,
      log_date: new Date().toISOString(),
      points: '21/42',
      assignment: 'mp-mazes',
      autograding_status: 'success',
    }
    getInputMock.mockImplementation(name => input[name as keyof typeof input] ?? '')

    const { promise, resolve } = PromiseWithResolvers()
    const jsonHandler = vi.fn().mockImplementation(resolve)
    server.use(http.post(MOCK_SERVER_ENDPOINT, async ({ request }) => jsonHandler(await request.json())))

    await main.run()

    expect(runMock).toHaveReturned()
    expect(setFailedMock).not.toHaveBeenCalled()
    expect(jsonHandler).not.toHaveBeenCalled()
    // wait a bit for mock server to get the request
    await vi.waitFor(() => promise, ({ timeout: 10 }))
    expect(jsonHandler).toHaveBeenCalledWith(({
      assignment: input.assignment,
      points: input.points,
      autograding_status: input.autograding_status,
      date: input.log_date,
    }))
  })
})
