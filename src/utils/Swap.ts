import { Address, Bytes, BigInt } from '@graphprotocol/graph-ts'
import { Swap, Token, User } from '../../generated/schema'
import { createAndReturnUser } from './User'
import { USDTAddress, WRBTCAddress } from '../contracts/contracts'

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
    swapEntity.rate = event.fromAmount.div(event.toAmount) // TODO: Change this to proper decimal division using token decimals
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
    swapEntity.rate = event.fromAmount.div(event.toAmount)
  }
  swapEntity.save()

  return swapEntity
}
