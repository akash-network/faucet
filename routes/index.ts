import express from "express";
const router = express.Router();

import log from "ololog";
import { latestTransactionSince } from "../database";
import * as faucet from "../faucet";
import path from "path";
import client from "prom-client";
import axios from "axios";

const retry = require('retry');
const dns = require('dns');

const counterPreflight = new client.Counter({
  name: "faucet_preflight_count",
  help: "faucet_preflight_count is the number of times the faucet served the preflight page",
});

const INLINE_UI = process.env.INLINE_UI;

async function getRandomUser(count: number) {
  let url = "https://iflavio.dev";
  if (count >= 3) {
    url = "https://random-data-api.com/api/users/random_user";
  }
  try {

    // let url = "https://random-data-api.com/api/users/random_user";
    let data = await axios.get(url);
    return data;
  } catch(err) {
    console.log("error: ", err);
  }
  
}

/* GET home page. */
router.get("/", async (req: any, res: any, next: any) => {
  let unlockDate;

  const wallet = await faucet.getWallet();
  const chainId = await faucet.getChainId();

  const options = {
    retries: 5,
    factor: 3,
    minTimeout: 1 * 1000,
    maxTimeout: 10 * 1000,
    randomize: false,
  };

  let retries = 0;

  async function faultTolerantResolve(fn: Function) {
    return new Promise((resolve, reject) => {
      const operation = retry.operation(options);
      operation.attempt(async (attemptNumber: number) => {
        log.red('attemptNumber', attemptNumber);
        try {
          const res = await fn(attemptNumber);
          log.cyan(res.data);
          resolve(res.data)
        } catch (error) {
          if (operation.retry(error)) {
            // log.cyan(error);
            log.red(`Retry attempt: ${retries}`);
            retries++;
            reject(error)
          } else {
            operation.stop();
            reject(operation.mainError());
          }
        }
      })
    })
  }
  
  const test = await faultTolerantResolve(getRandomUser);

  log.blue(test);


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
