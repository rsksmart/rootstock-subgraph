import { Address, BigDecimal, ethereum } from '@graphprotocol/graph-ts'
import { Token, LiquidityPoolToken, LiquidityPool, PoolVolumeItem } from '../../generated/schema'
import { ConversionEventForSwap } from './Swap'

export function updateVolumes(parsedEvent: ConversionEventForSwap, liquidityPoolAddress: Address, event: ethereum.Event): void {
  updateTokensVolume(parsedEvent)
  updatePoolVolume(parsedEvent, liquidityPoolAddress, event)
}

function updateTokensVolume(parsedEvent: ConversionEventForSwap): void {
  updateTokenVolume(parsedEvent.fromToken, parsedEvent.fromAmount)
  parsedEvent.fromToken.save()

  updateTokenVolume(parsedEvent.toToken, parsedEvent.toAmount)
  parsedEvent.toToken.save()
}

function updateTokenVolume(token: Token, amount: BigDecimal): Token {
  token.tokenVolume = token.tokenVolume.plus(amount)
  token.btcVolume = token.btcVolume.plus(amount.times(token.lastPriceBtc))
  token.usdVolume = token.usdVolume.plus(amount.times(token.lastPriceUsd))

  return token
}

function updatePoolVolume(parsedEvent: ConversionEventForSwap, liquidityPoolAddress: Address, event: ethereum.Event): void {
  const fromTokenEntity = LiquidityPoolToken.load(liquidityPoolAddress.toHexString() + parsedEvent.fromToken.id)
  if (fromTokenEntity != null) {
    fromTokenEntity.volumeSold = fromTokenEntity.volumeSold.plus(parsedEvent.fromAmount)
    fromTokenEntity.totalVolume = fromTokenEntity.totalVolume.plus(parsedEvent.fromAmount)
    fromTokenEntity.save()
  }

  const toTokenEntity = LiquidityPoolToken.load(liquidityPoolAddress.toHexString() + parsedEvent.toToken.id)
  if (toTokenEntity != null) {
    toTokenEntity.volumeBought = toTokenEntity.volumeBought.plus(parsedEvent.toAmount)
    toTokenEntity.totalVolume = toTokenEntity.totalVolume.plus(parsedEvent.toAmount)
    toTokenEntity.save()
  }

  const pool = LiquidityPool.load(liquidityPoolAddress.toHexString())
  if (pool != null) {
    const id = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()

    const item = new PoolVolumeItem(id)
    item.pool = pool.id
    item.btcAmount = parsedEvent.fromAmount.times(parsedEvent.fromToken.lastPriceBtc).truncate(18)
    item.conversion = id
    item.timestamp = event.block.timestamp.toI32()
    item.transaction = event.transaction.hash.toHexString()
    item.save()
  }
}
