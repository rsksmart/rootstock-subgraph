import { BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { VestingHistoryItem } from '../../generated/schema'

class VestingHistoryItemParams {
  staker: string
  action: string
  amount: BigDecimal
  lockedUntil: BigInt
  totalStaked: BigDecimal
  event: ethereum.Event
}

export function createAndReturnVestingHistoryItem(params: VestingHistoryItemParams): VestingHistoryItem {
  const id = params.event.transaction.hash.toHexString() + '-' + params.event.logIndex.toHexString()
  const vestingHistoryItem = new VestingHistoryItem(id)
  vestingHistoryItem.staker = params.staker
  vestingHistoryItem.action = params.action
  vestingHistoryItem.amount = params.amount
  vestingHistoryItem.lockedUntil = params.lockedUntil.toI32()
  vestingHistoryItem.totalStaked = params.totalStaked
  vestingHistoryItem.timestamp = params.event.block.timestamp.toI32()
  vestingHistoryItem.emittedBy = params.event.address
  vestingHistoryItem.transaction = params.event.transaction.hash.toHexString()
  vestingHistoryItem.save()
  return vestingHistoryItem
}
