import { Address } from '@graphprotocol/graph-ts'
import { PoolToken, TokenPoolToken } from '../../generated/schema'
import { ERC20 } from '../../generated/templates/ERC20/ERC20'

export class IGetPoolToken {
  poolToken: PoolToken
  isNew: boolean
}

export function createAndReturnPoolToken(poolTokenAddress: Address, liquidityPoolAddress: Address, tokenAddress: Address): IGetPoolToken {
  let isNew = false
  let poolToken = PoolToken.load(poolTokenAddress.toHex())
  if (poolToken == null) {
    poolToken = new PoolToken(poolTokenAddress.toHex())

    isNew = true

    let poolTokenContract = ERC20.bind(poolTokenAddress)
    let poolTokenNameResult = poolTokenContract.try_name()
    if (!poolTokenNameResult.reverted) {
      poolToken.name = poolTokenNameResult.value
    }
    let poolTokenSymbolResult = poolTokenContract.try_symbol()
    if (!poolTokenSymbolResult.reverted) {
      poolToken.symbol = poolTokenSymbolResult.value
    }
    let smartTokenDecimalsResult = poolTokenContract.try_decimals()
    if (!smartTokenDecimalsResult.reverted) {
      poolToken.decimals = smartTokenDecimalsResult.value
    }

    poolToken.save()

    let tokenPoolToken = TokenPoolToken.load(tokenAddress.toHex() + poolTokenAddress.toHex())
    if (tokenPoolToken === null) {
      tokenPoolToken = new TokenPoolToken(tokenAddress.toHex() + poolTokenAddress.toHex())
    }

    tokenPoolToken.token = tokenAddress.toHex()
    tokenPoolToken.poolToken = poolTokenAddress.toHex()
    tokenPoolToken.liquidityPool = liquidityPoolAddress.toHex()
    tokenPoolToken.save()
  }

  return { poolToken, isNew }
}
