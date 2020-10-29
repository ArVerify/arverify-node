import * as fs from "fs";
import Arweave from "arweave";

import Koa from "koa";
import Router from "@koa/router";

import { query } from "./utils";
import tipQuery from "./queries/tip.gql";

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

const http = new Koa();
const router = new Router();

router.get("/ping", async (ctx, next) => {
  ctx.body = {
    status: "alive",
  };
  await next();
});

const tipReceived = async (addr: string, fee: number): Promise<boolean> => {
  const txs = (
    await query({
      query: tipQuery,
      variables: {
        owner: addr,
        recipient: await client.wallets.jwkToAddress(jwk),
      },
    })
  ).data.transactions.edges;

  if (txs.length === 1) {
    return parseFloat(txs[0].node.quantity.ar) === fee;
  }

  return false;
};

router.get("/verify", async (ctx, next) => {
  const addr = ctx.query["address"];

  if (!addr) {
    ctx.status = 400;
    ctx.body = {
      status: "error",
      message: "address is required",
    };
  } else {
    if (await tipReceived(addr, config.fee)) {
      console.log(addr);
    } else {
      ctx.status = 400;
      ctx.body = {
        status: "error",
        message: "no tip",
      };
    }
  }

  await next();
});

http.use(router.routes());

http.listen(3000);
