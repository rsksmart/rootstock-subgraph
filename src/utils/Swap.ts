import { Address, Bytes, BigInt } from '@graphprotocol/graph-ts'
import { Swap } from '../../generated/schema'
import { createAndReturnUser } from './User'

export class ConversionEventForSwap {
  transactionHash: Bytes
  fromToken: Address
  toToken: Address
  fromAmount: BigInt
  toAmount: BigInt
  timestamp: BigInt
  user: Address
}

export function createAndReturnSwap(event: ConversionEventForSwap): Swap {
  let userEntity = createAndReturnUser(event.user)
  let swapEntity = Swap.load(event.transactionHash.toHex())

  /** Create swap  */
  if (swapEntity == null) {
    swapEntity = new Swap(event.transactionHash.toHex())
    swapEntity.numConversions = 1
    swapEntity.fromToken = event.fromToken
    swapEntity.toToken = event.toToken
    swapEntity.fromAmount = event.fromAmount
    swapEntity.toAmount = event.toAmount
    swapEntity.rate = event.fromAmount.div(event.toAmount) // TODO: Change this to proper decimal division using token decimals
    swapEntity.user = userEntity.id
    swapEntity.isMarginTrade = false
    swapEntity.isBorrow = false
    swapEntity.timestamp = event.timestamp
    /** Add Swap to User */
    userEntity.numSwaps += 1
  } else if (swapEntity != null) {

  /** Swap already exists - this means it has multiple conversion events */
    if (swapEntity.numConversions != null) {
      swapEntity.numConversions += 1
    }
    swapEntity.toToken = event.toToken
    swapEntity.toAmount = event.toAmount
    swapEntity.rate = event.fromAmount.div(event.toAmount)
  }

  userEntity.save()
  swapEntity.save()

  return swapEntity
}
