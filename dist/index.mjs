import fs from 'node:fs';
import http from 'node:http';
import artifact from '@actions/artifact';
import core from '@actions/core';

const REQUEST_TIMEOUT = 5e3;
function sendJSON(json, endpoint) {
  const url = new URL(endpoint);
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": json.length },
    timeout: REQUEST_TIMEOUT
  };
  const req = http.request(options, (response) => {
    if (response.statusCode && response.statusCode >= 400)
      core.setFailed(`Request to given endpoint return error response code ${response.statusCode}`);
  });
  req.on("error", (err) => {
    core.setFailed(`Request to given endpoint failed with error: ${err}`);
  });
  req.on("timeout", () => {
    core.setFailed(`Request to ${endpoint} exceeded ${REQUEST_TIMEOUT}ms timeout`);
    req.destroy();
  });
  req.write(json);
  req.end();
}
async function uploadArtifact(json, assignmentName) {
  const artifactClient = artifact.create();
  const artifactName = assignmentName ? `${assignmentName}-telemetry` : "telemetry";
  const filepath = "temp.json";
  fs.writeFileSync(filepath, json);
  const response = await artifactClient.uploadArtifact(artifactName, [filepath], ".", {});
  if (response.failedItems.length > 0)
    core.setFailed("Artifact failed to upload to Github.");
}
async function run() {
  const json = {};
  const endpoint = core.getInput("endpoint");
  const createArtifact = core.getInput("create_artifact");
  if (!endpoint && !createArtifact) {
    core.setFailed("Either an endpoint must be specified or an artifact must be created.");
    return;
  }
  const logDate = core.getInput("log_date");
  const points = core.getInput("points");
  const assignment = core.getInput("assignment");
  const autogradingStatus = core.getInput("autograding_status");
  if (logDate)
    json.date = (/* @__PURE__ */ new Date()).toISOString();
  if (points)
    json.points = points;
  if (assignment)
    json.assignment = assignment;
  if (autogradingStatus)
    json.autograding_status = autogradingStatus;
  const jsonStr = JSON.stringify(json);
  if (endpoint)
    await sendJSON(jsonStr, endpoint);
  if (createArtifact)
    await uploadArtifact(jsonStr, assignment);
}

run();
