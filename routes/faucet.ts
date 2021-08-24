import express from "express";
const router = express.Router();

import got from "got";
import { User, Transaction } from "../database";
import * as faucet from "../faucet";
import { ensureAuthenticated, blockedAddresses, rateLimit } from "../utils";

const DOMAIN = process.env.AUTH0_DOMAIN;

import client from "prom-client";

const counterDrip = new client.Counter({
  name: "faucet_transaction_count",
  help: "faucet_transaction_count is the number of times the faucet dripped",
});

const counterDripError = new client.Counter({
  name: "faucet_transaction_error",
  help: "faucet_transaction_count is the number of times the faucet errored while dripping",
});

router.post(
  "/",
  ensureAuthenticated,
  blockedAddresses,
  rateLimit,
  async (req: any, res: any, next: any) => {
    const { address } = req.body;

    try {
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
