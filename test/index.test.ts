import * as main from '../src/main'

// Mock the action's entrypoint
const runMock = vi.spyOn(main, 'run')

describe('index', () => {
  it('calls run when imported', async () => {
    expect(runMock).not.toHaveBeenCalled()
    await import('../src/index')
    expect(runMock).toHaveBeenCalled()
  })
})
