import { RewardClaimed as RewardClaimedEvent } from '../generated/MiningProxy/MiningProxy'
import { UserRewardsEarnedHistory, RewardsEarnedHistoryItem } from '../generated/schema'

import { createAndReturnTransaction } from './utils/Transaction'
import { createAndReturnUser } from './utils/User'
import { BigInt } from '@graphprotocol/graph-ts'
import { RewardsEarnedAction } from './utils/types'

export function handleRewardClaimed(event: RewardClaimedEvent): void {
  createAndReturnTransaction(event)
  createAndReturnUser(event.params.user)

  let userRewardsEarnedHistory = UserRewardsEarnedHistory.load(event.params.user.toHexString())
  if (userRewardsEarnedHistory != null) {
    userRewardsEarnedHistory.availableRewardSov = userRewardsEarnedHistory.availableRewardSov.plus(event.params.amount)
    userRewardsEarnedHistory.save()
  } else {
    userRewardsEarnedHistory = new UserRewardsEarnedHistory(event.params.user.toHexString())
    userRewardsEarnedHistory.availableRewardSov = event.params.amount
    userRewardsEarnedHistory.availableTradingRewards = BigInt.zero()
    userRewardsEarnedHistory.totalFeesAndRewardsEarned = userRewardsEarnedHistory.totalFeesAndRewardsEarned.plus(event.params.amount)
    userRewardsEarnedHistory.user = event.params.user.toHexString()
    userRewardsEarnedHistory.save()
  }

  let rewardsEarnedHistoryItem = new RewardsEarnedHistoryItem(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  rewardsEarnedHistoryItem.action = RewardsEarnedAction.RewardClaimed
  rewardsEarnedHistoryItem.user = event.params.user.toHexString()
  rewardsEarnedHistoryItem.amount = event.params.amount
  rewardsEarnedHistoryItem.timestamp = event.block.timestamp
  rewardsEarnedHistoryItem.transaction = event.transaction.hash.toHexString()
  rewardsEarnedHistoryItem.save()
}
