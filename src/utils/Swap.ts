import { Address, Bytes, BigInt } from '@graphprotocol/graph-ts'
import { Conversion as ConversionEventV1 } from '../../generated/templates/LiquidityPoolV1Converter/LiquidityPoolV1Converter'
import { Conversion as ConversionEventV2 } from '../../generated/templates/LiquidityPoolV2Converter/LiquidityPoolV2Converter'
import { Swap, User, LiquidityPool } from '../../generated/schema'
import { createAndReturnUser } from './User'

export function createSwapV1(event: ConversionEventV1): Swap {
  let userEntity = createAndReturnUser(event.address)
  let swapEntity = Swap.load(event.transaction.hash.toHex())

  /** Create swap  */
  if (swapEntity == null) {
    swapEntity = new Swap(event.transaction.hash.toHex())
    swapEntity.ammConversionEvents = [event.transaction.hash.toHex() + '-' + event.logIndex.toString()]
    swapEntity.fromToken = event.params._fromToken
    swapEntity.toToken = event.params._toToken
    swapEntity.fromAmount = event.params._amount
    swapEntity.toAmount = event.params._return
    swapEntity.rate = event.params._amount.div(event.params._return) // TODO: Change this to proper decimal division using token decimals
    swapEntity.user = userEntity.id
    swapEntity.isMarginTrade = false
    swapEntity.isBorrow = false
    swapEntity.timestamp = event.block.timestamp

    /** Add Swap to User */
    userEntity.numSwaps += 1
  }

  /** Swap already exists - this means it has multiple conversion events */
  if (swapEntity != null && swapEntity.ammConversionEvents != null) {
    const existingEvents = swapEntity.ammConversionEvents
    if (existingEvents != null && existingEvents != [] && existingEvents.length > 0) {
      swapEntity.ammConversionEvents = existingEvents.concat([event.transaction.hash.toHex() + '-' + event.logIndex.toString()])
    } else if (existingEvents == []) {
      swapEntity.ammConversionEvents = [event.transaction.hash.toHex() + '-' + event.logIndex.toString()]
    }
    swapEntity.toToken = event.params._toToken
    swapEntity.toAmount = event.params._return
    swapEntity.rate = event.params._amount.div(event.params._return)
  }

  swapEntity.save()
  userEntity.save()

  return swapEntity
}

export function createSwapV2(event: ConversionEventV2): Swap {
  let userEntity = createAndReturnUser(event.address)
  let swapEntity = Swap.load(event.transaction.hash.toHex())

  /** Create swap  */
  if (swapEntity == null) {
    swapEntity = new Swap(event.transaction.hash.toHex())
    swapEntity.ammConversionEvents = [event.transaction.hash.toHex() + '-' + event.logIndex.toString()]
    swapEntity.fromToken = event.params._fromToken
    swapEntity.toToken = event.params._toToken
    swapEntity.fromAmount = event.params._amount
    swapEntity.toAmount = event.params._return
    swapEntity.rate = event.params._amount.div(event.params._return) // TODO: Change this to proper decimal division using token decimals
    swapEntity.user = userEntity.id
    swapEntity.isMarginTrade = false
    swapEntity.isBorrow = false
    swapEntity.timestamp = event.block.timestamp

    /** Add Swap to User */
    userEntity.numSwaps += 1
  }

  /** Swap already exists - this means it has multiple conversion events */
  if (swapEntity != null && swapEntity.ammConversionEvents != null) {
    const existingEvents = swapEntity.ammConversionEvents
    if (existingEvents != null && existingEvents != [] && existingEvents.length > 0) {
      swapEntity.ammConversionEvents = existingEvents.concat([event.transaction.hash.toHex() + '-' + event.logIndex.toString()])
    } else if (existingEvents == []) {
      swapEntity.ammConversionEvents = [event.transaction.hash.toHex() + '-' + event.logIndex.toString()]
    }
    swapEntity.toToken = event.params._toToken
    swapEntity.toAmount = event.params._return
    swapEntity.rate = event.params._amount.div(event.params._return)
  }

  swapEntity.save()
  userEntity.save()

  return swapEntity
}
