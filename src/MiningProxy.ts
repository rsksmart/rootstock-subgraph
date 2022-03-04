import { RewardClaimed as RewardClaimedEvent } from '../generated/MiningProxy/MiningProxy'
import { RewardClaimed, UserRewardsEarnedHistory, RewardsEarnedHistoryItem } from '../generated/schema'

import { loadTransaction } from './utils/Transaction'
import { createAndReturnUser } from './utils/User'
import { BigInt } from '@graphprotocol/graph-ts'

export function handleRewardClaimed(event: RewardClaimedEvent): void {
  let entity = new RewardClaimed(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.user = event.params.user
  entity.poolToken = event.params.poolToken
  entity.amount = event.params.amount
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

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

  let rewardsEarnedHistoryItem = new RewardsEarnedHistoryItem(event.transaction.hash.toHexString())
  rewardsEarnedHistoryItem.action = 'RewardClaimed'
  rewardsEarnedHistoryItem.user = event.params.user.toHexString()
  rewardsEarnedHistoryItem.amount = event.params.amount
  rewardsEarnedHistoryItem.timestamp = event.block.timestamp
  rewardsEarnedHistoryItem.transaction = event.transaction.hash.toHexString()
  rewardsEarnedHistoryItem.save()
}
