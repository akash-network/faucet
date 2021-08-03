var { DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing")
var { assertIsBroadcastTxSuccess, SigningStargateClient, StargateClient, coins, StdFee } = require("@cosmjs/stargate")

const FAUCET_MNEMONIC = process.env.FAUCET_MNEMONIC
const FAUCET_AMOUNT = process.env.FAUCET_AMOUNT || 1000
const FAUCET_FEES = process.env.FAUCET_FEES || 5000
const RPC_ENDPOINT = process.env.RPC_ENDPOINT

const getWallet = () => {
  return DirectSecp256k1HdWallet.fromMnemonic(FAUCET_MNEMONIC, { prefix: 'akash' })
}

const sendTokens = async (recipient) => {
  const wallet = await getWallet()
  const [account] = await wallet.getAccounts()

  const client = await SigningStargateClient.connectWithSigner(RPC_ENDPOINT, wallet);

  const amount = coins(parseInt(FAUCET_AMOUNT), 'uakt')
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
  const result = await client.signAndBroadcast(account.address, [sendMsg], fee, "Sent from faucet");
  assertIsBroadcastTxSuccess(result);
}

module.exports = {
  getWallet: getWallet,
  sendTokens: sendTokens
}
