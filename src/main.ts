import fs from 'node:fs'
import artifact from '@actions/artifact'
import core from '@actions/core'

const REQUEST_TIMEOUT = 5000

/**
 * Sends telemetry JSON to a user-specified endpoint via an
 * HTTP POST request.
 *
 * @param json Stringified JSON telemtry data
 * @param endpoint URL of the endpoint
 */
function sendJson(json: string, endpoint: string) {
  const controller = new AbortController()
  const signal = controller.signal

  const tid = setTimeout(() => {
    core.setFailed(`Request to ${endpoint} exceeded ${REQUEST_TIMEOUT}ms timeout`)
    controller.abort()
  }, REQUEST_TIMEOUT).unref()

  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': `${json.length}`,
    },
    body: json,
    signal,
  }).then((res) => {
    if (res.status >= 400) {
      const msg = `Request to ${endpoint} exceeded ${REQUEST_TIMEOUT}ms timeout`
      core.setFailed(msg)
      return Promise.reject(msg)
    }
  }).catch((err) => {
    core.setFailed(`Request to given endpoint failed with error: ${err}`)
    clearTimeout(tid)
    return err
  })
}

/**
 * Creates and uploads a temp JSON file containing telemtry data to Github.
 * This artifact will persist for the default number of days.
 *
 * @param json Stringified JSON telemetry data
 * @param assignmentName Name of the assignment for which an artifact is being created
 */
async function uploadArtifact(json: string, assignmentName: string) {
  const artifactClient = artifact.create()
  const artifactName = assignmentName ? `${assignmentName}-telemetry` : 'telemetry'
  const filepath = 'temp.json'
  fs.writeFileSync(filepath, json)
  const response = await artifactClient.uploadArtifact(artifactName, [filepath], '.', {})
  if (response.failedItems.length > 0)
    core.setFailed('Artifact failed to upload to Github.')
}

export async function run() {
  // todo: type this
  const json: Record<string, unknown> = {}
  const endpoint = core.getInput('endpoint')
  const createArtifact = core.getInput('create_artifact')

  // Exit early if endpoint and create_artifact are false-y values
  if (!endpoint && !createArtifact) {
    core.setFailed('Either an endpoint must be specified or an artifact must be created.')
    return
  }

  // Init/fill in data fields
  const logDate = core.getInput('log_date')
  const points = core.getInput('points')
  const assignment = core.getInput('assignment')
  const autogradingStatus = core.getInput('autograding_status')

  if (logDate)
    json.date = new Date().toISOString()
  if (points)
    json.points = points
  if (assignment)
    json.assignment = assignment
  if (autogradingStatus)
    json.autograding_status = autogradingStatus

  const jsonStr = JSON.stringify(json)

  // Send JSON to specified endpoint, if exists
  if (endpoint)
    await sendJson(jsonStr, endpoint)

  // Create an artifact, if specified
  if (createArtifact)
    await uploadArtifact(jsonStr, assignment)
}
