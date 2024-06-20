import { runMock } from './mocks'

describe('index', () => {
  it('calls run when imported', async () => {
    expect(runMock).not.toHaveBeenCalled()
    await import('../src/index')
    expect(runMock).toHaveBeenCalled()
  })
})
