require('dotenv').config()
/** Contracts to be used by the scaffoldChangeBlocks script for when a contract has been redeployed */

const feeSharingProxyContractsTestnet = {
    originalName: "FeeSharingProxy",
    changeBlocks: [
        {
            name: "FeeSharingProxy2493301",
            address: "0xedD92fb7C556E4A4faf8c4f5A90f471aDCD018f4",
            startBlock: 2493301
        }
    ]
}

const governorContractsTestnet = {
    originalName: "GovernorAlphaEvents",
    changeBlocks: [
        {
            name: "GovernorAlphaEvents1606451",
            address: "0x1528f0341a1Ea546780caD690F54b4FBE1834ED4",
            startBlock: 1606451
        },
        {
            name: "GovernorAlphaEvents1606443",
            address: "0x058FD3F6a40b92b311B49E5e3E064300600021D7",
            startBlock: 1606443
        }
    ]
}

const governorContractsMainnet = {
    originalName: "GovernorAlphaEvents",
    changeBlocks: [
        {
            name: "GovernorAlphaEvents3100270",
            address: "0x6496DF39D000478a7A7352C01E0E713835051CcD",
            startBlock: 3100270
        },
        {
            name: "GovernorAlphaEvents3100277",
            address: "0xfF25f66b7D7F385503D70574AE0170b6B1622dAd",
            startBlock: 3100277
        }
    ]
}

module.exports = {
    newDataSources: process.env.NETWORK === 'mainnet' ? [
        governorContractsMainnet
    ] : [
        feeSharingProxyContractsTestnet,
        governorContractsTestnet
    ]
}