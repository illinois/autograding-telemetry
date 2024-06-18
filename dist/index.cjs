'use strict';

const fs = require('node:fs');
const http = require('node:http');
const artifact = require('@actions/artifact');
const core = require('@actions/core');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const fs__default = /*#__PURE__*/_interopDefaultCompat(fs);
const http__default = /*#__PURE__*/_interopDefaultCompat(http);
const artifact__default = /*#__PURE__*/_interopDefaultCompat(artifact);
const core__default = /*#__PURE__*/_interopDefaultCompat(core);

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
  const req = http__default.request(options, (response) => {
    if (response.statusCode && response.statusCode >= 400)
      core__default.setFailed(`Request to given endpoint return error response code ${response.statusCode}`);
  });
  req.on("error", (err) => {
    core__default.setFailed(`Request to given endpoint failed with error: ${err}`);
  });
  req.on("timeout", () => {
    core__default.setFailed(`Request to ${endpoint} exceeded ${REQUEST_TIMEOUT}ms timeout`);
    req.destroy();
  });
  req.write(json);
  req.end();
}
async function uploadArtifact(json, assignmentName) {
  const artifactClient = artifact__default.create();
  const artifactName = assignmentName ? `${assignmentName}-telemetry` : "telemetry";
  const filepath = "temp.json";
  fs__default.writeFileSync(filepath, json);
  const response = await artifactClient.uploadArtifact(artifactName, [filepath], ".", {});
  if (response.failedItems.length > 0)
    core__default.setFailed("Artifact failed to upload to Github.");
}
async function run() {
  const json = {};
  const endpoint = core__default.getInput("endpoint");
  const createArtifact = core__default.getInput("create_artifact");
  if (!endpoint && !createArtifact) {
    core__default.setFailed("Either an endpoint must be specified or an artifact must be created.");
    return;
  }
  const logDate = core__default.getInput("log_date");
  const points = core__default.getInput("points");
  const assignment = core__default.getInput("assignment");
  const autogradingStatus = core__default.getInput("autograding_status");
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
