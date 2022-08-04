require('dotenv').config()
/** Contracts to be used by the scaffoldChangeBlocks script for when a contract has been redeployed */

const wrapperProxyContractsTestnet = {
    originalName: "rbtcWrapperProxyTokenConverted",
    changeBlocks: [
        {
            name: "rbtcWrapperProxyTokenConverted1729783",
            address: '0xFFB9470e0B11aAC25a331D8E6Df557Db6c3c0c53',
            startBlock: 1729783
        },
        {
            name: "rbtcWrapperProxyTokenConverted1748059",
            address: '0x106f117Af68586A994234E208c29DE0f1A764C60',
            startBlock: 1748059
        },
        {
            name: "rbtcWrapperProxyTokenConverted1834540",
            address: '0x2C468f9c82C20c37cd1606Cf3a09702f94910691',
            startBlock: 1834540
        },
        {
            name: "rbtcWrapperProxyTokenConverted1839810",
            address: '0x6b1a4735b1E25ccE9406B2d5D7417cE53d1cf90e',
            startBlock: 1839810
        },
    ]
}

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

const wrapperProxyContractsMainnet = {
    originalName: "rbtcWrapperProxyTokenConverted",
    changeBlocks: [
        {
            name: "rbtcWrapperProxyTokenConverted3261258",
            address: '0xA3B6E18B9A4ECAE44C7355458Ae7Db8874018C22',
            startBlock: 3261258
        },
        {
            name: "rbtcWrapperProxyTokenConverted3368577",
            address: '0xa917BF723433d020a15629eba71f6C2a6B38e52d',
            startBlock: 3368577
        },
        {
            name: "rbtcWrapperProxyTokenConverted4525385",
            address: '0x2BEe6167f91D10db23252e03de039Da6b9047D49',
            startBlock: 4525385
        }
    ]
}

module.exports = {
    newDataSources: process.env.NETWORK === 'mainnet' ? [
        wrapperProxyContractsMainnet,
        governorContractsMainnet
    ] : [
        wrapperProxyContractsTestnet,
        feeSharingProxyContractsTestnet,
        governorContractsTestnet
    ]
}