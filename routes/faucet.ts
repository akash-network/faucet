import express from "express";
const router = express.Router();

import got from "got";
import { User, Transaction } from "../database";
import * as faucet from "../faucet";
import { ensureAuthenticated, blockedAddresses, rateLimit } from "../utils";

const DOMAIN = process.env.AUTH0_DOMAIN;

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
      res
        .status(201)
        .send(JSON.stringify({ transactionHash: result.transactionHash }));
    } catch (error) {
      res.status(422).send(JSON.stringify({ error: error.message }));
    }
  }
);

export { router };
