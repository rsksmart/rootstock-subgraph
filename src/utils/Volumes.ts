import { Address, BigDecimal } from '@graphprotocol/graph-ts'
import { Token, LiquidityPoolToken } from '../../generated/schema'
import { ConversionEventForSwap } from './Swap'

export function updateVolumes(parsedEvent: ConversionEventForSwap, liquidityPoolAddress: Address): void {
  updateTokensVolume(parsedEvent)
  updatePoolVolume(parsedEvent, liquidityPoolAddress)
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

function updatePoolVolume(parsedEvent: ConversionEventForSwap, liquidityPoolAddress: Address): void {
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
}
