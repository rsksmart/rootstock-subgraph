import { NewConverter as NewConverterEvent, OwnerUpdate as OwnerUpdateEvent } from '../generated/ConverterFactory/ConverterFactory'
import { NewConverter, LiquidityPool } from '../generated/schema'
import { LiquidityPoolV1Converter as LiquidityPoolV1Template, LiquidityPoolV2Converter as LiquidityPoolV2Template } from '../generated/templates'
import { LiquidityPoolV2Converter as LiquidityPoolV2Contract } from '../generated/ConverterFactory/LiquidityPoolV2Converter'
import { LiquidityPoolV1Converter as LiquidityPoolV1Contract } from '../generated/ConverterFactory/LiquidityPoolV1Converter'

import { loadTransaction } from './utils/Transaction'
import { BigInt, BigDecimal } from '@graphprotocol/graph-ts'

export function handleNewConverter(event: NewConverterEvent): void {
  let entity = new NewConverter(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._type = event.params._type
  entity._converter = event.params._converter
  entity._owner = event.params._owner
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp

  entity.save()

  if (event.params._type == 1) {
    LiquidityPoolV1Template.create(event.params._converter)
    _createAndReturnLiquidityPoolV1(event)
  } else if (event.params._type == 2) {
    LiquidityPoolV2Template.create(event.params._converter)
    _createAndReturnLiquidityPoolV2(event)
  }
}

/** This needs to happen on LiquidityAdded event. It can't happen here because the reserve tokens have not been added at this point */

function _createAndReturnLiquidityPoolV1(event: NewConverterEvent): LiquidityPool {
  let id = event.params._converter.toHexString()
  let liquidityPool = LiquidityPool.load(id)

  let liquidityPoolContract = LiquidityPoolV1Contract.bind(event.params._converter)
  let conversionFeeResult = liquidityPoolContract.try_conversionFee()
  let isActiveResult = liquidityPoolContract.try_isActive()
  let rbtcReserveResult = liquidityPoolContract.try_hasETHReserve()
  let maxConversionFeeResult = liquidityPoolContract.try_maxConversionFee()

  liquidityPool = new LiquidityPool(id)
  liquidityPool.type = event.params._type
  liquidityPool.activated = isActiveResult.reverted ? false : isActiveResult.value
  liquidityPool.conversionFee = conversionFeeResult.reverted
    ? BigDecimal.fromString('0')
    : conversionFeeResult.value.divDecimal(BigDecimal.fromString('1000000')) // Conversion fee is given in ppm
  liquidityPool.maxConversionFee = maxConversionFeeResult.reverted
    ? BigDecimal.fromString('0')
    : maxConversionFeeResult.value.divDecimal(BigDecimal.fromString('1000000')) // Conversion fee is given in ppm
  liquidityPool.hasRBTCReserve = rbtcReserveResult.reverted ? false : rbtcReserveResult.value
  liquidityPool.numSwaps = BigInt.fromI32(0)
  liquidityPool.createdAtTimestamp = event.block.timestamp
  liquidityPool.createdAtBlockNumber = event.block.number
  liquidityPool.createdAtLogIndex = event.logIndex
  liquidityPool.createdAtTransaction = event.transaction.hash.toHexString()

  liquidityPool.save()

  return liquidityPool
}

function _createAndReturnLiquidityPoolV2(event: NewConverterEvent): LiquidityPool {
  let id = event.params._converter.toHexString()
  let liquidityPool = LiquidityPool.load(id)

  let liquidityPoolContract = LiquidityPoolV2Contract.bind(event.params._converter)
  let conversionFeeResult = liquidityPoolContract.try_conversionFee()
  let isActiveResult = liquidityPoolContract.try_isActive()
  let rbtcReserveResult = liquidityPoolContract.try_hasETHReserve()
  let maxConversionFeeResult = liquidityPoolContract.try_maxConversionFee()

  liquidityPool = new LiquidityPool(id)
  liquidityPool.type = event.params._type
  liquidityPool.activated = isActiveResult.reverted ? false : isActiveResult.value
  liquidityPool.conversionFee = conversionFeeResult.reverted
    ? BigDecimal.fromString('0')
    : conversionFeeResult.value.divDecimal(BigDecimal.fromString('1000000')) // Conversion fee is given in ppm
  liquidityPool.maxConversionFee = maxConversionFeeResult.reverted
    ? BigDecimal.fromString('0')
    : maxConversionFeeResult.value.divDecimal(BigDecimal.fromString('1000000')) // Conversion fee is given in ppm
  liquidityPool.hasRBTCReserve = rbtcReserveResult.reverted ? false : rbtcReserveResult.value
  liquidityPool.numSwaps = BigInt.fromI32(0)
  liquidityPool.createdAtTimestamp = event.block.timestamp
  liquidityPool.createdAtBlockNumber = event.block.number
  liquidityPool.createdAtLogIndex = event.logIndex
  liquidityPool.createdAtTransaction = event.transaction.hash.toHexString()

  liquidityPool.save()

  return liquidityPool
}
