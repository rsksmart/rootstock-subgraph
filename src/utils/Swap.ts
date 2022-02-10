import { Address, Bytes, BigInt } from '@graphprotocol/graph-ts'
import { Swap, Token, User } from '../../generated/schema'
import { createAndReturnUser } from './User'
import { USDTAddress, WRBTCAddress } from '../contracts/contracts'
import { updateLastPriceUsdAll } from './Prices'

export class ConversionEventForSwap {
  transactionHash: Bytes
  fromToken: Address
  toToken: Address
  fromAmount: BigInt
  toAmount: BigInt
  timestamp: BigInt
  user: Address
  trader: Address
}

export function createAndReturnSwap(event: ConversionEventForSwap): Swap {
  let userEntity: User | null = null
  /** Check if the trader property on the swap is the same as the caller of the tx. If it is, this is a user-instigated swap */
  if (event.user.toHexString() == event.trader.toHexString()) {
    userEntity = createAndReturnUser(event.user)
  }
  let swapEntity = Swap.load(event.transactionHash.toHex())

  /** Create swap  */
  if (swapEntity == null) {
    swapEntity = new Swap(event.transactionHash.toHexString())
    swapEntity.numConversions = 1
    swapEntity.fromToken = event.fromToken.toHexString()
    swapEntity.toToken = event.toToken.toHexString()
    swapEntity.fromAmount = event.fromAmount
    swapEntity.toAmount = event.toAmount
    swapEntity.rate = event.fromAmount.divDecimal(event.toAmount.toBigDecimal())
    if (userEntity != null) {
      swapEntity.user = userEntity.id
      userEntity.numSwaps += 1
      userEntity.save()
    }
    swapEntity.isMarginTrade = false
    swapEntity.isBorrow = false
    swapEntity.timestamp = event.timestamp
  } else {
    /** Swap already exists - this means it has multiple conversion events */
    swapEntity.numConversions += 1
    swapEntity.toToken = event.toToken.toHexString()
    swapEntity.toAmount = event.toAmount
    swapEntity.rate = event.fromAmount.divDecimal(event.toAmount.toBigDecimal())
  }
  swapEntity.save()

  /**
   * Update lastPriceBtc on token
   */
  if (event.fromToken.toHexString() == WRBTCAddress.toLowerCase()) {
    let token = Token.load(event.toToken.toHexString())
    if (token != null) {
      token.lastPriceBtc = event.toAmount.divDecimal(event.fromAmount.toBigDecimal())
      token.lastPriceUsd = token.lastPriceBtc.times(token.lastPriceUsd)
      token.save()
    }
    /** TODO: Update token candlesticks for btc and usd */
  } else if (event.toToken.toHexString() == WRBTCAddress.toLowerCase()) {
    let token = Token.load(event.fromToken.toHexString())
    if (token != null) {
      token.lastPriceBtc = event.fromAmount.divDecimal(event.toAmount.toBigDecimal())
      token.lastPriceUsd = token.lastPriceBtc.times(token.lastPriceUsd)
      token.save()
    }
    /** TODO: Update token candlesticks for btc and usd */
  }

  /** IF SWAP IS BTC/USDT: Update lastPriceUsd on BTC */

  if (event.fromToken.toHexString() == USDTAddress.toLowerCase() && event.toToken.toHexString() == WRBTCAddress.toLowerCase()) {
    let BTCToken = Token.load(WRBTCAddress.toLowerCase())
    if (BTCToken != null) {
      BTCToken.lastPriceUsd = event.toAmount.divDecimal(event.fromAmount.toBigDecimal())
      BTCToken.save()
      updateLastPriceUsdAll(BTCToken.lastPriceUsd)
    }
    /** TODO: Update all candlesticks for usd */
  } else if (event.toToken.toHexString() == USDTAddress.toLowerCase() && event.fromToken.toHexString() == WRBTCAddress.toLowerCase()) {
    let BTCToken = Token.load(WRBTCAddress.toLowerCase())
    if (BTCToken != null) {
      BTCToken.lastPriceUsd = event.fromAmount.divDecimal(event.toAmount.toBigDecimal())
      BTCToken.save()
      updateLastPriceUsdAll(BTCToken.lastPriceUsd)
    }
    /** TODO: Update all candlesticks for usd */
  }

  return swapEntity
}
