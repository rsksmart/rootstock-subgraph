/**
 * 1. Update ALL lastPriceUsd value when the btc price changes for ALL tokens
 * 2. Update candlesticks for usd for ALL tokens
 * 3. Update candlesticks for btc for ONE token
 */

import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { Token } from '../../generated/schema'
import { createAndReturnProtocolStats } from './ProtocolStats'
import { WRBTCAddress } from '../contracts/contracts'
import { decimal } from '@protofire/subgraph-toolkit'

export function updateLastPriceUsdAll(): void {
  const protocolStats = createAndReturnProtocolStats()
  const USDTAddress = protocolStats.usdStablecoin.toLowerCase()
  const btcUsdPrice = protocolStats.btcUsdPrice
  for (let i = 0; i < protocolStats.tokens.length; i++) {
    const token = protocolStats.tokens[i]
    if (token.toLowerCase() != WRBTCAddress.toLowerCase() && token.toLowerCase() != USDTAddress.toLowerCase()) {
      const tokenEntity = Token.load(token)
      if (tokenEntity !== null) {
        log.debug('UPDATING LAST PRICE USD, lastPriceUsd: {}, btcToUsdPrice: {}', [tokenEntity.lastPriceUsd.toString(), btcUsdPrice.toString()])
        tokenEntity.prevPriceUsd = tokenEntity.lastPriceUsd
        tokenEntity.lastPriceUsd = tokenEntity.lastPriceBtc.times(btcUsdPrice).truncate(18)
        tokenEntity.save()
      } else {
        /**TODO: Handle non-BTC pairs */
      }
    }
  }
}

export function convertToUsd(currency: Address, amount: BigInt): BigDecimal {
  const token = Token.load(currency.toHexString())
  if (token != null) {
    const usdPrice = token.lastPriceUsd
    return decimal.fromBigInt(amount, token.decimals).times(usdPrice).truncate(18)
  } else {
    log.debug('TOKEN WAS NULL: {}', [currency.toHexString()])
    return BigDecimal.zero()
  }
}

class PriceConversion {
  tokenToUsd: BigDecimal
  tokenToBtc: BigDecimal
}

export function getTokenPriceConversions(token: Address): PriceConversion {
  const tokenEntity = Token.load(token.toHexString())
  if (tokenEntity != null) {
    return {
      tokenToBtc: tokenEntity.lastPriceBtc,
      tokenToUsd: tokenEntity.lastPriceUsd,
    }
  } else {
    return {
      tokenToBtc: BigDecimal.zero(),
      tokenToUsd: BigDecimal.zero(),
    }
  }
}
