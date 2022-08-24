import { Address, log } from '@graphprotocol/graph-ts'
import { LiquidityPoolToken, PoolToken } from '../../generated/schema'
import { ERC20 } from '../../generated/templates/LiquidityPoolV1Converter/ERC20'

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

    const poolTokenContract = ERC20.bind(poolTokenAddress)
    const poolTokenNameResult = poolTokenContract.try_name()
    if (!poolTokenNameResult.reverted) {
      poolToken.name = poolTokenNameResult.value
    }
    const poolTokenSymbolResult = poolTokenContract.try_symbol()
    if (!poolTokenSymbolResult.reverted) {
      poolToken.symbol = poolTokenSymbolResult.value
    }
    const smartTokenDecimalsResult = poolTokenContract.try_decimals()
    if (!smartTokenDecimalsResult.reverted) {
      poolToken.decimals = smartTokenDecimalsResult.value
    }

    poolToken.liquidityPool = liquidityPoolAddress.toHexString()
    poolToken.underlyingAssets = [tokenAddress.toHexString()]

    poolToken.save()
  } else {
    poolToken.underlyingAssets = poolToken.underlyingAssets.concat([tokenAddress.toHexString()])

    poolToken.save()
  }

  return { poolToken, isNew }
}

/** IMPORTANT: This function is only for use when needing to use a pool token id in a composite ID.
 * The empty string returned if a pool token does not exist is not a very nice implementation, this should probably be improved
 * */
export function getPoolTokenFromToken(token: Address, liquidityPool: Address): string {
  const liquidityPoolTokenEntity = LiquidityPoolToken.load(liquidityPool.toHexString() + token.toHexString())
  if (liquidityPoolTokenEntity != null) {
    return liquidityPoolTokenEntity.poolToken
  } else {
    log.debug('PoolToken wal NULL for token: {}, liquidityPool: {}', [token.toHexString(), liquidityPool.toHexString()])
    return ''
  }
}
