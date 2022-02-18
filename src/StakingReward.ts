import { RewardWithdrawn as RewardWithdrawnEvent } from '../generated/StakingReward/StakingReward'
import { RewardWithdrawn, UserRewardsEarnedHistory, RewardsEarnedHistoryItem } from '../generated/schema'

import { loadTransaction } from './utils/Transaction'
import { createAndReturnUser } from './utils/User'
import { BigInt } from '@graphprotocol/graph-ts'

export function handleRewardWithdrawn(event: RewardWithdrawnEvent): void {
  let entity = new RewardWithdrawn(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.receiver = event.params.receiver
  entity.amount = event.params.amount
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  createAndReturnUser(event.params.receiver)
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

  let rewardsHistoryItem = new RewardsEarnedHistoryItem(event.transaction.hash.toHexString())
  rewardsHistoryItem.action = 'StakingRewardWithdrawn'
  rewardsHistoryItem.user = event.params.receiver.toHexString()
  rewardsHistoryItem.amount = event.params.amount
  rewardsHistoryItem.timestamp = event.block.timestamp
  rewardsHistoryItem.transaction = event.transaction.hash.toHexString()
  rewardsHistoryItem.save()
}
