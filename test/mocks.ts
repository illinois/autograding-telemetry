import { setupServer } from 'msw/node'

export const MOCK_SERVER_ENDPOINT = 'http://arbitrary.remote.server'

export const server = setupServer()
