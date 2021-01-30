import * as fs from "fs";
import Arweave from "arweave";
import {google} from "googleapis";

import Koa from "koa";
import cors from "@koa/cors";
import Router from "@koa/router";
import * as dotenv from "dotenv";

import {COMMUNITY as COMMUNITY_ID} from "arverify";

dotenv.config();

import {sendGenesis, isVerified, tipReceived} from "arverify";
import pkg from "./package.json";

const client = new Arweave({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});

let config: any;
try {
  config = JSON.parse(
    fs.readFileSync("config.json", {
      encoding: "utf-8",
    })
  );
} catch (err) {
  config = {
    googleClientID: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    endpoint: process.env.ENDPOINT,
    keyfile: process.env.KEYFILE,
  };
}

const jwk = JSON.parse(
  fs.readFileSync(config.keyfile, {
    encoding: "utf-8",
  })
);

const oauthClient = new google.auth.OAuth2(
  config["googleClientID"],
  config["googleClientSecret"],
  config["endpoint"] +
  (config["endpoint"].endsWith("/") ? "" : "/") +
  "verify/callback"
);

const http = new Koa();
http.use(cors());
const router = new Router();

router.get("/ping", async (ctx, next) => {
  ctx.body = {
    status: "alive",
    version: pkg.version,
  };
  await next();
});

router.get("/verify", async (ctx, next) => {
  console.log("===== /verify =====");
  const addr = ctx.query["address"];
  const returnUri = ctx.query["return"];
  const referral = ctx.query["referral"];

  if (!addr) {
    console.log("No address supplied.");
    ctx.status = 400;
    ctx.body = {
      status: "error",
      message: "address is required",
    };
  } else {
    console.log("Received verification request for address:\n  -", addr);
    if ((await isVerified(addr)).verified) {
      ctx.body = {
        status: "success",
        message: "already verified",
      };
      console.log("Address already verified.");
    } else {
      if (await tipReceived(addr, await client.wallets.jwkToAddress(jwk))) {
        const uri = oauthClient.generateAuthUrl({
          scope: ["openid", "email", "profile"],
          state: JSON.stringify({address: addr, returnUri, referral}),
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
  const referral = state["referral"];

  console.log("Received callback for address:\n  -", addr);

  const res = await oauthClient.getToken(code);
  if (res.tokens.access_token) {
    const info = await oauthClient.getTokenInfo(res.tokens.access_token);
    if (info.email_verified) {
      const tags = {
        "App-Name": "ArVerify",
        Action: "Verification",
        Method: "Google",
        Address: addr,
        Referral: referral,

        // arweave-activities tags
        Service: "ArVerify",
        "Community-ID": COMMUNITY_ID,
        Message: `${addr} verified via Google Sign-In`,
        Type: "ArweaveActivity"
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
    const port = process.env.PORT || 3000;
    http.listen(port);
    console.log("ArVerify Auth Node started at port: ", port, "\n");
  }
}

start();
