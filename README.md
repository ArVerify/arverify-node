# ArVeriy Authnode
## Prerequisites
### Arweave Keyfile
Place the Arweave-Keyfile inside the directory
### Config-File
You have two options to set the configuration.
1.  create a config.json File
2.  create a .env File (will be used if no json file is present)

Both ways require the following variables:

| config.json      | .env             | Example               | Description                               |
|------------------|------------------|-----------------------|-------------------------------------------|
| clientId         | CLIENT_ID        | ...                   | The Google Auth Client Id (You will receive them form the ArVerify Organisation)                 |
| clientSecret     | CLIENT_SECRET    | ...                   | The Google Auth Client Secret (You will receive them form the ArVerify Organisation)            |
| endpoint         | ENDPOINT         | https://my-domain.org | The endpoint where the AuthNode is hosted |
| keyfile          | KEYFILE          | my-keyfile.json       | The path to the arweave keyfile           |

#### config.json
Create a config.json in the root directory and insert the variables
#### .env-File
Create a .env-File in the root directory and insert the variables
## Deploying to Heroku
Use the following commands to run an AuthNode in Heroku. 
Make sure that you have heroku and docker insatlled on your machine.
```sh
heroku container:login
```
```sh
heroku create
```
```sh
heroku container:push authnode
```
```sh
heroku container:release authnode
```
```sh
heroku ps:scale authnode=1
```
To check if the application is working run:
```sh
heroku open
```