import express from "express";
import jwt from "express-jwt";
import jwksRsa from "jwks-rsa";
import cors from "cors";
import logger from "morgan";

import { User } from "./database";

import { router as indexRouter } from "./routes/index";
import { router as faucetRouter } from "./routes/faucet";
import { router as usersRouter } from "./routes/users";
import { router as transactionsRouter } from "./routes/transactions";
import { router as blockedAddressesRouter } from "./routes/blocked-addresses";

var app = express();

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

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors()); // Allow all cors (not recommended for production)
app.use(checkJwt);
app.use(loadUser);

app.use("/", indexRouter);
app.use("/faucet", faucetRouter);
app.use("/users", usersRouter);
app.use("/transactions", transactionsRouter);
app.use("/blocked-addresses", blockedAddressesRouter);

export { app };
