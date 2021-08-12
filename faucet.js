var { DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing")
var { assertIsBroadcastTxSuccess, SigningStargateClient, StargateClient, coins, StdFee } = require("@cosmjs/stargate")
var parse = require('parse-duration')

const FAUCET_MNEMONIC = process.env.FAUCET_MNEMONIC
const FAUCET_FEES = process.env.FAUCET_FEES || 5000
const FAUCET_WAIT_PERIOD = process.env.FAUCET_WAIT_PERIOD || '24h'
const FAUCET_DISTRIBUTION_AMOUNT = process.env.FAUCET_DISTRIBUTION_AMOUNT || 1000
const NETWORK_RPC_NODE = process.env.NETWORK_RPC_NODE

const getWallet = () => {
  return DirectSecp256k1HdWallet.fromMnemonic(FAUCET_MNEMONIC, { prefix: 'akash' })
}

const getWaitPeriod = () => {
  return parse(FAUCET_WAIT_PERIOD)
}

const getDistributionAmount = () => {
  return FAUCET_DISTRIBUTION_AMOUNT
}

const sendTokens = async (recipient, amount_uakt) => {
  const wallet = await getWallet()
  const [account] = await wallet.getAccounts()

  if(!amount_uakt) amount_uakt = getDistributionAmount()

  const client = await SigningStargateClient.connectWithSigner(NETWORK_RPC_NODE, wallet);

  const amount = coins(parseInt(amount_uakt), 'uakt')
  const fee = {
    amount: coins(parseInt(FAUCET_FEES), "uakt"),
    gas: "180000"
  }
  const sendMsg = {
    typeUrl: "/cosmos.bank.v1beta1.MsgSend",
    value: {
      fromAddress: account.address,
      toAddress: recipient,
      amount: amount,
    },
  };
  return await client.signAndBroadcast(account.address, [sendMsg], fee, "Sent from faucet");
}

module.exports = {
  getWallet: getWallet,
  getWaitPeriod: getWaitPeriod,
  getDistributionAmount: getDistributionAmount,
  sendTokens: sendTokens
}
