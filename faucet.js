var { DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing")
var { assertIsBroadcastTxSuccess, SigningStargateClient, StargateClient, coins, StdFee } = require("@cosmjs/stargate")
var parse = require('parse-duration')

const NETWORK_RPC_NODE = process.env.NETWORK_RPC_NODE
const FAUCET_MNEMONIC = process.env.FAUCET_MNEMONIC
const FAUCET_WAIT_PERIOD = process.env.FAUCET_WAIT_PERIOD || '24h'
const FAUCET_DISTRIBUTION_AMOUNT = process.env.FAUCET_DISTRIBUTION_AMOUNT || 1000
const FAUCET_FEES = process.env.FAUCET_FEES || 5000
const FAUCET_GAS = process.env.FAUCET_GAS || 180000
const FAUCET_MEMO = process.env.FAUCET_MEMO

const getWallet = () => {
  return DirectSecp256k1HdWallet.fromMnemonic(FAUCET_MNEMONIC, { prefix: 'akash' })
}

const getWaitPeriod = () => {
  return parse(FAUCET_WAIT_PERIOD)
}

const getDistributionAmount = () => {
  return FAUCET_DISTRIBUTION_AMOUNT
}

const getChainId = async () => {
  const wallet = await getWallet()
  const client = await SigningStargateClient.connectWithSigner(NETWORK_RPC_NODE, wallet)
  return await client.getChainId()
}

const sendTokens = async (recipient, amount_uakt) => {
  const wallet = await getWallet()
  const [account] = await wallet.getAccounts()
  const client = await SigningStargateClient.connectWithSigner(NETWORK_RPC_NODE, wallet)

  if(!amount_uakt) amount_uakt = getDistributionAmount()
  const amount = coins(parseInt(amount_uakt), 'uakt')
  const fee = {
    amount: coins(parseInt(FAUCET_FEES), "uakt"),
    gas: FAUCET_GAS
  }
  const sendMsg = {
    typeUrl: "/cosmos.bank.v1beta1.MsgSend",
    value: {
      fromAddress: account.address,
      toAddress: recipient,
      amount: amount,
    },
  }
  return await client.signAndBroadcast(account.address, [sendMsg], fee, FAUCET_MEMO)
}

module.exports = {
  getWallet,
  getWaitPeriod,
  getDistributionAmount,
  getChainId,
  sendTokens
}
