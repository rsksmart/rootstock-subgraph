import { RewardClaimed as RewardClaimedEvent } from '../generated/MiningProxy/MiningProxy'
import { UserRewardsEarnedHistory, RewardsEarnedHistoryItem } from '../generated/schema'

import { createAndReturnTransaction } from './utils/Transaction'
import { createAndReturnUser } from './utils/User'
import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { RewardsEarnedAction } from './utils/types'
import { DEFAULT_DECIMALS, decimal } from '@protofire/subgraph-toolkit'

export function handleRewardClaimed(event: RewardClaimedEvent): void {
  createAndReturnTransaction(event)
  createAndReturnUser(event.params.user, event.block.timestamp)

  const amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)

  let userRewardsEarnedHistory = UserRewardsEarnedHistory.load(event.params.user.toHexString())
  if (userRewardsEarnedHistory != null) {
    userRewardsEarnedHistory.availableRewardSov = userRewardsEarnedHistory.availableRewardSov.plus(amount)
    userRewardsEarnedHistory.save()
  } else {
    userRewardsEarnedHistory = new UserRewardsEarnedHistory(event.params.user.toHexString())
    userRewardsEarnedHistory.availableRewardSov = amount
    userRewardsEarnedHistory.availableTradingRewards = BigDecimal.zero()
    userRewardsEarnedHistory.totalFeesAndRewardsEarned = userRewardsEarnedHistory.totalFeesAndRewardsEarned.plus(amount)
    userRewardsEarnedHistory.user = event.params.user.toHexString()
    userRewardsEarnedHistory.save()
  }

  let rewardsEarnedHistoryItem = new RewardsEarnedHistoryItem(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  rewardsEarnedHistoryItem.action = RewardsEarnedAction.RewardClaimed
  rewardsEarnedHistoryItem.user = event.params.user.toHexString()
  rewardsEarnedHistoryItem.amount = amount
  rewardsEarnedHistoryItem.timestamp = event.block.timestamp.toI32()
  rewardsEarnedHistoryItem.transaction = event.transaction.hash.toHexString()
  rewardsEarnedHistoryItem.save()
}
