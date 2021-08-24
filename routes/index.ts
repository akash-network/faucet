import express from "express";
const router = express.Router();

import { latestTransactionSince } from "../database";
import * as faucet from "../faucet";

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

  res.status(200).send(
    JSON.stringify({
      faucetAddress: address,
      unlockDate,
      chainId,
      distributionAmount,
      distrbutionDenom,
    })
  );
});

export { router };
