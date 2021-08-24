import express from "express";
import jwt from "express-jwt";
import jwksRsa from "jwks-rsa";
import fastify from "fastify";
import fastifyExpress from "fastify-express";
import fastifyAuth from "fastify-basic-auth";
import metricsPlugin from "fastify-metrics";

import { User } from "./database";
import { router as indexRouter } from "./routes/index";
import { router as faucetRouter } from "./routes/faucet";
import { router as usersRouter } from "./routes/users";
import { router as transactionsRouter } from "./routes/transactions";
import { router as blockedAddressesRouter } from "./routes/blocked-addresses";

const PROM_USER = process.env.PROM_USER;
const PROM_PASSWORD = process.env.PROM_PASSWORD;

async function init() {
  // var app = express();
  const app = fastify({
    logger: true,
  });

  app.register(require("fastify-cors"), {
    origin: false,
  });

  const DOMAIN = process.env.AUTH0_DOMAIN;
  const AUDIENCE = process.env.AUTH0_AUDIENCE;

  const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
      jwksUri: `https://${DOMAIN}/.well-known/jwks.json`,
    }),
    audience: AUDIENCE,
    issuer: `https://${DOMAIN}/`,
    algorithms: ["RS256"],
    credentialsRequired: false,
  });

  async function loadUser(req: any, res: any, next: any) {
    if (req.user) {
      let user = await User.findOne({ where: { sub: req.user.sub } });
      if (user) req.user = { ...req.user, ...(user as any).dataValues };
    }
    return next();
  }

  app.register(fastifyAuth, {
    validate,
    authenticate: true,
  });

  function validate(
    username: any,
    password: any,
    req: any,
    reply: any,
    done: any
  ) {
    if (username === PROM_USER && password === PROM_PASSWORD) {
      done();
    } else {
      done(new Error("failed call, unauthorized"));
    }
  }

  app.addHook("onRequest", (req: any, res: any, next: any) => {
    if (req.url.indexOf("/metrics") > -1) {
      (app as any).basicAuth(req, res, next);
    } else {
      next();
    }
  });

  app.register(metricsPlugin, { endpoint: "/metrics" });

  await app.register(fastifyExpress);
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(checkJwt);
  app.use(loadUser);

  app.use("/", indexRouter);
  app.use("/faucet", faucetRouter);
  app.use("/users", usersRouter);
  app.use("/transactions", transactionsRouter);
  app.use("/blocked-addresses", blockedAddressesRouter);

  return app;
}

export { init };
