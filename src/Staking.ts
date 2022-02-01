import {
  DelegateChanged as DelegateChangedEvent,
  DelegateStakeChanged as DelegateStakeChangedEvent,
  ExtendedStakingDuration as ExtendedStakingDurationEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  TokensStaked as TokensStakedEvent,
  TokensUnlocked as TokensUnlockedEvent,
  TokensWithdrawn as TokensWithdrawnEvent,
  VestingTokensWithdrawn as VestingTokensWithdrawnEvent,
} from '../generated/Staking/Staking'
import { DelegateStakeChanged, UserStakeHistory, TokensStaked, VestingContract, VestingTokensWithdrawn, User } from '../generated/schema'
import { loadTransaction } from './utils/Transaction'
import { createAndReturnUser } from './utils/User'
import { ZERO_ADDRESS } from '@protofire/subgraph-toolkit'

export function handleDelegateChanged(event: DelegateChangedEvent): void {
  let user = User.load(event.params.delegator.toHexString())
  if (event.params.fromDelegate.toHexString() != ZERO_ADDRESS && user != null) {
    let transaction = loadTransaction(event)
    let stakeHistoryEntity = new UserStakeHistory(event.transaction.hash.toHexString())
    stakeHistoryEntity.user = user.id
    stakeHistoryEntity.action = 'Delegate'
    stakeHistoryEntity.timestamp = event.block.timestamp
    stakeHistoryEntity.transaction = transaction.id
    stakeHistoryEntity.lockedUntil = event.params.lockedUntil
    stakeHistoryEntity.save()
  }
}

export function handleDelegateStakeChanged(event: DelegateStakeChangedEvent): void {
  let entity = new DelegateStakeChanged(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.delegate = event.params.delegate
  entity.lockedUntil = event.params.lockedUntil
  entity.previousBalance = event.params.previousBalance
  entity.newBalance = event.params.newBalance
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleExtendedStakingDuration(event: ExtendedStakingDurationEvent): void {
  let transaction = loadTransaction(event)
  let stakeHistoryEntity = new UserStakeHistory(event.transaction.hash.toHexString())
  stakeHistoryEntity.user = event.params.staker.toHexString()
  stakeHistoryEntity.action = 'Extend Stake'
  stakeHistoryEntity.timestamp = event.block.timestamp
  stakeHistoryEntity.transaction = transaction.id
  stakeHistoryEntity.lockedUntil = event.params.newDate
  stakeHistoryEntity.save()
}

export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {}

export function handleTokensStaked(event: TokensStakedEvent): void {
  let entity = new TokensStaked(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  let vestingContract = VestingContract.load(event.params.staker.toHexString())
  let transaction = loadTransaction(event)
  entity.isUserStaked == false

  if (vestingContract == null) {
    entity.isUserStaked = true
    let user = createAndReturnUser(event.params.staker)
    entity.user = user.id
    let stakeHistoryEntity = new UserStakeHistory(event.transaction.hash.toHexString())
    stakeHistoryEntity.user = user.id
    stakeHistoryEntity.action = event.params.amount < event.params.totalStaked ? 'Increase Stake' : 'Stake'
    stakeHistoryEntity.timestamp = event.block.timestamp
    stakeHistoryEntity.transaction = transaction.id
    stakeHistoryEntity.amount = event.params.amount
    stakeHistoryEntity.lockedUntil = event.params.lockedUntil
    stakeHistoryEntity.save()
  }

  entity.staker = event.params.staker
  entity.amount = event.params.amount
  entity.lockedUntil = event.params.lockedUntil
  entity.totalStaked = event.params.totalStaked
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleTokensUnlocked(event: TokensUnlockedEvent): void {}

export function handleTokensWithdrawn(event: TokensWithdrawnEvent): void {
  let transaction = loadTransaction(event)
  let stakeHistoryEntity = new UserStakeHistory(event.transaction.hash.toHexString())
  stakeHistoryEntity.user = event.params.receiver.toHexString()
  stakeHistoryEntity.action = 'Withdraw' // TODO: Change to Unstake if there is a feesharing TokensTransferred event in this transaction
  stakeHistoryEntity.timestamp = event.block.timestamp
  stakeHistoryEntity.transaction = transaction.id
  stakeHistoryEntity.save()
}

export function handleVestingTokensWithdrawn(event: VestingTokensWithdrawnEvent): void {
  let entity = new VestingTokensWithdrawn(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.vesting = event.params.vesting.toHexString()
  entity.receiver = event.params.receiver
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}
