import { BigDecimal, Entity, log, Value } from '@graphprotocol/graph-ts'
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

class CandlestickParams {
  baseToken: Token
  quoteToken: Token
  oldPrice: BigDecimal
  newPrice: BigDecimal
  volume: BigDecimal
  txCount: i32
  blockTimestamp: i32
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
  updateAllIntervals({
    baseToken,
    quoteToken,
    oldPrice,
    newPrice,
    volume,
    txCount: 1,
    blockTimestamp,
  })

  const usdToken = Token.load(usdStablecoin)
  if (usdToken != null) {
    const oldPriceUsd = baseToken.prevPriceUsd
    const newPriceUsd = baseToken.lastPriceUsd
    // update baseToken candlesticks with quoteToken=USD
    updateAllIntervals({ baseToken, quoteToken: usdToken, oldPrice: oldPriceUsd, newPrice: newPriceUsd, volume, txCount: 1, blockTimestamp })
  }

  if (baseToken.id == usdStablecoin.toLowerCase()) {
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
        updateAllIntervals({ baseToken, quoteToken, oldPrice, newPrice, volume, txCount, blockTimestamp })
      }
    }
  }
}

function updateAllIntervals(params: CandlestickParams): void {
  if (params.baseToken.id != params.quoteToken.id) {
    if (params.oldPrice.gt(BigDecimal.zero()) && params.newPrice.gt(BigDecimal.zero())) {
      updateCandlestickMinute(params)
      updateCandlestickFifteenMinute(params)
      updateCandlestickHour(params)
      updateCandlestickFourHour(params)
      updateCandlestickDay(params)
    }
  }
}

function initializeCandlestick(entity: Entity, params: CandlestickParams, timestamp: i32): void {
  const startingPrice = params.oldPrice
  entity.set('periodStartUnix', Value.fromI32(timestamp))
  entity.set('open', Value.fromBigDecimal(startingPrice))
  entity.set('low', Value.fromBigDecimal(startingPrice))
  entity.set('high', Value.fromBigDecimal(startingPrice))
  entity.set('close', Value.fromBigDecimal(startingPrice))
  entity.set('txCount', Value.fromI32(0))
  entity.set('totalVolume', Value.fromBigDecimal(BigDecimal.zero()))
  entity.set('baseToken', Value.fromString(params.baseToken.id))
  entity.set('quoteToken', Value.fromString(params.quoteToken.id))
}

function updateCandlestick(entity: Entity, params: CandlestickParams): void {
  const oldHigh = entity.get('high')
  const oldLow = entity.get('low')
  const totalVolumeRaw = entity.get('totalVolume')
  const totalVolume = totalVolumeRaw !== null ? totalVolumeRaw.toBigDecimal() : params.volume
  const txCountRaw = entity.get('txCount')
  const txCount = txCountRaw !== null ? txCountRaw.toI32() : 1

  if (oldHigh !== null && params.newPrice.gt(oldHigh.toBigDecimal())) {
    entity.set('high', Value.fromBigDecimal(params.newPrice))
  }
  if (oldLow !== null && params.newPrice.lt(oldLow.toBigDecimal())) {
    entity.set('low', Value.fromBigDecimal(params.newPrice))
  }

  entity.set('totalVolume', Value.fromBigDecimal(totalVolume.plus(params.volume)))
  entity.set('txCount', Value.fromI32(txCount + params.txCount))
  entity.set('close', Value.fromBigDecimal(params.newPrice))
}

function updateCandlestickMinute(params: CandlestickParams): void {
  const candleStickTimestamp = params.blockTimestamp - (params.blockTimestamp % Interval.MinuteInterval)
  const candlestickId = getCandleStickId(params.baseToken, params.quoteToken, candleStickTimestamp, Interval.MinuteInterval)
  let candleStick = CandleStickMinute.load(candlestickId)
  if (candleStick === null) {
    candleStick = new CandleStickMinute(candlestickId)
    initializeCandlestick(candleStick, params, candleStickTimestamp)
  }
  updateCandlestick(candleStick, params)
  candleStick.save()
}

function updateCandlestickFifteenMinute(params: CandlestickParams): void {
  const candleStickTimestamp = params.blockTimestamp - (params.blockTimestamp % Interval.FifteenMinutesInterval)
  const candlestickId = getCandleStickId(params.baseToken, params.quoteToken, candleStickTimestamp, Interval.FifteenMinutesInterval)
  let candleStick = CandleStickFifteenMinute.load(candlestickId)
  if (candleStick === null) {
    candleStick = new CandleStickFifteenMinute(candlestickId)
    initializeCandlestick(candleStick, params, candleStickTimestamp)
  }
  updateCandlestick(candleStick, params)
  candleStick.save()
}

function updateCandlestickHour(params: CandlestickParams): void {
  const candleStickTimestamp = params.blockTimestamp - (params.blockTimestamp % Interval.HourInterval)
  const candlestickId = getCandleStickId(params.baseToken, params.quoteToken, candleStickTimestamp, Interval.HourInterval)
  let candleStick = CandleStickHour.load(candlestickId)
  if (candleStick === null) {
    candleStick = new CandleStickHour(candlestickId)
    initializeCandlestick(candleStick, params, candleStickTimestamp)
  }
  updateCandlestick(candleStick, params)
  candleStick.save()
}

function updateCandlestickFourHour(params: CandlestickParams): void {
  const candleStickTimestamp = params.blockTimestamp - (params.blockTimestamp % Interval.FourHourInterval)
  const candlestickId = getCandleStickId(params.baseToken, params.quoteToken, candleStickTimestamp, Interval.FourHourInterval)
  let candleStick = CandleStickFourHour.load(candlestickId)
  if (candleStick === null) {
    candleStick = new CandleStickFourHour(candlestickId)
    initializeCandlestick(candleStick, params, candleStickTimestamp)
  }
  updateCandlestick(candleStick, params)
  candleStick.save()
}

function updateCandlestickDay(params: CandlestickParams): void {
  const candleStickTimestamp = params.blockTimestamp - (params.blockTimestamp % Interval.DayInterval)
  const candlestickId = getCandleStickId(params.baseToken, params.quoteToken, candleStickTimestamp, Interval.DayInterval)
  let candleStick = CandleStickDay.load(candlestickId)
  if (candleStick === null) {
    candleStick = new CandleStickDay(candlestickId)
    initializeCandlestick(candleStick, params, candleStickTimestamp)
  }
  updateCandlestick(candleStick, params)
  candleStick.save()
}

function getCandleStickId(baseToken: Token, quoteToken: Token, candleStickTimestamp: number, interval: Interval): string {
  const tradingPairId = baseToken.id.toLowerCase() + '_' + quoteToken.id.toLowerCase()
  const candleStickId = tradingPairId + '-' + candleStickTimestamp.toString() + '-' + interval.toString()
  return candleStickId
}
