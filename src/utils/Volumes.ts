import { Address, BigDecimal, log } from '@graphprotocol/graph-ts'

import { Token, LiquidityPoolToken } from '../../generated/schema'
import { ConversionEventForSwap } from './Swap'
import { createAndReturnUserTotals, createAndReturnProtocolStats } from './ProtocolStats'

export function updateVolumes(parsedEvent: ConversionEventForSwap, liquidityPoolAddress: Address): void {
  const volumeUsd = tokenVolumeUsd(parsedEvent.fromToken, parsedEvent.fromAmount)
  updateTokensVolume(parsedEvent)
  updateUserTotalVolume(parsedEvent, volumeUsd)
  updatePoolVolume(parsedEvent, liquidityPoolAddress)
  updateProtocolStatsVolume(volumeUsd)
}
function updateTokensVolume(parsedEvent: ConversionEventForSwap): void {
  const fromToken = Token.load(parsedEvent.fromToken.toHex())

  if (fromToken != null) {
    updateTokenVolume(fromToken, parsedEvent.fromAmount)
    fromToken.save()
  }

  const toToken = Token.load(parsedEvent.toToken.toHex())

  if (toToken != null) {
    updateTokenVolume(toToken, parsedEvent.toAmount)
    toToken.save()
  }
}

function updateTokenVolume(token: Token, amount: BigDecimal): Token {
  token.tokenVolume = token.tokenVolume.plus(amount)
  token.btcVolume = token.btcVolume.plus(amount.times(token.lastPriceBtc))
  token.usdVolume = token.usdVolume.plus(amount.times(token.lastPriceUsd))

  return token
}

function updateUserTotalVolume(parsedEvent: ConversionEventForSwap, volumeUsd: BigDecimal): void {
  // TODO: should we load trader or user or both?
  const userTotalsEntity = createAndReturnUserTotals(parsedEvent.user)
  log.debug('src/utils/Volumes.ts ~ Volumes.ts ~ 39 ~  parsedEvent.user.toHex(){}', [parsedEvent.user.toHex()])

  userTotalsEntity.totalAmmVolumeUsd = userTotalsEntity.totalAmmVolumeUsd.plus(volumeUsd)
  userTotalsEntity.save()
}

function tokenVolumeUsd(token: Address, amount: BigDecimal): BigDecimal {
  const tokenEntity = Token.load(token.toHex())
  let volumeUsd = BigDecimal.zero()
  if (tokenEntity != null) {
    volumeUsd = amount.times(tokenEntity.lastPriceUsd)
  }
  return volumeUsd
}

function updateProtocolStatsVolume(volumeUsd: BigDecimal): void {
  const protocolStats = createAndReturnProtocolStats()
  protocolStats.totalAmmVolumeUsd = protocolStats.totalAmmVolumeUsd.plus(volumeUsd)
  protocolStats.save()
}

function updatePoolVolume(parsedEvent: ConversionEventForSwap, liquidityPoolAddress: Address): void {
  let fromTokenEntity = LiquidityPoolToken.load(liquidityPoolAddress.toHexString() + parsedEvent.fromToken.toHexString())
  if (fromTokenEntity != null) {
    fromTokenEntity.volumeSold = fromTokenEntity.volumeSold.plus(parsedEvent.fromAmount)
    fromTokenEntity.totalVolume = fromTokenEntity.totalVolume.plus(parsedEvent.fromAmount)
    fromTokenEntity.save()
  }

  let toTokenEntity = LiquidityPoolToken.load(liquidityPoolAddress.toHexString() + parsedEvent.toToken.toHexString())
  if (toTokenEntity != null) {
    toTokenEntity.volumeBought = toTokenEntity.volumeBought.plus(parsedEvent.toAmount)
    toTokenEntity.totalVolume = toTokenEntity.totalVolume.plus(parsedEvent.toAmount)
    toTokenEntity.save()
  }
}
