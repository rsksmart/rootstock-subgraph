/**
 * 1. Update ALL lastPriceUsd value when the btc price changes for ALL tokens
 * 2. Update candlesticks for usd for ALL tokens
 * 3. Update candlesticks for btc for ONE token
 */

import { BigDecimal } from '@graphprotocol/graph-ts'
import { Token } from '../../generated/schema'
import { createAndReturnProtocolStats } from './ProtocolStats'

export function updateLastPriceUsdAll(newBtcPrice: BigDecimal): void {
  let protocolStats = createAndReturnProtocolStats()
  for (var i = 0; i < protocolStats.tokens.length; i++) {
    const token = protocolStats.tokens[i]
    let tokenEntity = Token.load(token)
    if (tokenEntity !== null) {
      tokenEntity.lastPriceUsd = tokenEntity.lastPriceBtc.times(newBtcPrice)
      tokenEntity.save()
    }
  }
}
