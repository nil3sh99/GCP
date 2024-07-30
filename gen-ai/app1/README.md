# Overview

https://codelabs.developers.google.com/codelabs/deploy-from-github/gen-ai-nodejs#0

The api's which has to be enabled for this project are:

- cloud run
- cloud build
- ai platform

`gcloud services enable   run.googleapis.com   cloudbuild.googleapis.com   aiplatform.googleapis.com`

Create an index.js file

run the following code to create a package.json file which has all the dependency required for your application to run. What is es6? import statements require es6.

`npm init es6 -y`

Install express to handle the application server

`npm install express`

create a .gitignore file and put /node_modules inside it

code for index.js is available in the file.

## Build Trigger
Trigger is a cloud build entity which takes the application code and creates a build for it.
