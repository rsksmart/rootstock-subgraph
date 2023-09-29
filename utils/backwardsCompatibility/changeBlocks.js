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
        },
        {
            name: "GovernorAlphaEvents4330355",
            address: "0x69dB16Aa6EEf291Fec522581F4fc9c82dFE60beD",
            startBlock: 4330355
        },
        {
            name: "GovernorAlphaEvents4330360",
            address: "0xc9a558f522755C1Ea6C25a885ae8131E00c9971A",
            startBlock: 4330360
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