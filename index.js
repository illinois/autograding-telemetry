const artifact = require('@actions/artifact');
const core = require('@actions/core');
const fs = require('node:fs');
const urllib = require('node:url');

/**
 * Sends telemetry JSON to a user-specified endpoint via an
 * HTTP POST request.
 * 
 * @param {String} json Stringified JSON telemtry data
 * @param {String} endpoint URL of the endpoint
 */
const sendJSON = (json, endpoint) => {
  // Init HTTP client
  const http = require('http');
  // Make a request to the given endpoint, if specified
  const url = new URL(endpoint);
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': json.length},
    timeout: 5000
  }
  const req = http.request(options, (response) => {
    if (response.statusCode >= 400) {
      core.setFailed(`Request to given endpoint return error response code ${response.statusCode}`);
    }
  })
  req.on('error', (err) => {
    core.setFailed(`Request to given endpoint failed with error: ${err}`);
  })
  req.on('timeout', () => {
    core.setFailed(`Request to ${endpoint} exceeded 5000ms timeout`);
    req.destroy();
    return;
  });
  req.write(json);
  req.end();
}

/**
 * Creates and uploads a temp JSON file containing telemtry data to Github.
 * This artifact will persist for the default number of days.
 * 
 * @param {String} json: Stringified JSON telemetry data
 * @param {String} assignmentName Name of the assignment for which an artifact is being created
 */
const uploadArtifact = async(json, assignmentName) => {
  const artifactClient = artifact.create();
  const artifactName = assignmentName ? `${assignmentName}-telemetry` : 'telemetry';
  const filepath = 'temp.json'
  fs.writeFileSync(filepath, json);
  const response = await artifactClient.uploadArtifact(artifactName, [filepath], '.', {});
  if (response.failedItems > 0) {
    core.setFailed('Artifact failed to upload to Github.');
  }
}

const main = async() => {
  var json = {}
  const endpoint = core.getInput('endpoint');
  const createArtifact = core.getInput('create_artifact');
  // Exit early if endpoint and create_artifact are false-y values
  if (!endpoint && !createArtifact) {
    core.setFailed('Either an endpoint must be specified or an artifact must be created.');
    return;
  }
  // Init/fill in data fields
  const logDate = core.getInput('log_date');
  const points = core.getInput('points');
  const assignment = core.getInput('assignment');
  const autogradingStatus = core.getInput('autograding_status');
  if (logDate) { json['date'] = new Date(); }
  if (points) { json['points'] = points; }
  if (assignment) { json['assignment'] = assignment; }
  if (autogradingStatus !== '') { json['autograding_status'] = autogradingStatus; }
  json = JSON.stringify(json);
  // Send JSON to specified endpoint, if exists
  if (endpoint) {
    sendJSON(json, endpoint);
  }
  // Create an artifact, if specified
  if (createArtifact) {
    await uploadArtifact(json, assignment);
  }
  return;
}

main();
