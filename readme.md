# Akash Faucet

Faucet server for the [Akash Network](https://akash.network)

## How to use

The faucet is authenticated using Auth0 and the 
[SPA with API](https://auth0.com/docs/architecture-scenarios/spa-api) architecture. 
A good example of this setup is the [Akash faucet UI](). 

Users have rate-limited access to the faucet with a configurable wait period. 
If the `manage:faucet` permission is given to a user in Auth0, additional 
endpoints are accessible to view transaction and user history, and manage
a list of blocked addresses.

This faucet is configured to work with Akash but will work with any Tendermint SDK based chain.

## Configuration

```
POSTGRES_HOST: postgres
POSTGRES_PORT: 5432
POSTGRES_DB: faucet
POSTGRES_USER: postgres
POSTGRES_PASSWORD: password
NETWORK_RPC_NODE: https://rpc.akash.beyno.de:443
FAUCET_WAIT_PERIOD: 30d
FAUCET_DISTRIBUTION_AMOUNT: 1000
FAUCET_DENOM: uakt
FAUCET_FEES: 5000
FAUCET_GAS: 180000
FAUCET_MEMO: Sent from Faucet
AUTH0_DOMAIN: mydomain.us.auth0.com
AUTH0_AUDIENCE: https://mydomain.com
FAUCET_MNEMONIC: some secret words here
```

## Endpoints

All endpoints will return the relevent success status if successful. Errors will
return an appropriate error code and a message under the `error` key.

### `GET /`

Returns status about the faucet

#### Response

```
{
  'faucetAddress': 'akash1...',
  'unlockDate': '2020-10-10T14:48:00',
  'chainId': 'akashnet-2',
  'distributionAmount': 10000
}
```

### `POST /faucet` 

Request funds from the faucet. Requires an access token.

#### Params

```
{
  'address': 'akash1...'
}
```

#### Response

```
{
  'transactionHash': 'A5BE0243169DAF5A...'
}
```

### `GET /users`

Returns an array of users who have used the faucet. Requires an access token with the 
`manage:faucet` permission.

#### Response

```
[{
  'id': 1,
  'sub': 'github|1',
  'nickname': 'username',
  'name': 'User Name',
  'email': 'user@email.com',
  'picture': 'http://image.com/user.jpg',
  'createdAt': '...',
  'updatedAt': '...'
}]
```

### `GET /transactions`

Returns an array of transactions sent from the faucet. Requires an access token with the 
`manage:faucet` permission.

#### Response

```
[{
  'id': 1,
  'userId': 1,
  'address': 'github|1',
  'amount': 100000,
  'transactionHash': 'A5BE0243169DAF5A...',
  'user': {
    ...
  },
  'createdAt': '...',
  'updatedAt': '...'
}]
```

### `GET /blocked-addresses`

Returns an array of blocked addresses. Requires an access token with the 
`manage:faucet` permission.

#### Response

```
[{
  'id': 1,
  'address': 'akash1...',
  'createdAt': '...',
  'updatedAt': '...'
}]
```

### `POST /blocked-addresses`

Create a blocked addresses. Requires an access token with the `manage:faucet` permission.

#### Params

```
{
  address: 'akash1...'
}
```

#### Response

```
{}
```

### `DELETE /blocked-addresses/{id}`

Delete a blocked address.
