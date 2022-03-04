import { Address, Bytes, BigInt, BigDecimal } from '@graphprotocol/graph-ts'
import { Swap, Token, User } from '../../generated/schema'
import { createAndReturnUser } from './User'
import { USDTAddress, WRBTCAddress } from '../contracts/contracts'
import { updateLastPriceUsdAll } from './Prices'
import { decimal } from '@protofire/subgraph-toolkit'
import { handleCandlesticks } from './Candlesticks'

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
    swapEntity.rate = event.fromAmount.divDecimal(event.toAmount.toBigDecimal()).truncate(8)
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
    swapEntity.rate = event.fromAmount.divDecimal(event.toAmount.toBigDecimal()).truncate(8)
  }
  swapEntity.save()

  updatePricingAndCandlesticks(event)

  return swapEntity
}

function updatePricingAndCandlesticks(event: ConversionEventForSwap): void {
  let BTCToken = Token.load(WRBTCAddress.toLowerCase())

  if (BTCToken != null) {
    const btcPrice = BTCToken.lastPriceUsd
    let token: Token | null
    let tokenAmount: BigInt
    let btcAmount: BigInt

    if (event.fromToken.toHexString() == WRBTCAddress.toLowerCase()) {
      token = Token.load(event.toToken.toHexString())
      tokenAmount = event.toAmount
      btcAmount = event.fromAmount
    } else if (event.toToken.toHexString() == WRBTCAddress.toLowerCase()) {
      token = Token.load(event.fromToken.toHexString())
      tokenAmount = event.fromAmount
      btcAmount = event.toAmount
    } else {
      /** TODO: Handle case where neither token is rBTC for when AMM pools with non-rBTC tokens are introduced */
    }

    if (token != null) {
      const oldPriceBtc = token.lastPriceBtc
      const newPriceBtc = btcAmount.divDecimal(tokenAmount.toBigDecimal()).truncate(8)
      const btcVolume = decimal.fromBigInt(btcAmount, BTCToken.decimals).truncate(8)

      const oldPriceUsd = token.lastPriceUsd.truncate(2)
      const newPriceUsd = newPriceBtc.times(token.lastPriceUsd).truncate(2)
      const usdVolume = decimal.fromBigInt(btcAmount, BTCToken.decimals).times(btcPrice).truncate(2)

      token.lastPriceBtc = newPriceBtc
      token.lastPriceUsd = newPriceUsd

      token.btcVolume = token.btcVolume.plus(btcVolume).truncate(8)
      token.usdVolume = token.usdVolume.plus(usdVolume).truncate(2)
      token.tokenVolume = token.tokenVolume.plus(decimal.fromBigInt(tokenAmount, token.decimals)).truncate(18)

      BTCToken.btcVolume = BTCToken.btcVolume.plus(btcVolume).truncate(8)
      BTCToken.usdVolume = BTCToken.usdVolume.plus(usdVolume).truncate(2)
      BTCToken.tokenVolume = BTCToken.btcVolume.plus(btcVolume).truncate(18)

      token.save()

      /** Update BTC Candlesticks for token */
      handleCandlesticks({
        tradingPair: token.id.toLowerCase() + '_' + WRBTCAddress.toLowerCase(),
        blockTimestamp: event.timestamp,
        oldPrice: oldPriceBtc,
        newPrice: newPriceBtc,
        volume: btcVolume,
      })

      if (token.id.toLowerCase() != USDTAddress.toLowerCase()) {
        /** Update USD Candlesticks for token */
        handleCandlesticks({
          tradingPair: token.id.toLowerCase() + '_' + USDTAddress.toLowerCase(),
          blockTimestamp: event.timestamp,
          oldPrice: oldPriceUsd,
          newPrice: newPriceUsd,
          volume: usdVolume,
        })
      }
    }

    /** IF SWAP IS BTC/USDT: Update lastPriceUsd on BTC */

    let usdBtcPrice: BigDecimal
    if (event.fromToken.toHexString() == USDTAddress.toLowerCase() && event.toToken.toHexString() == WRBTCAddress.toLowerCase()) {
      if (BTCToken != null) {
        usdBtcPrice = event.fromAmount.divDecimal(event.toAmount.toBigDecimal())
        BTCToken.lastPriceUsd = usdBtcPrice.truncate(2)
        BTCToken.lastPriceBtc = BigDecimal.fromString('1')
        updateLastPriceUsdAll(usdBtcPrice, event.timestamp, BigDecimal.zero())
      }
    } else if (event.toToken.toHexString() == USDTAddress.toLowerCase() && event.fromToken.toHexString() == WRBTCAddress.toLowerCase()) {
      let usdBtcPrice: BigDecimal
      if (BTCToken != null) {
        usdBtcPrice = event.toAmount.divDecimal(event.fromAmount.toBigDecimal())
        BTCToken.lastPriceUsd = usdBtcPrice.truncate(2)
        BTCToken.lastPriceBtc = BigDecimal.fromString('1')
        updateLastPriceUsdAll(usdBtcPrice, event.timestamp, BigDecimal.zero())
      }
    }

    BTCToken.save()
  }
}
