import * as core from '@actions/core'

import * as main from '../src/main'
import { MOCK_SERVER_ENDPOINT, jsonHandler } from './mocks'

// Mock the action's main function
const runMock = vi.spyOn(main, 'run')

// eslint-disable-next-line antfu/top-level-function
const noop = (..._: any[]): any => {}
const errorMock = vi.spyOn(core, 'error').mockImplementation(noop)
const getInputMock = vi.spyOn(core, 'getInput').mockImplementation(noop)
const setFailedMock = vi.spyOn(core, 'setFailed').mockImplementation(console.error)

describe('action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

    expect(jsonHandler).not.toHaveBeenCalled()
    await main.run()
    expect(runMock).toHaveReturned()
    expect(setFailedMock).not.toHaveBeenCalled()
    expect(jsonHandler).toHaveBeenCalledWith(({
      assignment: input.assignment,
      points: input.points,
      autograding_status: input.autograding_status,
      date: input.log_date,
    }))
  })
})
