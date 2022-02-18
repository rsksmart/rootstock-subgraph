import { BigInt } from '@graphprotocol/graph-ts'
import { Deposited as DepositedEvent, TokenStaked as TokenStakedEvent } from '../generated/LockedSov/LockedSov'
import { Deposited, UserRewardsEarnedHistory, RewardsEarnedHistoryItem } from '../generated/schema'

import { loadTransaction } from './utils/Transaction'
import { createAndReturnUser } from './utils/User'

export function handleDeposited(event: DepositedEvent): void {
  let entity = new Deposited(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._initiator = event.params._initiator
  entity._userAddress = event.params._userAddress
  entity._sovAmount = event.params._sovAmount
  entity._basisPoint = event.params._basisPoint
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  createAndReturnUser(event.params._userAddress)
  let userRewardsEarnedHistory = UserRewardsEarnedHistory.load(event.params._userAddress.toHexString())
  if (userRewardsEarnedHistory != null) {
    userRewardsEarnedHistory.availableRewardSov = userRewardsEarnedHistory.availableRewardSov.plus(event.params._sovAmount)
    userRewardsEarnedHistory.save()
  } else {
    userRewardsEarnedHistory = new UserRewardsEarnedHistory(event.params._userAddress.toHexString())
    userRewardsEarnedHistory.availableRewardSov = event.params._sovAmount
    userRewardsEarnedHistory.availableTradingRewards = BigInt.zero()
    userRewardsEarnedHistory.totalFeesAndRewardsEarned = event.params._sovAmount
    userRewardsEarnedHistory.user = event.params._userAddress.toHexString()
    userRewardsEarnedHistory.save()
  }

  let rewardsEarnedHistoryItem = new RewardsEarnedHistoryItem(event.transaction.hash.toHexString())
  rewardsEarnedHistoryItem.action = 'RewardSovDeposited'
  rewardsEarnedHistoryItem.user = event.params._userAddress.toHexString()
  rewardsEarnedHistoryItem.amount = event.params._sovAmount
  rewardsEarnedHistoryItem.timestamp = event.block.timestamp
  rewardsEarnedHistoryItem.transaction = event.transaction.hash.toHexString()
  rewardsEarnedHistoryItem.save()
}

export function handleTokenStaked(event: TokenStakedEvent): void {
  createAndReturnUser(event.params._initiator)
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

  let rewardsEarnedHistoryItem = new RewardsEarnedHistoryItem(event.transaction.hash.toHexString())
  rewardsEarnedHistoryItem.action = 'RewardSovStaked'
  rewardsEarnedHistoryItem.user = event.params._initiator.toHexString()
  rewardsEarnedHistoryItem.amount = event.params._amount
  rewardsEarnedHistoryItem.timestamp = event.block.timestamp
  rewardsEarnedHistoryItem.transaction = event.transaction.hash.toHexString()
  rewardsEarnedHistoryItem.save()
}
