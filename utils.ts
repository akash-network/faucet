var jwtAuthz = require("express-jwt-authz");
var { BlockedAddress, latestTransactionSince } = require("./database");
var faucet = require("./faucet");

export const ensurePermission = jwtAuthz(["manage:faucet"], {
  customScopeKey: "permissions",
});

export async function ensureAuthenticated(req: any, res: any, next: any) {
  if (req.user) return next();
  res.status(403).send(JSON.stringify({ error: "Forbidden" }));
}

export async function rateLimit(req: any, res: any, next: any) {
  if (req.user.id) {
    let cooldownDate = new Date((new Date() as any) - faucet.getWaitPeriod());
    let transaction = await latestTransactionSince(req.user, cooldownDate);
    if (transaction) {
      return res.status(403).send(JSON.stringify({ error: "Cooldown" }));
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
      return res.status(403).send(JSON.stringify({ error: "Blocked address" }));
    }
  }
  next();
}
