export const version2Block = '{{abiChangeBlocks.liquidityPoolV1Converter.V2}}'

//For Mainnet, this is 13/12/2021
// For Testnet, this is 06/12/2021

/** There are 2 types of backwards compatibility. ABI changes, address changes, and changes to both */

export const addressChanges = {
  swapNetwork: {
    blocks: [],
    newAddress: [],
  },
  rBTCWrapperProxy: {
    blocks: [],
    newAddress: [],
  },
}

export const abiChanges = {
  iSovryn: {
    blocks: [],
    abiNames: [],
  },
  liquidityPoolV1Converter: {
    blocks: ['{{abiChangeBlocks.liquidityPoolV1Converter.V2}}'],
    abiNames: ['LiquidityPoolV1ConverterProtocolFee'],
  },
}
