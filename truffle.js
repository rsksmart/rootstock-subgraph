require('babel-register')
require('babel-polyfill')

require('dotenv').config()

const HDWalletProvider = require('truffle-hdwallet-provider')

module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*',
    },
    ropsten: {
      provider: function () {
        return new HDWalletProvider(
          process.env.MNEMONIC,
          `https://ropsten.infura.io/v3/${process.env.ROPSTEN_INFURA_API_KEY}`
        )
      },
      network_id: '3',
    },
    rsk_testnet: {
      provider: function () {
        return new HDWalletProvider(
          process.env.PKEY,
          'https://testnet2.sovryn.app/rpc'
        )
      },
      network_id: '31',
    },
    rsk_mainnet: {
      provider: function () {
        return new HDWalletProvider(
          process.env.PKEY,
          'http://3.12.64.85:4444/'
        )
      },
      network_id: '31',
    },
  },
  compilers: {
    solc: {
      version: '0.4.25'    // Fetch exact version from solc-bin (default: truffle's version)
    }
  }
}
