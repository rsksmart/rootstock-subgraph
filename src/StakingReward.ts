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
  /** TODO: Find out if we can change this to user.availableRewardSov = user.availableRewardSov.minus(event.params.amount)
   * This should have the same effect of reseting it to 0, but the logic would be more future-proof
   */

  let userRewardsEarnedHistory = UserRewardsEarnedHistory.load(event.params.receiver.toHexString())
  if (userRewardsEarnedHistory != null) {
    userRewardsEarnedHistory.availableRewardSov = BigDecimal.zero()
    userRewardsEarnedHistory.save()
  } else {
    userRewardsEarnedHistory = new UserRewardsEarnedHistory(event.params.receiver.toHexString())
    userRewardsEarnedHistory.availableRewardSov = BigDecimal.zero()
    userRewardsEarnedHistory.availableTradingRewards = BigDecimal.zero()
    userRewardsEarnedHistory.totalFeesAndRewardsEarned = BigDecimal.zero()
    userRewardsEarnedHistory.user = event.params.receiver.toHexString()
    userRewardsEarnedHistory.save()
  }

  let rewardsHistoryItem = new RewardsEarnedHistoryItem(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  rewardsHistoryItem.action = RewardsEarnedAction.StakingRewardWithdrawn
  rewardsHistoryItem.user = event.params.receiver.toHexString()
  rewardsHistoryItem.amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
  rewardsHistoryItem.timestamp = event.block.timestamp.toI32()
  rewardsHistoryItem.transaction = event.transaction.hash.toHexString()
  rewardsHistoryItem.save()
}
