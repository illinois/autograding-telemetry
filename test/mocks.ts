import { setupServer } from 'msw/node'
import { HttpResponse, http } from 'msw'
import * as core from '@actions/core'
import * as github from '@actions/github'
import * as main from '../src/main'

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

export const runMock = vi.spyOn(main, 'run')

// eslint-disable-next-line antfu/top-level-function
const noop = (..._: any[]): any => {}
// eslint-disable-next-line no-console
export const debugMock = vi.spyOn(core, 'debug').mockImplementation(console.debug)
export const errorMock = vi.spyOn(core, 'error').mockImplementation(console.error)
export const getInputMock = vi.spyOn(core, 'getInput').mockImplementation(noop)
export const setFailedMock = vi.spyOn(core, 'setFailed').mockImplementation(console.error)

export const githubRepoMock = vi.spyOn(github, 'context', 'get').mockReturnValue({
  workflow: 'microproject-world-university-rankings Grading',
  repo: {
    owner: 'little_johnny',
    repo: 'microprojects',
  },
} as any)

vi.stubEnv('GITHUB_SHA', 'ffac537e6cbbf934b08745a378932722df287a53')
vi.stubEnv('GITHUB_WORKFLOW_REF', 'little_johnny/microprojects/.github/workflows/microproject-test-autograder-action.yml@refs/heads/my_branch')
vi.stubEnv('GITHUB_RUN_ID', '1658821493')
