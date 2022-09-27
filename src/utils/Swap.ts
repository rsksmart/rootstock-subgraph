import { Address, BigInt, BigDecimal } from '@graphprotocol/graph-ts'
import { Swap, Token } from '../../generated/schema'
import { createAndReturnUser } from './User'
import { WRBTCAddress } from '../contracts/contracts'
import { updateLastPriceUsdAll } from './Prices'
import { decimal } from '@protofire/subgraph-toolkit'
import { createAndReturnProtocolStats } from './ProtocolStats'

export class ConversionEventForSwap {
  transactionHash: string
  fromToken: Address
  toToken: Address
  fromAmount: BigDecimal
  toAmount: BigDecimal
  timestamp: i32
  user: Address
  trader: Address
  lpFee: BigDecimal
  protocolFee: BigDecimal
}

export function createAndReturnSwap(event: ConversionEventForSwap): Swap {
  const isUserSwap = event.user.toHexString() == event.trader.toHexString()
  let swapEntity = Swap.load(event.transactionHash)

  /** Create swap  */
  if (swapEntity == null) {
    swapEntity = new Swap(event.transactionHash)
    swapEntity.numConversions = 1
    swapEntity.fromToken = event.fromToken.toHexString()
    swapEntity.toToken = event.toToken.toHexString()
    swapEntity.fromAmount = event.fromAmount
    swapEntity.toAmount = event.toAmount
    swapEntity.rate = event.fromAmount.div(event.toAmount)
    swapEntity.isMarginTrade = false
    swapEntity.isBorrow = false
    swapEntity.isLimit = false
    swapEntity.timestamp = event.timestamp
    swapEntity.transaction = event.transactionHash
    if (isUserSwap) {
      const user = createAndReturnUser(event.user, BigInt.fromI32(event.timestamp))
      swapEntity.user = user.id
    }
  } else {
    /** Swap already exists - this means it has multiple conversion events */
    swapEntity.numConversions += 1
    swapEntity.toToken = event.toToken.toHexString()
    swapEntity.toAmount = event.toAmount
    swapEntity.rate = swapEntity.fromAmount.div(event.toAmount)
  }
  swapEntity.save()

  return swapEntity
}

export function updatePricing(event: ConversionEventForSwap): void {
  /** This threshold is set so that the last traded price is not skewed by rounding errors */
  const threshold = decimal.fromNumber(0.00000001)
  if (event.fromAmount < threshold || event.toAmount < threshold) {
    return
  }
  const protocolStatsEntity = createAndReturnProtocolStats()
  const USDTAddress = protocolStatsEntity.usdStablecoin.toLowerCase()
  let btcUsdPrice = protocolStatsEntity.btcUsdPrice

  const BTCToken = Token.load(WRBTCAddress.toLowerCase())

  if (BTCToken != null) {
    let token: Token | null
    let tokenAmount: BigDecimal
    let btcAmount: BigDecimal

    if (event.fromToken.toHexString().toLowerCase() == WRBTCAddress.toLowerCase()) {
      token = Token.load(event.toToken.toHexString())
      tokenAmount = event.toAmount
      btcAmount = event.fromAmount
    } else if (event.toToken.toHexString().toLowerCase() == WRBTCAddress.toLowerCase()) {
      token = Token.load(event.fromToken.toHexString())
      tokenAmount = event.fromAmount
      btcAmount = event.toAmount
    } else {
      /** TODO: Handle case where neither token is rBTC for when AMM pools with non-rBTC tokens are introduced */
      return
    }

    /** IF SWAP IS BTC/USDT: Update lastPriceUsd on BTC */

    if (event.fromToken.toHexString().toLowerCase() == USDTAddress.toLowerCase() || event.toToken.toHexString().toLowerCase() == USDTAddress.toLowerCase()) {
      btcUsdPrice = tokenAmount.div(btcAmount)
      protocolStatsEntity.btcUsdPrice = btcUsdPrice
      protocolStatsEntity.save()
      BTCToken.prevPriceUsd = BTCToken.lastPriceUsd
      BTCToken.lastPriceUsd = btcUsdPrice
      BTCToken.prevPriceBtc = decimal.ONE
      BTCToken.lastPriceBtc = decimal.ONE

      updateLastPriceUsdAll()
    }

    if (token != null) {
      const newPriceBtc = btcAmount.div(tokenAmount)
      const newPriceUsd = newPriceBtc.times(btcUsdPrice)

      if (token.lastPriceUsd.gt(BigDecimal.zero())) {
        token.lastPriceUsd = newPriceUsd
      }

      token.prevPriceBtc = token.lastPriceBtc
      token.lastPriceBtc = newPriceBtc

      if (token.id.toLowerCase() == USDTAddress.toLowerCase()) {
        token.lastPriceUsd = decimal.ONE
      }

      token.save()
      BTCToken.save()
    }
  }
}
