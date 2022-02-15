const wrapperProxyContractsTestnet = {
    originalName: "FeeSharingProxy",
    changeBlocks: [
        {
            name: "FeeSharingProxy1729783",
            address: '0xFFB9470e0B11aAC25a331D8E6Df557Db6c3c0c53',
            block: 1729783
        },
        {
            name: "FeeSharingProxy1748059",
            address: '0x106f117Af68586A994234E208c29DE0f1A764C60',
            block: 1748059
        },
        {
            name: "FeeSharingProxy1834540",
            address: '0x2C468f9c82C20c37cd1606Cf3a09702f94910691',
            block: 1834540
        },
        {
            name: "FeeSharingProxy1839810",
            address: '0x6b1a4735b1E25ccE9406B2d5D7417cE53d1cf90e',
            block: 1839810
        },
    ]
}

const wrapperProxyContractsMainnet = {

}

module.exports = {
    wrapperProxyContracts: process.env.NETWORK === 'mainnet' ? wrapperProxyContractsMainnet : wrapperProxyContractsTestnet
}