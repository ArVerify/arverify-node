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

http.use(router.routes());

http.listen(3000);
