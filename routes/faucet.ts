import express from "express";
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
const ACCOUNT_AGE_MIN_DAYS: number =
  parseInt(process.env.ACCOUNT_AGE_MIN_DAYS as string, 10) || 90;

import client from "prom-client";

const counterDrip = new client.Counter({
  name: "faucet_transaction_count",
  help: "faucet_transaction_count is the number of times the faucet dripped",
});

const counterDripError = new client.Counter({
  name: "faucet_transaction_error",
  help: "faucet_transaction_count is the number of times the faucet errored while dripping",
});

function isASCII(str) {
  return /^[\x00-\x7F]*$/.test(str);
}

router.post(
  "/",
  ensureAuthenticated,
  decorateGithubUser,
  blockedAddresses,
  rateLimit,
  async (req: any, res: any, next: any) => {
    const { address } = req.body;

    try {
      if (req.user.github && isASCII(req.user.github.created_at)) {
        const oneDayMilliseconds = 8.64e7;
        const dateSince =
          new Date().getTime() - new Date(req.user.github.created_at).getTime();

        if (dateSince < ACCOUNT_AGE_MIN_DAYS * oneDayMilliseconds) {
          // user account is under 90 days
          res.status(422).send(
            JSON.stringify({
              error: "social account is not mature enough to request funds.",
            })
          );
        }
      } else {
        //throw we need a user account
        counterDripError.inc();
        res
          .status(422)
          .send(JSON.stringify({ error: "social account not located." }));
      }

      if (!req.user.id) {
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
      let transaction = await Transaction.create({
        userId: req.user.id,
        address: address,
        amount: faucet.getDistributionAmount(),
      });
      const result = await faucet.sendTokens(address, null);
      transaction.update({ transactionHash: result.transactionHash });
      counterDrip.inc();
      res
        .status(201)
        .send(JSON.stringify({ transactionHash: result.transactionHash }));
    } catch (error) {
      counterDripError.inc();
      res.status(422).send(JSON.stringify({ error: error.message }));
    }
  }
);

export { router };
