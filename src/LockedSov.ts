import { BigDecimal } from '@graphprotocol/graph-ts'
import { DEFAULT_DECIMALS, decimal } from '@protofire/subgraph-toolkit'
import { TokenStaked as TokenStakedEvent } from '../generated/LockedSov/LockedSov'
import { UserRewardsEarnedHistory, RewardsEarnedHistoryItem } from '../generated/schema'
import { RewardsEarnedAction } from './utils/types'
import { createAndReturnTransaction } from './utils/Transaction'

export function handleTokenStaked(event: TokenStakedEvent): void {
  createAndReturnTransaction(event)

  let userRewardsEarnedHistory = UserRewardsEarnedHistory.load(event.params._initiator.toHexString())
  if (userRewardsEarnedHistory != null) {
    userRewardsEarnedHistory.availableTradingRewards = BigDecimal.zero()
    userRewardsEarnedHistory.save()
  } else {
    userRewardsEarnedHistory = new UserRewardsEarnedHistory(event.params._initiator.toHexString())
    userRewardsEarnedHistory.totalTradingRewards = BigDecimal.zero()
    userRewardsEarnedHistory.availableTradingRewards = BigDecimal.zero()
    userRewardsEarnedHistory.totalFeesAndRewardsEarned = BigDecimal.zero()
    userRewardsEarnedHistory.user = event.params._initiator.toHexString()
    userRewardsEarnedHistory.save()
  }

  let rewardsEarnedHistoryItem = new RewardsEarnedHistoryItem(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  rewardsEarnedHistoryItem.action = RewardsEarnedAction.RewardSovStaked
  rewardsEarnedHistoryItem.user = event.params._initiator.toHexString()
  rewardsEarnedHistoryItem.amount = decimal.fromBigInt(event.params._amount, DEFAULT_DECIMALS)
  rewardsEarnedHistoryItem.timestamp = event.block.timestamp.toI32()
  rewardsEarnedHistoryItem.transaction = event.transaction.hash.toHexString()
  rewardsEarnedHistoryItem.save()
}
