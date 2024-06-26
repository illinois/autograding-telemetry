import fs from 'node:fs'
import process from 'node:process'
import * as artifact from '@actions/artifact'
import * as core from '@actions/core'
import * as github from '@actions/github'

const REQUEST_TIMEOUT = 5000

export async function run() {
  const endpoint = core.getInput('endpoint')
  const createArtifact = core.getInput('create_artifact') === 'true'

  // Exit early if endpoint and create_artifact are false-y values
  if (!endpoint && !createArtifact) {
    core.setFailed('Either an endpoint must be specified or an artifact must be created.')
    return
  }

  const inputs = getInputs()
  // if (!inputs) {
  //   core.setFailed("Could not get action inputs")
  //   return
  // }

  // core.debug(JSON.stringify(inputs))

  if (endpoint && inputs.token == null) {
    core.setFailed('Could not find GitHub token')
    return
  }

  const info = getTelemetryInfo(inputs)

  const promises: Promise<any>[] = []

  // Send JSON to specified endpoint, if exists
  if (endpoint)
    promises.push(sendTelemetryInfo(info, endpoint).catch(core.setFailed))

  delete inputs.token

  // Create an artifact, if specified
  // todo: omit sensitive info
  const jsonInfo = JSON.stringify(info)
  if (createArtifact)
    promises.push(uploadArtifact(jsonInfo, inputs.assignment))

  await Promise.all(promises)
}

// todo: return type
function getInputs() {
  return {
    date: core.getInput('log_date') === 'true' ? new Date().toISOString() : undefined,
    username: core.getInput('username') || github.context.repo.owner,
    token: core.getInput('token') || process.env.GITHUB_TOKEN,
    assignment: core.getInput('assignment') || undefined,
    upstream_repo: core.getInput('upstream_repo') || undefined,
    upstream_ref: core.getInput('upstream_ref') || undefined,
    points: core.getInput('points') || undefined,
    autograding_status: core.getInput('autograding_status') || undefined,
    meta: JSON.parse(core.getInput('meta') || '{}'),
  }
}

function getTelemetryInfo(inputs: ReturnType<typeof getInputs>) {
  return {
    ...inputs,
    upstream_ref: inputs.upstream_ref || inputs.assignment,
    username: github.context.repo.owner,
    repo: github.context.repo.repo,
    workflow_ref: process.env.GITHUB_WORKFLOW_REF!,
  }
}

/**
 * Sends telemetry JSON to a user-specified endpoint via an
 * HTTP POST request.
 *
 * @param info telemetry info
 * @param endpoint URL of the endpoint
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

/**
 * Creates and uploads a temp JSON file containing telemtry data to Github.
 * This artifact will persist for the default number of days.
 *
 * @param json Stringified JSON telemetry data
 * @param assignmentName Name of the assignment for which an artifact is being created
 */
async function uploadArtifact(json: string, assignmentName?: string) {
  const artifactClient = artifact.create()
  const artifactName = assignmentName ? `${assignmentName}-telemetry` : 'telemetry'
  const filepath = 'temp.json'
  fs.writeFileSync(filepath, json)
  const response = await artifactClient.uploadArtifact(artifactName, [filepath], '.', {})
  if (response.failedItems.length > 0)
    core.setFailed('Artifact failed to upload to Github.')
}
