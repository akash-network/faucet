import jwtAuthz from "express-jwt-authz";
import { BlockedAddress, latestTransactionSince } from "./database";
import * as faucet from "./faucet";
import client from "prom-client";

const counterBlockedAddress = new client.Counter({
  name: "faucet_blocked_address_count",
  help: "faucet_blocked_address_count is the number of times the a block address requested a drip",
});

const counterCooldown = new client.Counter({
  name: "faucet_cool_down_count",
  help: "faucet_cool_down_count is the number of times the an address needed to cool down",
});

const counterForbidden = new client.Counter({
  name: "faucet_forbidden_count",
  help: "faucet_forbidden_count is the number of times the authorization was forbidden",
});

export const ensurePermission = jwtAuthz(["manage:faucet"], {
  customScopeKey: "permissions",
});

export async function ensureAuthenticated(req: any, res: any, next: any) {
  if (req.user) return next();

  counterForbidden.inc();
  res
    .status(403)
    .send(
      JSON.stringify({ error: "User is not authenticated to recieve funds" })
    );
}

export async function rateLimit(req: any, res: any, next: any) {
  if (req.user.id) {
    let cooldownDate = new Date(
      (new Date() as any) - (faucet as any).getWaitPeriod()
    );
    let transaction = await latestTransactionSince(req.user, cooldownDate);
    if (transaction) {
      counterCooldown.inc();
      return res.status(403).send(
        JSON.stringify({
          error: `Fund requested too frequently, cool down period until ${cooldownDate}`,
        })
      );
    }
  }
  next();
}

export async function blockedAddresses(req: any, res: any, next: any) {
  const { address } = req.body;
  if (address) {
    let blocked = await BlockedAddress.findOne({
      where: { address: address.trim() },
    });
    if (blocked) {
      counterBlockedAddress.inc();
      return res.status(403).send(
        JSON.stringify({
          error: "This address has been blocked from recieving funds",
        })
      );
    }
  }
  next();
}
