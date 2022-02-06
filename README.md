# meal-simple-firebase

Firebase cloud functions for meal-simple project

### Firebase backend services related code

Requires a local service account config to deploy functions with. This should be obtained
for your own project.

## Dependencies && Installation

Requires [Node.js](https://nodejs.org/) v14.15.0. Lower versions are likely not going to work.
Used: https://firebase.google.com/docs/functions/get-started?authuser=0 for startup

```sh
yarn
```

## Linting

Test locally with emulator

```sh
yarn super:fix
```

## Local Manual Testing

Test locally with emulator

```sh
yarn serve
```

### Run unit tests in isolated environment

```sh
yarn build
yarn test
```

## Deployment

```sh
yarn deploy:functions
```
