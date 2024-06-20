import * as main from '../src/main'
import { MOCK_SERVER_ENDPOINT, errorMock, getInputMock, jsonHandlerMock, setFailedMock } from './mocks'

// Mock the action's main function
const runMock = vi.spyOn(main, 'run')

describe('action', () => {
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

    expect(jsonHandlerMock).not.toHaveBeenCalled()
    await main.run()
    expect(runMock).toHaveReturned()
    expect(setFailedMock).not.toHaveBeenCalled()
    expect(jsonHandlerMock.mock.calls.length).toBe(1)
    expect(jsonHandlerMock.mock.calls[0]).toMatchInlineSnapshot(`
      [
        {
          "assignment": "mp-mazes",
          "autograding_status": "success",
          "date": "2024-01-01T06:00:00.000Z",
          "points": "21/42",
        },
      ]
    `)
    vi.useRealTimers()
  })
})
