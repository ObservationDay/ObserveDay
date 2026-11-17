# SonarQube Cloud Setup Steps

Use SonarQube Cloud with GitHub Actions for the quickest setup. It requires no Docker or local SonarQube server.

## 1. Prepare the repository

Push the project to a GitHub repository. This workspace is not currently a Git repository. Before uploading, confirm that you are allowed to share the exercise code with a cloud service.

## 2. Create the SonarQube Cloud project

1. Sign in to SonarQube Cloud with GitHub.
2. Create an organization and import the GitHub repository.
3. Save the organization key and project key.

## 3. Add `sonar-project.properties`

Create this file in the repository root and replace the placeholder values:

```properties
sonar.projectKey=YOUR_PROJECT_KEY
sonar.organization=YOUR_ORG_KEY
sonar.host.url=https://sonarcloud.io
sonar.sources=Front-end Angular/src
sonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**,**/*.spec.ts
sonar.sourceEncoding=UTF-8
```

This configuration analyzes the Angular application.

## 4. Add the SonarQube token to GitHub

1. Create a token in your SonarQube Cloud account settings.
2. In the GitHub repository, open **Settings → Secrets and variables → Actions**.
3. Add a repository secret named `SONAR_TOKEN` with the token as its value.

Never put the token in a committed file.

## 5. Add a GitHub Actions workflow

Create `.github/workflows/sonar.yml`:

```yaml
name: SonarQube Cloud

on:
  push:
    branches: [main]
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: SonarSource/sonarqube-scan-action@v5
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

Change `main` if your default branch has a different name.

## 6. Run the analysis and finish the bonus

Push a commit to trigger the workflow. Review the SonarQube Cloud findings, fix at least two issues, run the analysis again, and save a screenshot of the dashboard for the exercise deliverables.
