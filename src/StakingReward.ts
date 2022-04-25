import { RewardWithdrawn as RewardWithdrawnEvent } from '../generated/StakingReward/StakingReward'
import { UserRewardsEarnedHistory, RewardsEarnedHistoryItem } from '../generated/schema'

import { createAndReturnTransaction } from './utils/Transaction'
import { createAndReturnUser } from './utils/User'
import { BigInt } from '@graphprotocol/graph-ts'
import { RewardsEarnedAction } from './utils/types'

export function handleRewardWithdrawn(event: RewardWithdrawnEvent): void {
  createAndReturnTransaction(event)
  createAndReturnUser(event.params.receiver, event.block.timestamp)
  /** TODO: Find out if we can change this to user.availableRewardSov = user.availableRewardSov.minus(event.params.amount)
   * This should have the same effect of reseting it to 0, but the logic would be more future-proof
   */

  let userRewardsEarnedHistory = UserRewardsEarnedHistory.load(event.params.receiver.toHexString())
  if (userRewardsEarnedHistory != null) {
    userRewardsEarnedHistory.availableRewardSov = BigInt.zero()
    userRewardsEarnedHistory.save()
  } else {
    userRewardsEarnedHistory = new UserRewardsEarnedHistory(event.params.receiver.toHexString())
    userRewardsEarnedHistory.availableRewardSov = BigInt.zero()
    userRewardsEarnedHistory.availableTradingRewards = BigInt.zero()
    userRewardsEarnedHistory.totalFeesAndRewardsEarned = BigInt.zero()
    userRewardsEarnedHistory.user = event.params.receiver.toHexString()
    userRewardsEarnedHistory.save()
  }

  let rewardsHistoryItem = new RewardsEarnedHistoryItem(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  rewardsHistoryItem.action = RewardsEarnedAction.StakingRewardWithdrawn
  rewardsHistoryItem.user = event.params.receiver.toHexString()
  rewardsHistoryItem.amount = event.params.amount
  rewardsHistoryItem.timestamp = event.block.timestamp
  rewardsHistoryItem.transaction = event.transaction.hash.toHexString()
  rewardsHistoryItem.save()
}
