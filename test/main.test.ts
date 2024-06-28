import * as main from '../src/main'
import { MOCK_SERVER_ENDPOINT, errorMock, getInputMock, jsonHandlerMock, runMock, setFailedMock } from './mocks'

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
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'))
    const input = {
      endpoint: MOCK_SERVER_ENDPOINT,
      token: 'some_token',
      upstream_repo: 'dsdiscovery/microprojects',
      log_date: 'true',
      points: '21/42',
      assignment: 'microproject-test',
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
          "assignment": "microproject-test",
          "autograding_status": "success",
          "date": "2024-01-01T00:00:00.000Z",
          "github_sha": "ffac537e6cbbf934b08745a378932722df287a53",
          "meta": {},
          "points": "21/42",
          "repo": "microprojects",
          "token": "some_token",
          "upstream_ref": "microproject-test",
          "upstream_repo": "dsdiscovery/microprojects",
          "username": "little_johnny",
          "workflow_ref": "little_johnny/microprojects/.github/workflows/microproject-test-autograder-action.yml@refs/heads/my_branch",
          "workflow_run_id": "1658821493",
        },
      ]
    `)
    vi.useRealTimers()
  })
})
