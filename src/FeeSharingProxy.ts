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
import { StakeHistoryItem, FeeSharingTokensTransferred } from '../generated/schema'
import { StakeHistoryAction } from './utils/types'
import { createAndReturnTransaction } from './utils/Transaction'

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
  tokensTransferredEntity.amount = event.params.amount
  tokensTransferredEntity.save()
}

export function handleUnwhitelistedConverter(event: UnwhitelistedConverterEvent): void {}

export function handleUserFeeWithdrawn(event: UserFeeWithdrawnEvent): void {
  createAndReturnTransaction(event)
  let stakeHistoryItem = new StakeHistoryItem(event.params.sender.toHexString())
  stakeHistoryItem.user = event.params.sender.toHexString()
  stakeHistoryItem.action = StakeHistoryAction.FeeWithdrawn
  stakeHistoryItem.timestamp = event.block.timestamp
  stakeHistoryItem.amount = event.params.amount
  stakeHistoryItem.transaction = event.transaction.hash.toHexString()
  stakeHistoryItem.save()
}

export function handleWhitelistedConverter(event: WhitelistedConverterEvent): void {}
