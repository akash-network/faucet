import express from "express";
import log from "ololog";
const router = express.Router();

import got from "got";
import { User, Transaction } from "../database";
import * as faucet from "../faucet";
import {
  ensureAuthenticated,
  blockedAddresses,
  rateLimit,
  decorateGithubUser,
} from "../utils";

const DOMAIN = process.env.AUTH0_DOMAIN;

import client from "prom-client";
import e from "cors";

const counterDrip = new client.Counter({
  name: "faucet_transaction_count",
  help: "faucet_transaction_count is the number of times the faucet dripped",
});

const counterDripError = new client.Counter({
  name: "faucet_transaction_error",
  help: "faucet_transaction_count is the number of times the faucet errored while dripping",
});

const noop = (req: any, res: any, next: any) => next();

router.post(
  "/",
  DOMAIN ? ensureAuthenticated : noop,
  DOMAIN ? decorateGithubUser : noop,
  DOMAIN ? blockedAddresses : noop,
  DOMAIN ? rateLimit : noop,
  async (req: any, res: any, next: any) => {
    const { address } = req.body;

    try {
      if (DOMAIN && req.user?.github) {
        const oneQuarter = 7.776e9;
        const dateSince =
          new Date().getTime() - new Date(req.user.github.created_at).getTime();

        if (dateSince < oneQuarter) {
          // user account is under 90 days
          res.status(422).send(
            JSON.stringify({
              error: "social account is not mature enough to request funds.",
            })
          );
        }
      } else if (DOMAIN) {
        //throw we need a user account
        counterDripError.inc();
        res
          .status(422)
          .send(JSON.stringify({ error: "social account not located." }));
      }

      if (DOMAIN && !req.user?.id) {
        const { body } = await got(`https://${DOMAIN}/userinfo`, {
          headers: { authorization: req.headers.authorization },
          responseType: "json",
        });
        let { nickname, name, email, picture } = body as any;

        let user: any = await User.create({
          sub: req.user.sub,
          nickname,
          name,
          email,
          picture,
        });
        req.user = Object.assign(req.user, user.dataValues);
      }

      if (process.env.POSTGRES_HOST) {
        let transaction = await Transaction.create({
          userId: req.user.id,
          address: address,
          amount: faucet.getDistributionAmount(),
        });
        const result = await faucet.sendTokens(address, null);
        transaction.update({ transactionHash: result.transactionHash });
        res
          .status(201)
          .send(JSON.stringify({ transactionHash: result.transactionHash }));
      } else {
        const result = await faucet.sendTokens(address, null);
        res
          .status(201)
          .send(JSON.stringify({ transactionHash: result.transactionHash }));
      }

      counterDrip.inc();
    } catch (error) {
      counterDripError.inc();
      res.status(422).send(JSON.stringify({ error: error.message }));
    }
  }
);

export { router };
