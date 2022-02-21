/** Contracts to be used by thte scaffoldChangeBlocks script for when a contract has been redployed */

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
            address: "0x85B19DD6E3c6cCC54D40c1bAEC15058962B8245b",
            startBlock: 2493301
        }
    ]
}

const wrapperProxyContractsMainnet = {

}

module.exports = {
    newDataSources: process.env.NETWORK === 'mainnet' ? [
        wrapperProxyContractsMainnet,
    ] : [
        wrapperProxyContractsTestnet,
        feeSharingProxyContractsTestnet
    ]
}