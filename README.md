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

### Run integration tests in isolated environment

```sh
yarn build
yarn test
```

If failing, try to increase timeout on test helper method for sleeping. Functions still need to improve their execution speeds / implement a debounce functionaility to be more resilient to delays.

## Deployment

```sh
yarn deploy:functions
```

## Backup

In the event that you want to overwrite the firestore with an admin account and (re-)add new items, you can use (Not recommended unless everything went terribly wrong 🙈

```sh
npx ts-node src\backup\populateFromScratch.ts
```

## Debugging

If on windows and the port is taken, do the following to kill the process taking up the port:

```sh
netstat -ano | findstr :8080
taskkill /PID <pid> /F
```
