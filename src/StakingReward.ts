import { RewardWithdrawn as RewardWithdrawnEvent } from '../generated/StakingReward/StakingReward'
import { createAndReturnTransaction } from './utils/Transaction'
import { createAndReturnUser } from './utils/User'
import { RewardsEarnedAction } from './utils/types'
import { DEFAULT_DECIMALS, decimal } from '@protofire/subgraph-toolkit'
import { createOrIncrementRewardItem } from './utils/RewardsEarnedHistoryItem'

export function handleRewardWithdrawn(event: RewardWithdrawnEvent): void {
  createAndReturnTransaction(event)
  createAndReturnUser(event.params.receiver, event.block.timestamp)
  createOrIncrementRewardItem({
    action: RewardsEarnedAction.StakingRewardWithdrawn,
    user: event.params.receiver,
    amount: decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS),
    timestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  })
}
