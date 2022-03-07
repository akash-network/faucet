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
  let unlockDate;
  
  const wallet = await faucet.getWallet();
  const chainId = await faucet.getChainId();
  const distributionAmount = faucet.getDistributionAmount();
  const distributionDenom = faucet.getDenom();
  const [{ address }] = await wallet.getAccounts();
  
  if (req.user && req.user.id) {
    let coolDownDate = new Date(
      (new Date() as any) - (faucet.getWaitPeriod() as any)
    );
    let transaction: any = await latestTransactionSince(req.user, coolDownDate);
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
        distributionDenom,
      })
    );
  } else {
    res.sendFile(path.join(__dirname, "../static", "index.html"));
  }
});

export { router };
