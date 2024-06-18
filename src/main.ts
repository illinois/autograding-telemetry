import fs from 'node:fs'
import http from 'node:http'
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
function sendJSON(json: string, endpoint: string) {
  // Init HTTP client
  // Make a request to the given endpoint, if specified
  const url = new URL(endpoint)
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': json.length },
    timeout: REQUEST_TIMEOUT,
  }
  const req = http.request(options, (response) => {
    if (response.statusCode && response.statusCode >= 400)
      core.setFailed(`Request to given endpoint return error response code ${response.statusCode}`)
  })
  req.on('error', (err) => {
    core.setFailed(`Request to given endpoint failed with error: ${err}`)
  })
  req.on('timeout', () => {
    core.setFailed(`Request to ${endpoint} exceeded ${REQUEST_TIMEOUT}ms timeout`)
    req.destroy()
  })
  req.write(json)
  req.end()
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
    await sendJSON(jsonStr, endpoint)

  // Create an artifact, if specified
  if (createArtifact)
    await uploadArtifact(jsonStr, assignment)
}
