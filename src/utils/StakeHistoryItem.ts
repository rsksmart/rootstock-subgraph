import { StakeHistoryItem } from '../../generated/schema'
import { Address, BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { ZERO_ADDRESS } from '@protofire/subgraph-toolkit'
import { createAndReturnUser } from './User'

class StakeHistoryItemParams {
  user: string
  action: string
  amount: BigDecimal
  token: string
  lockedUntil: BigInt
  delegatee: string
  event: ethereum.Event
}

export function createAndReturnStakeHistoryItem(params: StakeHistoryItemParams): StakeHistoryItem {
  const stakeHistoryItem = new StakeHistoryItem(params.event.transaction.hash.toHex() + '-' + params.event.logIndex.toString())
  stakeHistoryItem.user = params.user
  stakeHistoryItem.action = params.action
  stakeHistoryItem.timestamp = params.event.block.timestamp.toI32()
  stakeHistoryItem.transaction = params.event.transaction.hash.toHexString()
  if (params.amount.gt(BigDecimal.zero())) {
    stakeHistoryItem.amount = params.amount
  }
  if (params.token != ZERO_ADDRESS) {
    stakeHistoryItem.token = params.token
  }
  if (params.lockedUntil > BigInt.zero()) {
    stakeHistoryItem.lockedUntil = params.lockedUntil.toI32()
  }
  if (params.delegatee != ZERO_ADDRESS) {
    stakeHistoryItem.delegatee = createAndReturnUser(Address.fromString(params.delegatee), params.event.block.timestamp).id
  }
  stakeHistoryItem.emittedBy = params.event.address
  stakeHistoryItem.save()
  return stakeHistoryItem
}
