import { TokensTransferred as TokensTransferredEvent, UserFeeWithdrawn as UserFeeWithdrawnEvent } from '../generated/FeeSharingProxy/FeeSharingProxy'
import { StakeHistoryItem, FeeSharingTokensTransferred } from '../generated/schema'
import { StakeHistoryAction, RewardsEarnedAction } from './utils/types'
import { createAndReturnTransaction } from './utils/Transaction'
import { DEFAULT_DECIMALS, decimal } from '@protofire/subgraph-toolkit'
import { createOrIncrementRewardItem } from './utils/RewardsEarnedHistoryItem'
import { incrementTotalFeeWithdrawn } from './utils/UserRewardsEarnedHistory'

export function handleTokensTransferred(event: TokensTransferredEvent): void {
  /** If this event occurs in the same transaction as a StakingWithdrawn or TokensWithdrawn event on the staking contract, it means the user unstaked their SOV early
   * This event is emitted when the "slashing" penalty for early unstaking occurs
   * This event is emitted BEFORE TokensWithdrawn
   */

  const tokensTransferredEntity = new FeeSharingTokensTransferred(event.transaction.hash.toHexString())
  tokensTransferredEntity.sender = event.params.sender
  tokensTransferredEntity.token = event.params.token
  tokensTransferredEntity.amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
  tokensTransferredEntity.save()
}

export function handleUserFeeWithdrawn(event: UserFeeWithdrawnEvent): void {
  createAndReturnTransaction(event)
  const amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
  const stakeHistoryItem = new StakeHistoryItem(event.transaction.index.toHexString() + '-' + event.logIndex.toString())
  stakeHistoryItem.user = event.params.sender.toHexString()
  stakeHistoryItem.action = StakeHistoryAction.FeeWithdrawn
  stakeHistoryItem.timestamp = event.block.timestamp.toI32()
  stakeHistoryItem.amount = amount
  stakeHistoryItem.token = event.params.token.toHexString()
  stakeHistoryItem.transaction = event.transaction.hash.toHexString()
  stakeHistoryItem.save()
  incrementTotalFeeWithdrawn(event.params.sender, amount, event.params.token)
  createOrIncrementRewardItem({
    action: RewardsEarnedAction.UserFeeWithdrawn,
    user: event.params.sender,
    amount: amount,
    timestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
    token: event.params.token.toHexString(),
  })
}
