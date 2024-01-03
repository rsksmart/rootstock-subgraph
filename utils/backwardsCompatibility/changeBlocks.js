require('dotenv').config()
/** Contracts to be used by the scaffoldChangeBlocks script for when a contract has been redeployed */

module.exports = {
    newDataSources: process.env.NETWORK === 'mainnet' ? [] : []
}