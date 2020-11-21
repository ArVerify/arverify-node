# ArVerify Auth Node

## Configuration

You have two options to set the AuthNode configuration:

1.  Set everything through `config.json`.
2.  Set everthing using `.env` (will be used if no JSON file is present).

Both ways require the following variables.
Note that all Google Auth related variables must be obtained from the ArVerify Organisation.

| `config.json`  | `.env`          | Example               | Description                                                                          |
| ------------ | ------------- | --------------------- | ------------------------------------------------------------------------------------ |
| `clientID` | `CLIENT_ID` | ... | The Google Auth Client ID. |
| `clientSecret` | `CLIENT_SECRET` | ... | The Google Auth Client Secret. |
| `endpoint` | `ENDPOINT` | https://example.com | The endpoint where the AuthNode is hosted. |
| `keyfile` | `KEYFILE` | `arweave.json` | The path to your Arweave keyfile. |

## Deploying to Heroku

Use the following commands to run an AuthNode in Heroku.
Make sure that you have Heroku and Docker installed on your machine.

```sh
heroku container:login
```

```sh
heroku create arverify-[your_org_name]
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
