import { BigDecimal, log } from '@graphprotocol/graph-ts'
import { CandleStickDay, CandleStickFifteenMinute, CandleStickFourHour, CandleStickHour, CandleStickMinute, Token } from '../../generated/schema'
import { createAndReturnProtocolStats } from './ProtocolStats'
import { ConversionEventForSwap } from './Swap'
import { WRBTCAddress } from '../contracts/contracts'

/* eslint-disable no-unused-vars */
enum Interval {
  MinuteInterval = 60,
  FifteenMinutesInterval = 60 * 15,
  HourInterval = 60 * 60,
  FourHourInterval = 60 * 60 * 4,
  DayInterval = 60 * 60 * 24,
}

// TODO: this method needs to be refactored into smaller methods for cleaner code
export function updateCandleSticks(event: ConversionEventForSwap): void {
  let baseToken: Token
  let quoteToken: Token
  let oldPrice = BigDecimal.zero()
  let newPrice = BigDecimal.zero()
  let volume = BigDecimal.zero()
  const blockTimestamp = event.transaction.timestamp

  const protocolStats = createAndReturnProtocolStats()
  const usdStablecoin = protocolStats.usdStablecoin.toLowerCase()

  if (event.fromToken.toHex().toLowerCase() == WRBTCAddress.toLowerCase()) {
    baseToken = Token.load(event.toToken.toHex()) as Token
    quoteToken = Token.load(event.fromToken.toHex()) as Token
    volume = event.toAmount
  } else if (event.toToken.toHex().toLowerCase() == WRBTCAddress.toLowerCase()) {
    baseToken = Token.load(event.fromToken.toHex()) as Token
    quoteToken = Token.load(event.toToken.toHex()) as Token
    volume = event.fromAmount
  } else {
    // TODO: handle a case where neither side of the conversion is WRBTC
    log.warning('Candlesticks unHandled Conversion - fromToken: {}, toToken {}', [event.fromToken.toHex(), event.toToken.toHex()])
    return
  }

  oldPrice = baseToken.prevPriceBtc
  newPrice = baseToken.lastPriceBtc

  // update baseToken candlesticks with quoteToken=WRBTC
  updateAllIntervals(baseToken, quoteToken, oldPrice, newPrice, volume, 1, blockTimestamp)

  const usdToken = Token.load(usdStablecoin)
  if (usdToken != null) {
    const oldPriceUsd = baseToken.prevPriceUsd
    const newPriceUsd = baseToken.lastPriceUsd
    // update baseToken candlesticks with quoteToken=USD
    updateAllIntervals(baseToken, usdToken, oldPriceUsd, newPriceUsd, volume, 1, blockTimestamp)
  }

  if (event.fromToken.toHex().toLowerCase() == usdStablecoin.toLowerCase() || event.toToken.toHex().toLowerCase() == usdStablecoin.toLowerCase()) {
    const tokens = protocolStats.tokens
    for (let index = 0; index < tokens.length; index++) {
      const tokenAddress = tokens[index]
      if (tokenAddress.toLowerCase() != usdStablecoin.toLowerCase()) {
        baseToken = Token.load(tokenAddress) as Token
        quoteToken = Token.load(usdStablecoin) as Token
        volume = BigDecimal.zero()
        let txCount = 0
        if (event.fromToken.toHex().toLowerCase() == tokenAddress.toLowerCase()) {
          txCount = 1
          volume = event.fromAmount
        } else if (event.toToken.toHex().toLowerCase() == tokenAddress.toLowerCase()) {
          txCount = 1
          volume = event.toAmount
        }

        oldPrice = baseToken.prevPriceUsd
        newPrice = baseToken.lastPriceUsd
        // update all tokens candleSticks with quoteToken=USD
        updateAllIntervals(baseToken, quoteToken, oldPrice, newPrice, volume, txCount, blockTimestamp)
      }
    }
  }
}

function updateAllIntervals(
  baseToken: Token,
  quoteToken: Token,
  oldPrice: BigDecimal,
  newPrice: BigDecimal,
  volume: BigDecimal,
  txCount: i32,
  blockTimestamp: i32,
): void {
  if (baseToken !== null && quoteToken !== null) {
    if (baseToken.id != quoteToken.id) {
      if (oldPrice.gt(BigDecimal.zero()) && newPrice.gt(BigDecimal.zero())) {
        updateCandlestickMinute(baseToken, quoteToken, oldPrice, newPrice, volume, txCount, blockTimestamp)
        updateCandlestickFifteenMinute(baseToken, quoteToken, oldPrice, newPrice, volume, txCount, blockTimestamp)
        updateCandlestickHour(baseToken, quoteToken, oldPrice, newPrice, volume, txCount, blockTimestamp)
        updateCandlestickFourHour(baseToken, quoteToken, oldPrice, newPrice, volume, txCount, blockTimestamp)
        updateCandlestickDay(baseToken, quoteToken, oldPrice, newPrice, volume, txCount, blockTimestamp)
      }
    } else {
      log.warning('Candlesticks baseToken and quoteToken are the same - baseToken: {}, quoteToken {}', [baseToken.id, quoteToken.id])
    }
  } else {
    log.warning('Candlesticks one or both tokens returned null on load - baseToken: {}, quoteToken {}', [baseToken.id, quoteToken.id])
  }
}

function updateCandlestickMinute(
  baseToken: Token,
  quoteToken: Token,
  oldPrice: BigDecimal,
  newPrice: BigDecimal,
  volume: BigDecimal,
  txCount: i32,
  blockTimestamp: i32,
): void {
  const candleStickTimestamp = blockTimestamp - (blockTimestamp % Interval.MinuteInterval)
  const candlestickId = getCandleStickId(baseToken, quoteToken, candleStickTimestamp, Interval.MinuteInterval)
  let candleStickMinute = CandleStickMinute.load(candlestickId)
  if (candleStickMinute == null) {
    candleStickMinute = new CandleStickMinute(candlestickId)
    candleStickMinute.periodStartUnix = candleStickTimestamp
    candleStickMinute.open = oldPrice == BigDecimal.zero() ? newPrice : oldPrice
    candleStickMinute.low = oldPrice == BigDecimal.zero() ? newPrice : oldPrice
    candleStickMinute.high = oldPrice == BigDecimal.zero() ? newPrice : oldPrice
    candleStickMinute.txCount = 0
    candleStickMinute.totalVolume = BigDecimal.zero()
    candleStickMinute.baseToken = baseToken.id
    candleStickMinute.quoteToken = quoteToken.id
  }

  if (newPrice.gt(candleStickMinute.high)) {
    candleStickMinute.high = newPrice
  }

  if (newPrice.lt(candleStickMinute.low)) {
    candleStickMinute.low = newPrice
  }

  candleStickMinute.totalVolume = candleStickMinute.totalVolume.plus(volume)

  candleStickMinute.close = newPrice
  candleStickMinute.txCount = candleStickMinute.txCount + txCount
  candleStickMinute.save()
}

function updateCandlestickFifteenMinute(
  baseToken: Token,
  quoteToken: Token,
  oldPrice: BigDecimal,
  newPrice: BigDecimal,
  volume: BigDecimal,
  txCount: i32,
  blockTimestamp: i32,
): void {
  const candleStickTimestamp = blockTimestamp - (blockTimestamp % Interval.FifteenMinutesInterval)
  const candlestickId = getCandleStickId(baseToken, quoteToken, candleStickTimestamp, Interval.FifteenMinutesInterval)
  let candleStickFifteenMinute = CandleStickFifteenMinute.load(candlestickId)
  if (candleStickFifteenMinute == null) {
    candleStickFifteenMinute = new CandleStickFifteenMinute(candlestickId)
    candleStickFifteenMinute.periodStartUnix = candleStickTimestamp
    candleStickFifteenMinute.open = oldPrice == BigDecimal.zero() ? newPrice : oldPrice
    candleStickFifteenMinute.low = oldPrice == BigDecimal.zero() ? newPrice : oldPrice
    candleStickFifteenMinute.high = oldPrice == BigDecimal.zero() ? newPrice : oldPrice
    candleStickFifteenMinute.txCount = 0
    candleStickFifteenMinute.totalVolume = BigDecimal.zero()
    candleStickFifteenMinute.baseToken = baseToken.id
    candleStickFifteenMinute.quoteToken = quoteToken.id
  }

  if (newPrice.gt(candleStickFifteenMinute.high)) {
    candleStickFifteenMinute.high = newPrice
  }

  if (newPrice.lt(candleStickFifteenMinute.low)) {
    candleStickFifteenMinute.low = newPrice
  }

  candleStickFifteenMinute.totalVolume = candleStickFifteenMinute.totalVolume.plus(volume)

  candleStickFifteenMinute.close = newPrice
  candleStickFifteenMinute.txCount = candleStickFifteenMinute.txCount + txCount
  candleStickFifteenMinute.save()
}

function updateCandlestickHour(
  baseToken: Token,
  quoteToken: Token,
  oldPrice: BigDecimal,
  newPrice: BigDecimal,
  volume: BigDecimal,
  txCount: i32,
  blockTimestamp: i32,
): void {
  const candleStickTimestamp = blockTimestamp - (blockTimestamp % Interval.HourInterval)
  const candlestickId = getCandleStickId(baseToken, quoteToken, candleStickTimestamp, Interval.HourInterval)
  let candleStick = CandleStickHour.load(candlestickId)
  if (candleStick == null) {
    candleStick = new CandleStickHour(candlestickId)
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

function updateCandlestickFourHour(
  baseToken: Token,
  quoteToken: Token,
  oldPrice: BigDecimal,
  newPrice: BigDecimal,
  volume: BigDecimal,
  txCount: i32,
  blockTimestamp: i32,
): void {
  const candleStickTimestamp = blockTimestamp - (blockTimestamp % Interval.FourHourInterval)
  const candlestickId = getCandleStickId(baseToken, quoteToken, candleStickTimestamp, Interval.FourHourInterval)
  let candleStick = CandleStickFourHour.load(candlestickId)
  if (candleStick == null) {
    candleStick = new CandleStickFourHour(candlestickId)
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

function updateCandlestickDay(
  baseToken: Token,
  quoteToken: Token,
  oldPrice: BigDecimal,
  newPrice: BigDecimal,
  volume: BigDecimal,
  txCount: i32,
  blockTimestamp: i32,
): void {
  const candleStickTimestamp = blockTimestamp - (blockTimestamp % Interval.DayInterval)
  const candlestickId = getCandleStickId(baseToken, quoteToken, candleStickTimestamp, Interval.DayInterval)
  let candleStick = CandleStickDay.load(candlestickId)
  if (candleStick == null) {
    candleStick = new CandleStickDay(candlestickId)
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

function getCandleStickId(baseToken: Token, quoteToken: Token, candleStickTimestamp: number, interval: Interval): string {
  const tradingPairId = baseToken.id.toLowerCase() + '_' + quoteToken.id.toLowerCase()
  const candleStickId = tradingPairId + '-' + candleStickTimestamp.toString() + '-' + interval.toString()
  return candleStickId
}
