import {
  CheckpointAdded as CheckpointAddedEvent,
  FeeAMMWithdrawn as FeeAMMWithdrawnEvent,
  FeeWithdrawn as FeeWithdrawnEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  TokensTransferred as TokensTransferredEvent,
  UnwhitelistedConverter as UnwhitelistedConverterEvent,
  UserFeeWithdrawn as UserFeeWithdrawnEvent,
  WhitelistedConverter as WhitelistedConverterEvent,
} from '../generated/FeeSharingProxy/FeeSharingProxy'
import { StakeHistoryItem, FeeSharingTokensTransferred, RewardsEarnedHistoryItem } from '../generated/schema'
import { StakeHistoryAction, RewardsEarnedAction } from './utils/types'
import { createAndReturnTransaction } from './utils/Transaction'
import { DEFAULT_DECIMALS, decimal } from '@protofire/subgraph-toolkit'

export function handleCheckpointAdded(event: CheckpointAddedEvent): void {}

export function handleFeeAMMWithdrawn(event: FeeAMMWithdrawnEvent): void {}

export function handleFeeWithdrawn(event: FeeWithdrawnEvent): void {}

export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {}

export function handleTokensTransferred(event: TokensTransferredEvent): void {
  /** If this event occurs in the same transaction as a StakingWithdrawn or TokensWithdrawn event on the staking contract, it means the user unstaked their SOV early
   * This event is emitted when the "slashing" penalty for early unstaking occurs
   * This event is emitted BEFORE TokensWithdrawn
   */

  let tokensTransferredEntity = new FeeSharingTokensTransferred(event.transaction.hash.toHexString())
  tokensTransferredEntity.sender = event.params.sender
  tokensTransferredEntity.token = event.params.token
  tokensTransferredEntity.amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
  tokensTransferredEntity.save()
}

export function handleUnwhitelistedConverter(event: UnwhitelistedConverterEvent): void {}

export function handleUserFeeWithdrawn(event: UserFeeWithdrawnEvent): void {
  createAndReturnTransaction(event)
  let stakeHistoryItem = new StakeHistoryItem(event.params.sender.toHexString())
  stakeHistoryItem.user = event.params.sender.toHexString()
  stakeHistoryItem.action = StakeHistoryAction.FeeWithdrawn
  stakeHistoryItem.timestamp = event.block.timestamp.toI32()
  stakeHistoryItem.amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
  stakeHistoryItem.transaction = event.transaction.hash.toHexString()
  stakeHistoryItem.save()

  let rewardsEarnedHistoryItem = new RewardsEarnedHistoryItem(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  rewardsEarnedHistoryItem.action = RewardsEarnedAction.UserFeeWithdrawn
  rewardsEarnedHistoryItem.user = event.params.sender.toHexString()
  rewardsEarnedHistoryItem.amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
  rewardsEarnedHistoryItem.timestamp = event.block.timestamp.toI32()
  rewardsEarnedHistoryItem.transaction = event.transaction.hash.toHexString()
  rewardsEarnedHistoryItem.save()
}

export function handleWhitelistedConverter(event: WhitelistedConverterEvent): void {}
