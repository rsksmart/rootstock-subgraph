import { RewardWithdrawn as RewardWithdrawnEvent } from '../generated/StakingReward/StakingReward'
import { UserRewardsEarnedHistory, RewardsEarnedHistoryItem } from '../generated/schema'

import { createAndReturnTransaction } from './utils/Transaction'
import { createAndReturnUser } from './utils/User'
import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { RewardsEarnedAction } from './utils/types'
import { DEFAULT_DECIMALS, decimal } from '@protofire/subgraph-toolkit'

export function handleRewardWithdrawn(event: RewardWithdrawnEvent): void {
  createAndReturnTransaction(event)
  createAndReturnUser(event.params.receiver, event.block.timestamp)
  let rewardsHistoryItem = new RewardsEarnedHistoryItem(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  rewardsHistoryItem.action = RewardsEarnedAction.StakingRewardWithdrawn
  rewardsHistoryItem.user = event.params.receiver.toHexString()
  rewardsHistoryItem.amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
  rewardsHistoryItem.timestamp = event.block.timestamp.toI32()
  rewardsHistoryItem.transaction = event.transaction.hash.toHexString()
  rewardsHistoryItem.save()
}
