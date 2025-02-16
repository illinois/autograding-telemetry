# autograding-telemetry

> Action in the illinois/autograding suite used for logging basic autograding run information.

`telemetry` is an action responsible for forwarding autograding run results to a remote server. `telemetry` provides basic information relating to run status, such as run time, workflow runner, points earned, and

## Usage

The following YAML snippet will grab the results from `illinois/autograding` and the send them via HTTP POST request to `http://arbitrary.remote.server:5000/` as JSON. Additionally, `telemetry` also generates an artifact logging all of the same information.

```yaml
autograding:
  name: autograding
  runs-on: ubuntu-latest
  timeout-minutes: 5
  steps:
    - name: Checkout student repository
      id: sr-checkout
      uses: actions/checkout@v3
    - name: Autograding
      id: autograding
      uses: illinois/autograding@v3
      with:
        path: mp1/
        test_suite: autograding
        step_summary: true
    - name: Log telemetry data
      if: ${{ always() }}
      uses: illinois/telemetry@v1
      with:
        endpoint: 'http://arbitrary.remote.server:5000/'
        create_artifact: true
        log_date: true
        assignment: mp1-autograding
        upstream_repo: dsdiscovery/microprojects
```

Assuming `http://arbitrary.remote.server:5000/` is a route that allows POST requests, the server may receive the following JSON:

```json
{
  "assignment": "mp1-autograding",
  "date": "2024-01-01T00:00:00.000Z",
  "github_sha": "ffac537e6cbbf934b08745a378932722df287a53",
  "meta": {},
  "repo": "microprojects",
  "token": "ghs_5oMEt0k3n",
  "upstream_ref": "mp1-autograding",
  "upstream_repo": "dsdiscovery/microprojects",
  "username": "little_johnny",
  "workflow_ref": "little_johnny/microprojects/.github/workflows/mp1-autograding-autograder-action.yml@refs/heads/my_branch",
  "workflow_run_id": "1658821493"
}
```

## Parameters

| Parameter            | Required? | Description                                                                                                                                                                                                                                                                                                                                                     | Default               |
| -------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `endpoint`           | No        | The URL to an HTTP endpoint to which this action will send telemetry data. Specifically, if `endpoint` is a valid endpoint, `telemetry` will send a POST request the endpoint containing JSON-formatted telemetry data in the request body. If this field is left blank, `create_artifact` must be set to `true`. Otherwise, this action will fail immediately. | `''`                  |
| `create_artifact`    | No        | Boolean describing if this workflow should produce an artifact containing telemetry data. The data will be saved as JSON, and will contain all the same data as what is sent to `endpoint`. The artifact will be named `telemetry`.                                                                                                                             | `false`               |
| `token`              | No        | GitHub token used to check repository content and provide feedback. By default, this uses the repository token provided by GitHub Actions. You can customize this by replacing this token with a user token which has write-access to your repository. Note that the token will be accessible to all repository collaborators.                                  | `${{ github.token }}` |
| `upstream_repo`      | No        | Upstream project repository name with owner. For example, dsdiscovery/microprojects. Fails the action if endpoint is specified but upstream_repo is not.                                                                                                                                                                                                        | `false`               |
| `upstream_ref`       | No        | The branch, tag or SHA of the upstream repo. Uses the default branch if unspecified, or the assignment name if it is specified.                                                                                                                                                                                                                                 | `false`               |
| `log_date`           | No        | Boolean describing if `telemetry` should log the date and time of the workflow run.                                                                                                                                                                                                                                                                             | `true`                |
| `autograding_status` | No        | `illinois/autograding`'s exit code. If this field is left blank, this information is not logged.                                                                                                                                                                                                                                                                | `''`                  |
| `points`             | No        | String containing the ratio of points earned to total points from the `autograding` action. If the `autograding` action has not been used in the same workflow as this action or if this action is used earlier than `autograding` in a workflow, this field should always be left to its default value.                                                        | `''`                  |
| `assignment`         | No        | The name of the assignment for which data is being logged. If empty, this field will not be entered.                                                                                                                                                                                                                                                            | `''`                  |
| `meta`               | No        | Arbitrary metadata that gets passes directly to the telemetry endpoint, defaults to "{}".                                                                                                                                                                                                                                                                       | `'{}'`                |

## Acknowledgements

- 🏗 Built from [starter-ts](https://github.com/antfu/starter-ts) and [typescript-action](https://github.com/actions/typescript-action)
- ⚡️ Test using [Vitest](https://vitest.dev/)
