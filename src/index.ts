import Koa from "koa";
import Router from "@koa/router";

const http = new Koa();
const router = new Router();

router.get("/ping", async (ctx, next) => {
  ctx.body = {
    status: "alive",
  };
  await next();
});

router.get("/verify", async (ctx, next) => {
  const addr = ctx.query["address"];

  if (!addr) {
    ctx.status = 400;
    ctx.body = {
      status: "error",
      message: "address is required",
    };
  } else {
    console.log(addr);
  }

  await next();
});

http.use(router.routes());

http.listen(3000);
