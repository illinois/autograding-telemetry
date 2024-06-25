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
        endpoint: 'http://arbitrary.remote.server/'
        create_artifact: true
        log_date: true
        user: ${{ github.actor }}
        autograding_status: ${{ steps.autograding.outcome }}
        points: ${{ steps.autograding.outputs.Points }}
        assignment: mp1-autograding
```

Assuming `http://arbitrary.remote.server:5000/` is a route that allows POST requests, the server will receive the following JSON:

```json
{
  "date": "2023-04-21T15:23:47Z", // A UTC formatted timestamp
  "user": "jackskennel",
  "assignment": "mp1-autograding",
  "points": "40/40",
  "autograding_status": "success"
}
```

## Parameters

| Parameter            | Required? | Description                                                                                                                                                                                                                                                                                                                                                     | Default |
| -------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `endpoint`           | No        | The URL to an HTTP endpoint to which this action will send telemetry data. Specifically, if `endpoint` is a valid endpoint, `telemetry` will send a POST request the endpoint containing JSON-formatted telemetry data in the request body. If this field is left blank, `create_artifact` must be set to `true`. Otherwise, this action will fail immediately. | `''`    |
| `create_artifact`    | No        | Boolean describing if this workflow should produce an artifact containing telemetry data. The data will be saved as JSON, and will contain all the same data as what is sent to `endpoint`. The artifact will be named `telemetry`.                                                                                                                             | `false` |
| `token`              | No        | GitHub token used to check repository content and provide feedback. By default, this uses the repository token provided by GitHub Actions. You can customize this by replacing this token with a user token which has write-access to your repository. Note that the token will be accessible to all repository collaborators.                                  | `false` |
| `upstream_repo`      | No        | Upstream project repository name with owner. For example, dsdiscovery/microprojects. Fails the action if endpoint is specified but upstream_repo is not.                                                                                                                                                                                         | `false` |
| `upstream_ref`       | No        | The branch, tag or SHA of the upstream repo. Uses the default branch if unspecified, or the assignment name if it is specified.                                                                                                                                                                                                                  | `false` |
| `log_date`           | No        | Boolean describing if `telemetry` should log the date and time of the workflow run.                                                                                                                                                                                                                                                                             | `true`  |
| `autograding_status` | No        | `illinois/autograding`'s exit code. If this field is left blank, this information is not logged.                                                                                                                                                                                                                                                                | `''`    |
| `points`             | No        | String containing the ratio of points earned to total points from the `autograding` action. If the `autograding` action has not been used in the same workflow as this action or if this action is used earlier than `autograding` in a workflow, this field should always be left to its default value.                                                        | `''`    |
| `assignment`         | No        | The name of the assignment for which data is being logged. If empty, this field will not be entered.                                                                                                                                                                                                                                                            | `''`    |

## Acknowledgements

- 🏗 Built from [starter-ts](https://github.com/antfu/starter-ts) and [typescript-action](https://github.com/actions/typescript-action)
- ⚡️ Test using [Vitest](https://vitest.dev/)
