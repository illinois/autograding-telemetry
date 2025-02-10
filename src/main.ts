import process from 'node:process'
import * as core from '@actions/core'
import * as github from '@actions/github'

const REQUEST_TIMEOUT = 5000

export async function run() {
  const endpoint = core.getInput('endpoint')

  // Exit early if endpoint and create_artifact are false-y values
  if (!endpoint) {
    core.setFailed('Endpoint must be specified.')
    return
  }

  const inputs = getInputs()
  core.debug(`inputs: ${JSON.stringify(inputs)}`)

  if (!inputs.token) {
    core.setFailed('Could not find GitHub token')
    return
  }

  const info = getTelemetryInfo(inputs)

  await sendTelemetryInfo(info, endpoint).catch(core.setFailed)
}

/**
 * Retrieves the inputs for the telemetry process.
 * @returns The telemetry inputs.
 */
function getInputs() {
  return {
    username: core.getInput('username') || github.context.repo.owner,
    token: core.getInput('token') || process.env.GITHUB_TOKEN,
    assignment: core.getInput('assignment') || undefined,
    upstream_repo: core.getInput('upstream_repo') || undefined,
    upstream_ref: core.getInput('upstream_ref') || undefined,
    autograding_status: core.getInput('autograding_status') || undefined,
    points: core.getInput('points') || undefined,
    meta: JSON.parse(core.getInput('meta') || '{}'),
  }
}

/**
 * Generates the telemetry information based on the inputs.
 * @param inputs - The telemetry inputs.
 * @returns The telemetry information.
 */
function getTelemetryInfo(inputs: ReturnType<typeof getInputs>) {
  return {
    ...inputs,
    date: new Date().toISOString(),
    upstream_ref: inputs.upstream_ref || inputs.assignment || 'main',
    username: github.context.repo.owner,
    repo: github.context.repo.repo,
    actor: github.context.actor,
    ref: github.context.ref,
    github_sha: process.env.GITHUB_SHA!,
    workflow_ref: process.env.GITHUB_WORKFLOW_REF!,
    workflow_run_id: process.env.GITHUB_RUN_ID!,
  }
}

/**
 * Sends telemetry JSON to a user-specified endpoint via an HTTP POST request.
 * @param info - The telemetry info.
 * @param endpoint - URL of the endpoint.
 * @returns A Promise that resolves when the telemetry is sent successfully.
 */
function sendTelemetryInfo(info: ReturnType<typeof getTelemetryInfo>, endpoint: string) {
  const json = JSON.stringify(info)

  core.debug(`Sending telemetry info: ${json}`)

  const controller = new AbortController()
  const signal = controller.signal

  const tid = setTimeout(() => controller.abort(), REQUEST_TIMEOUT).unref()

  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': `${json.length}`,
    },
    body: json,
    signal,
  })
    .then((res) => {
      clearTimeout(tid)
      if (res.status >= 400) {
        const msg = `Request to given endpoint return error response code ${res.status}`
        res.text().then(core.error)
        return Promise.reject(new Error(msg))
      }
      return res
    }, (err) => {
      if (signal.aborted) {
        const msg = `Request to ${endpoint} exceeded ${REQUEST_TIMEOUT}ms timeout`
        return Promise.reject(new Error(msg))
      }
      clearTimeout(tid)
      const msg = `Request to given endpoint failed with error: ${err}`
      return Promise.reject(new Error(msg))
    })
}
