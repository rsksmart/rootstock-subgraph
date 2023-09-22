import { RewardWithdrawn as RewardWithdrawnEvent } from '../generated/StakingReward/StakingReward'
import { createAndReturnTransaction } from './utils/Transaction'
import { createAndReturnUser } from './utils/User'
import { RewardsEarnedAction } from './utils/types'
import { DEFAULT_DECIMALS, decimal } from '@protofire/subgraph-toolkit'
import { createOrIncrementRewardItem } from './utils/RewardsEarnedHistoryItem'
import { incrementTotalStakingRewards } from './utils/UserRewardsEarnedHistory'
import { SOVAddress } from './contracts/contracts'

export function handleRewardWithdrawn(event: RewardWithdrawnEvent): void {
  const amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
  createAndReturnTransaction(event)
  createAndReturnUser(event.params.receiver, event.block.timestamp)
  incrementTotalStakingRewards(event.params.receiver, amount)
  createOrIncrementRewardItem({
    action: RewardsEarnedAction.StakingRewardWithdrawn,
    user: event.params.receiver,
    amount: amount,
    timestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
    token: SOVAddress,
    event,
  })
}
