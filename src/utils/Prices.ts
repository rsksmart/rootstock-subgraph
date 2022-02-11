/**
 * 1. Update ALL lastPriceUsd value when the btc price changes for ALL tokens
 * 2. Update candlesticks for usd for ALL tokens
 * 3. Update candlesticks for btc for ONE token
 */

import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { Token } from '../../generated/schema'
import { createAndReturnProtocolStats } from './ProtocolStats'
import { USDTAddress, WRBTCAddress } from '../contracts/contracts'
import { handleCandlesticks, ICandleSticks } from './Candlesticks'

export function updateLastPriceUsdAll(newBtcPrice: BigDecimal, timestamp: BigInt, usdVolume: BigDecimal): void {
  let protocolStats = createAndReturnProtocolStats()
  for (var i = 0; i < protocolStats.tokens.length; i++) {
    const token = protocolStats.tokens[i]

    let tokenEntity = Token.load(token)
    if (tokenEntity !== null) {
      if (tokenEntity.id.toLowerCase() == USDTAddress.toLowerCase()) {
        tokenEntity.lastPriceUsd = BigDecimal.fromString('1')
        tokenEntity.save()
      } else {
        const oldUsdPrice = tokenEntity.lastPriceUsd
        tokenEntity.lastPriceUsd = tokenEntity.lastPriceBtc.times(newBtcPrice)
        const newUsdPrice = tokenEntity.lastPriceUsd
        tokenEntity.save()

        const tradingPair = token + '_' + USDTAddress.toLowerCase()

        handleCandlesticks({
          blockTimestamp: timestamp,
          newPrice: newUsdPrice,
          oldPrice: oldUsdPrice,
          tradingPair: tradingPair,
          volume: BigDecimal.zero(),
        })
      }
    }
  }
}

export function updateTokenUsdCandlesticks(token: Address, newUsdPrice: BigDecimal): void {}

export function updateTokenBtcCandlesticks(token: Address, newBtcPrice: BigDecimal): void {}
