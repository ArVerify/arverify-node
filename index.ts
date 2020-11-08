import * as fs from "fs";
import Arweave from "arweave";
import { google } from "googleapis";

import Koa from "koa";
import Router from "@koa/router";

import { sendGenesis, isVerified, tipReceived } from "arverify";

const client = new Arweave({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});

const config = JSON.parse(
  fs.readFileSync("config.json", {
    encoding: "utf-8",
  })
);
const jwk = JSON.parse(
  fs.readFileSync(config.keyfile, {
    encoding: "utf-8",
  })
);

const oauthClient = new google.auth.OAuth2(
  config["clientID"],
  config["clientSecret"],
  config["endpoint"] + "/verify/callback"
);

const http = new Koa();
const router = new Router();

router.get("/ping", async (ctx, next) => {
  ctx.body = {
    status: "alive",
  };
  await next();
});

router.get("/verify", async (ctx, next) => {
  console.log("===== /verify =====");
  const addr = ctx.query["address"];
  const returnUri = ctx.query["return"];

  if (!addr) {
    console.log("No address supplied.");
    ctx.status = 400;
    ctx.body = {
      status: "error",
      message: "address is required",
    };
  } else {
    console.log("Received verification request for address:\n  -", addr);
    if (await isVerified(addr)) {
      ctx.body = {
        status: "success",
        message: "already verified",
      };
      console.log("Address already verified.");
    } else {
      if (await tipReceived(addr, await client.wallets.jwkToAddress(jwk))) {
        const uri = oauthClient.generateAuthUrl({
          scope: ["openid", "email", "profile"],
          state: JSON.stringify({ address: addr, returnUri }),
        });
        ctx.body = {
          status: "success",
          uri,
        };
        console.log("Generated a unique auth URI.");
      } else {
        console.log("No tip received from this address yet.");
        ctx.status = 400;
        ctx.body = {
          status: "error",
          message: "no tip",
        };
      }
    }
  }

  await next();
  console.log("===================\n");
});

router.get("/verify/callback", async (ctx, next) => {
  console.log("===== /verify/callback =====");

  const code = ctx.query["code"];
  const state = JSON.parse(ctx.query["state"]);
  const addr = state["address"];
  const uri = state["returnUri"];

  console.log("Received callback for address:\n  -", addr);

  const res = await oauthClient.getToken(code);
  if (res.tokens.access_token) {
    const info = await oauthClient.getTokenInfo(res.tokens.access_token);
    if (info.email_verified) {
      console.log("Verified email:\n  -", info.email);

      const tags = {
        "App-Name": "ArVerifyDev",
        Type: "Verification",
        Method: "Google",
        Address: addr,
      };

      const tx = await client.createTransaction(
        {
          target: addr,
          data: Math.random().toString().slice(-4),
        },
        jwk
      );

      for (const [key, value] of Object.entries(tags)) {
        tx.addTag(key, value);
      }

      await client.transactions.sign(tx, jwk);
      await client.transactions.post(tx);

      ctx.body = {
        status: "success",
        id: tx.id,
      };

      console.log("Sent Arweave transaction:\n  -", tx.id);
    } else {
      console.log("Email address is not verified.");
    }
  } else {
    console.log("No access token.");
  }

  if (uri) ctx.redirect(uri);
  await next();
  console.log("============================\n");
});

http.use(router.routes());

async function start() {
  const genesis = await sendGenesis(jwk, config["endpoint"]);
  if (genesis === "stake") {
    console.log("Sorry, you don't have any stake.\n");
    process.exit(1);
  } else {
    console.log("Sent genesis tx with id:\n  -", genesis, "\n");
    http.listen(3000);
    console.log("ArVerify Auth Node started at port 3000.\n");
  }
}

start();
