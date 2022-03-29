import { Address, log } from '@graphprotocol/graph-ts'
import { LiquidityPoolToken, PoolToken, TokenPoolToken } from '../../generated/schema'
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

/** IMPORTANT: This function is only for use when needing to use a pool token id in a composite ID.
 * The empty string returned if a pool token does not exist is not a very nice implementation, this should probably be improved
 * */
export function getPoolTokenFromToken(token: Address, liquidityPool: Address): string {
  let tokenPoolTokenEntity = LiquidityPoolToken.load(liquidityPool.toHexString() + token.toHexString())
  if (tokenPoolTokenEntity != null) {
    return tokenPoolTokenEntity.poolToken
  } else {
    log.debug('src/utils/PoolToken.ts ~ PoolToken.ts ~ 56 ~  : {}', [token.toHexString(), liquidityPool.toHexString()])
    return ''
  }
}
