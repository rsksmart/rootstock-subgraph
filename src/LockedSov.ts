import { BigInt } from '@graphprotocol/graph-ts'
import { TokenStaked as TokenStakedEvent } from '../generated/LockedSov/LockedSov'
import { UserRewardsEarnedHistory, RewardsEarnedHistoryItem } from '../generated/schema'
import { RewardsEarnedAction } from './utils/types'
import { createAndReturnTransaction } from './utils/Transaction'

export function handleTokenStaked(event: TokenStakedEvent): void {
  createAndReturnTransaction(event)

  let userRewardsEarnedHistory = UserRewardsEarnedHistory.load(event.params._initiator.toHexString())
  if (userRewardsEarnedHistory != null) {
    userRewardsEarnedHistory.availableTradingRewards = BigInt.zero()
    userRewardsEarnedHistory.save()
  } else {
    userRewardsEarnedHistory = new UserRewardsEarnedHistory(event.params._initiator.toHexString())
    userRewardsEarnedHistory.availableRewardSov = BigInt.zero()
    userRewardsEarnedHistory.availableTradingRewards = BigInt.zero()
    userRewardsEarnedHistory.totalFeesAndRewardsEarned = BigInt.zero()
    userRewardsEarnedHistory.user = event.params._initiator.toHexString()
    userRewardsEarnedHistory.save()
  }

  let rewardsEarnedHistoryItem = new RewardsEarnedHistoryItem(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  rewardsEarnedHistoryItem.action = RewardsEarnedAction.RewardSovStaked
  rewardsEarnedHistoryItem.user = event.params._initiator.toHexString()
  rewardsEarnedHistoryItem.amount = event.params._amount
  rewardsEarnedHistoryItem.timestamp = event.block.timestamp
  rewardsEarnedHistoryItem.transaction = event.transaction.hash.toHexString()
  rewardsEarnedHistoryItem.save()
}
