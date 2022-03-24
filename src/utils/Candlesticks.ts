import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { CandleStick, ProtocolStats, Token } from '../../generated/schema'

import { createAndReturnProtocolStats } from './ProtocolStats'
import { ConversionEventForSwap } from './Swap'
import { WRBTCAddress } from '../contracts/contracts'

enum Interval {
  MinuteInterval = 60,
  FifteenMintuesInterval = 60 * 15,
  HourInterval = 60 * 60,
  FourHourInterval = 60 * 60 * 4,
  DayInterval = 60 * 60 * 24,
}

class IntervalStr {
  static MinuteInterval: string = 'MinuteInterval'
  static FifteenMintuesInterval: string = 'FifteenMintuesInterval'
  static HourInterval: string = 'HourInterval'
  static FourHourInterval: string = 'FourHourInterval'
  static DayInterval: string = 'DayInterval'
}

export class ICandleSticks {
  tradingPair: string
  blockTimestamp: BigInt
  oldPrice: BigDecimal
  newPrice: BigDecimal
  volume: BigDecimal
  baseToken: string
  quoteToken: string
}

export function updateCandleSticks(event: ConversionEventForSwap): void {
  log.debug('src/utils/Candlesticks.ts ~ Candlesticks.ts ~ 0 ~  event.fromToken: {}, event.toToken: {}', [event.fromToken.toHex(), event.toToken.toHex()])
  let baseToken: Token
  let quoteToken: Token
  let oldPrice = BigDecimal.zero()
  let newPrice = BigDecimal.zero()
  let volume = BigDecimal.zero()
  let blockTimestamp = event.timestamp

  let protocolStats = createAndReturnProtocolStats()
  const USDTAddress = protocolStats.usdStablecoin.toLowerCase()
  log.debug('src/utils/Candlesticks.ts ~ Candlesticks.ts ~ 45 ~ : USDTAddress {}', [USDTAddress])

  if (event.fromToken.toHex().toLowerCase() == WRBTCAddress.toLowerCase()) {
    log.debug('src/utils/Candlesticks.ts ~ Candlesticks.ts ~ 1 ~  event.fromToken: {} event.toToken', [event.fromToken.toHex(), event.toToken.toHex()])
    baseToken = Token.load(event.toToken.toHex()) as Token
    quoteToken = Token.load(event.fromToken.toHex()) as Token
    volume = event.toAmount
  } else if (event.toToken.toHex().toLowerCase() == WRBTCAddress.toLowerCase()) {
    log.debug('src/utils/Candlesticks.ts ~ Candlesticks.ts ~ 2 ~  event.fromToken: {} event.toToken', [event.fromToken.toHex(), event.toToken.toHex()])
    baseToken = Token.load(event.fromToken.toHex()) as Token
    quoteToken = Token.load(event.toToken.toHex()) as Token
    volume = event.fromAmount
  } else {
    // TODO: handle a case where neither side of the conversion is WRBTC
    log.warning('Candlesticks unHandled Conversion - fromToken: {}, toToken {}', [event.fromToken.toHex(), event.toToken.toHex()])
  }

  oldPrice = baseToken.prevPriceBtc
  newPrice = baseToken.lastPriceBtc

  updateAllIntervals(baseToken, quoteToken, oldPrice, newPrice, volume, 1, blockTimestamp)

  const usdToken = Token.load(USDTAddress)
  if (usdToken != null) {
    const oldPriceUsd = baseToken.prevPriceUsd
    const newPriceUsd = baseToken.lastPriceUsd
    updateAllIntervals(baseToken, usdToken, oldPriceUsd, newPriceUsd, volume, 1, blockTimestamp)
  }

  if (event.fromToken.toHex().toLowerCase() == USDTAddress.toLowerCase() || event.toToken.toHex().toLowerCase() == USDTAddress.toLowerCase()) {
    const tokens = protocolStats.tokens
    for (let index = 0; index < tokens.length; index++) {
      const tokenAddress = tokens[index]
      if (tokenAddress.toLowerCase() != USDTAddress.toLowerCase() || tokenAddress.toLowerCase() != WRBTCAddress.toLowerCase()) {
        log.debug('src/utils/Candlesticks.ts ~ Candlesticks.ts ~ 90 ~ tokenAddress: {}', [tokenAddress.toString()])
        baseToken = Token.load(tokenAddress) as Token
        quoteToken = Token.load(USDTAddress) as Token
        volume = BigDecimal.zero()
        // let txCount = 0
        // if (event.fromToken.toHex().toLowerCase() == WRBTCAddress.toLowerCase()) {
        //   volume = event.fromAmount
        //   txCount = 1
        // } else if (event.toToken.toHex().toLowerCase() == WRBTCAddress.toLowerCase()) {
        //   volume = event.toAmount
        //   txCount = 1
        // }

        oldPrice = baseToken.prevPriceUsd
        newPrice = baseToken.lastPriceUsd
        updateAllIntervals(baseToken, quoteToken, oldPrice, newPrice, volume, 0, blockTimestamp)
      }
    }
  } else {
    log.warning('Candlesticks Unhandled Conversion - fromToken: {}, toToken {}', [event.fromToken.toHex(), event.toToken.toHex()])
  }
}

function updateAllIntervals(
  baseToken: Token,
  quoteToken: Token,
  oldPrice: BigDecimal,
  newPrice: BigDecimal,
  volume: BigDecimal,
  txCount: i32,
  blockTimestamp: BigInt
): void {
  if (baseToken !== null && quoteToken !== null) {
    if (oldPrice.gt(BigDecimal.zero()) && newPrice.gt(BigDecimal.zero())) {
      updateCandlestick(baseToken, quoteToken, oldPrice, newPrice, volume, txCount, blockTimestamp, Interval.MinuteInterval, IntervalStr.MinuteInterval)
      updateCandlestick(
        baseToken,
        quoteToken,
        oldPrice,
        newPrice,
        volume,
        txCount,
        blockTimestamp,
        Interval.FifteenMintuesInterval,
        IntervalStr.FifteenMintuesInterval
      )
      updateCandlestick(baseToken, quoteToken, oldPrice, newPrice, volume, txCount, blockTimestamp, Interval.HourInterval, IntervalStr.HourInterval)
      updateCandlestick(baseToken, quoteToken, oldPrice, newPrice, volume, txCount, blockTimestamp, Interval.FourHourInterval, IntervalStr.FourHourInterval)
      updateCandlestick(baseToken, quoteToken, oldPrice, newPrice, volume, txCount, blockTimestamp, Interval.DayInterval, IntervalStr.DayInterval)
    }
  } else {
    log.warning('Candlesticks one or both tokens returned null on load - baseToken: {}, quoteToken {}', [baseToken.id, quoteToken.id])
  }
}

function updateCandlestick(
  baseToken: Token,
  quoteToken: Token,
  oldPrice: BigDecimal,
  newPrice: BigDecimal,
  volume: BigDecimal,
  txCount: i32,
  blockTimestamp: BigInt,
  interval: Interval,
  intervalStr: string
): void {
  let candleStickTimestamp = blockTimestamp.toI32() - (blockTimestamp.toI32() % interval)
  log.debug('src/utils/Candlesticks.ts ~ Candlesticks.ts ~ 80 ~  candleStickTimestamp: {}', [candleStickTimestamp.toString()])
  const candlestickId = getCandleStickId(baseToken, quoteToken, candleStickTimestamp, interval)
  const candleStickObj = getCandleStick(candlestickId, intervalStr)

  const isNew = candleStickObj.isNew
  const candleStick = candleStickObj.candleStick
  if (isNew) {
    candleStick.periodStartUnix = candleStickTimestamp
    candleStick.open = oldPrice == BigDecimal.zero() ? newPrice : oldPrice
    candleStick.low = oldPrice == BigDecimal.zero() ? newPrice : oldPrice
    candleStick.high = oldPrice == BigDecimal.zero() ? newPrice : oldPrice
    candleStick.txCount = 0
    candleStick.totalVolume = BigDecimal.zero()
    candleStick.baseToken = baseToken.id
    candleStick.quoteToken = quoteToken.id
  }

  if (newPrice.gt(candleStick.high)) {
    candleStick.high = newPrice
  }

  if (newPrice.lt(candleStick.low)) {
    candleStick.low = newPrice
  }

  candleStick.totalVolume = candleStick.totalVolume.plus(volume)

  candleStick.close = newPrice
  candleStick.txCount = candleStick.txCount + txCount
  candleStick.save()
}
class ICandleStick {
  candleStick: CandleStick
  isNew: boolean
}

function getCandleStick(candlestickId: string, interval: string): ICandleStick {
  let candleStick = CandleStick.load(candlestickId)
  let isNew = false
  if (candleStick == null) {
    isNew = true
    candleStick = new CandleStick(candlestickId)
    candleStick.interval = interval
  }

  return {
    candleStick,
    isNew,
  }
}

function getCandleStickId(baseToken: Token, quoteToken: Token, candleStickTimestamp: number, interval: Interval): string {
  const tradingPairId = baseToken.id.toLowerCase() + '_' + quoteToken.id.toLowerCase()
  const candleStickId = tradingPairId + '-' + candleStickTimestamp.toString() + '-' + interval.toString()
  return candleStickId
}
