import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { CandleSticksFifteenMinute } from '../../generated/schema'

enum Interval {
  MinuteInterval = 60,
  FifteenMintuesInterval = 60 * 15,
  HourInterval = 60 * 60,
  FourHourInterval = 60 * 60 * 4,
  DayInterval = 60 * 60 * 24,
}

export class ICandleSticks {
  tradingPair: string
  blockTimestamp: BigInt
  oldPrice: BigDecimal
  newPrice: BigDecimal
  volume: BigDecimal
}

export function handleCandlesticks(data: ICandleSticks): void {
  handleCandlesticksFifteenMinutes(data)
}

function handleCandlesticksFifteenMinutes(data: ICandleSticks): void {
  let fifteenMinutesTimestamp = data.blockTimestamp.toI32() - (data.blockTimestamp.toI32() % Interval.FifteenMintuesInterval)
  const candleSticksId = data.tradingPair + '-' + fifteenMinutesTimestamp.toString()
  let candleSticksFifteenMinutes = CandleSticksFifteenMinute.load(candleSticksId)
  if (candleSticksFifteenMinutes === null) {
    candleSticksFifteenMinutes = new CandleSticksFifteenMinute(candleSticksId)
    candleSticksFifteenMinutes.periodStartUnix = fifteenMinutesTimestamp
    candleSticksFifteenMinutes.tradingPair = data.tradingPair
    candleSticksFifteenMinutes.open = data.oldPrice
    candleSticksFifteenMinutes.low = data.oldPrice
    candleSticksFifteenMinutes.high = data.oldPrice
    candleSticksFifteenMinutes.txCount = BigInt.zero()
    candleSticksFifteenMinutes.totalVolume = BigDecimal.zero()
  }

  if (data.newPrice.gt(candleSticksFifteenMinutes.high)) {
    candleSticksFifteenMinutes.high = data.newPrice
  }

  if (data.newPrice.lt(candleSticksFifteenMinutes.low)) {
    candleSticksFifteenMinutes.low = data.newPrice
  }

  candleSticksFifteenMinutes.close = data.newPrice
  candleSticksFifteenMinutes.txCount = candleSticksFifteenMinutes.txCount.plus(BigInt.fromI32(1))
  candleSticksFifteenMinutes.totalVolume = candleSticksFifteenMinutes.totalVolume.plus(data.volume)
  candleSticksFifteenMinutes.save()
}
