import express from "express";
const router = express.Router();

import { latestTransactionSince } from "../database";
import * as faucet from "../faucet";
import path from "path";
import client from "prom-client";

const counterPreflight = new client.Counter({
  name: "faucet_preflight_count",
  help: "faucet_preflight_count is the number of times the faucet served the preflight page",
});

const INLINE_UI = process.env.INLINE_UI;

/* GET home page. */
router.get("/", async (req: any, res: any, next: any) => {
  const wallet = await faucet.getWallet();
  const chainId = await faucet.getChainId();
  const distributionAmount = faucet.getDistributionAmount();
  const distrbutionDenom = faucet.getDenom();
  const [{ address }] = await wallet.getAccounts();
  var unlockDate;

  if (req.user && req.user.id) {
    let cooldownDate = new Date(
      (new Date() as any) - (faucet.getWaitPeriod() as any)
    );
    let transaction: any = await latestTransactionSince(req.user, cooldownDate);
    if (transaction)
      unlockDate = new Date(
        transaction.createdAt.getTime() + faucet.getWaitPeriod()
      );
  }

  counterPreflight.inc();

  if (!INLINE_UI) {
    res.status(200).send(
      JSON.stringify({
        faucetAddress: address,
        unlockDate,
        chainId,
        distributionAmount,
        distrbutionDenom,
      })
    );
  } else {
    res.sendFile(path.join(__dirname, "../static", "index.html"));
  }
});

export { router };
