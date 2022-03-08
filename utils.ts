import jwtAuthz from "express-jwt-authz";
import { BlockedAddress, latestTransactionSince } from "./database";
import * as faucet from "./faucet";
import client from "prom-client";
import got from "got";
import retry, {OperationOptions} from 'retry';

//AUTH0_CLIENTID
//AUTH0_CLIENTSECRET
const authCID = process.env.AUTH0_CLIENTID;
const authSECRET = process.env.AUTH0_CLIENTSECRET;
const DOMAIN = process.env.AUTH0_DOMAIN;

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
      JSON.stringify({ error: "User is not authenticated to recieve funds." })
    );
}

/**
 *
 * @returns object type has access_token, expires_in, token_type
 */
export async function getAuth0Token() {
  const { body } = await got.post(`https://${DOMAIN}/oauth/token`, {
    json: {
      client_id: authCID,
      client_secret: authSECRET,
      audience: `https://${DOMAIN}/api/v2/`,
      grant_type: "client_credentials",
    },
    responseType: "json",
  });
  return body;
}

export async function getAuth0User(userId: string) {
  const accessToken: any = (await getAuth0Token()) as string;
  const userUri = `https://${DOMAIN}/api/v2/users/${encodeURIComponent(
    userId
  )}`;
  const { body } = await got.get(userUri, {
    headers: {
      authorization: `${accessToken.token_type} ${accessToken.access_token}`,
    },
    responseType: "json",
  });
  return body;
}

export async function decorateGithubUser(req: any, res: any, next: any) {
  req.user = req.user || {};
  const authUser: any = await getAuth0User(req.user.sub);

  const { body } = await got(`${authUser.url}`, {
    responseType: "json",
  });

  req.user.github = body;
  next();
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
          error:
            "This address has been blocked from receiving funds from this faucet.",
        })
      );
    }
  }
  next();
}



interface FailedAttemptError extends Error {
	readonly attemptNumber: number;
	readonly retriesLeft: number;
}

interface Options extends OperationOptions {
  readonly onFailedAttempt?: (error: FailedAttemptError | any) => void | Promise<void>;
}

class AbortErrorType extends Error {
	name!: 'AbortError'
	originalError!: Error;

	/**
	Abort retrying and reject the promise.

	@param message - An error message or a custom error.
	*/
	constructor(message: string | Error) {
    super();
  }
}

export class AbortError extends AbortErrorType {
	constructor(message: string | Error) {
		super(message);

		if (message instanceof Error) {
			this.originalError = message;
			({message} = message);
		} else {
			this.originalError = new Error(message);
			this.originalError.stack = this.stack;
		}

		this.name = 'AbortError';
		this.message = message;
	}
}

const networkErrorMsgs = new Set([
	'Failed to fetch', // Chrome
	'NetworkError when attempting to fetch resource.', // Firefox
	'The Internet connection appears to be offline.', // Safari
	'Network request failed', // `cross-fetch`
]);

const decorateErrorWithCounts = (error: Error, attemptNumber: number, options: Options) => {
	// Minus 1 from attemptNumber because the first attempt does not count as a retry
	const retriesLeft = options?.retries? - (attemptNumber - 1) : 0;

	return {
    attemptNumber,
    retriesLeft
  };
};

const isNetworkError = (errorMessage: string) => networkErrorMsgs.has(errorMessage);

export async function pRetry<T>(input: (attemptCount: number) => Promise<T>, options: Options) {
  return new Promise((resolve, reject) => {
    options = {
      onFailedAttempt: () => {},
      retries: 3,
      ...options,
    }
    const operation = retry.operation(options);
    operation.attempt(async (attemptNumber) => {
      try {
        resolve(await input(attemptNumber));
      } catch (error) {
        reject(error);
      }
    })
  })
}