import {
  DelegateChanged as DelegateChangedEvent,
  DelegateStakeChanged as DelegateStakeChangedEvent,
  ExtendedStakingDuration as ExtendedStakingDurationEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  TokensStaked as TokensStakedEvent,
  TokensUnlocked as TokensUnlockedEvent,
  TokensWithdrawn as TokensWithdrawnEvent,
  StakingWithdrawn as StakingWithdrawnEvent,
  VestingTokensWithdrawn as VestingTokensWithdrawnEvent,
} from '../generated/Staking/Staking'
import { DelegateStakeChanged, UserStakeHistory, TokensStaked, VestingContract, VestingTokensWithdrawn, User } from '../generated/schema'
import { loadTransaction } from './utils/Transaction'
import { createAndReturnUser } from './utils/User'
import { ZERO_ADDRESS } from '@protofire/subgraph-toolkit'
import { BigInt } from '@graphprotocol/graph-ts'
import { createAndReturnLiquidityPool } from './utils/LiquidityPool'

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
  let transaction = loadTransaction(event)
  entity.staker = event.params.staker
  entity.amount = event.params.amount
  entity.lockedUntil = event.params.lockedUntil
  entity.totalStaked = event.params.totalStaked
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  let vestingContract = VestingContract.load(event.params.staker.toHexString())
  entity.isUserStaked == false

  /** Gensis Vesting contracts did not emit a VestingCreated event. Therefore, they need to be created from here.
   * We will create a special case for if caller != staker between the genesis block range
   */

  if (
    vestingContract == null &&
    event.block.number <= BigInt.fromString('1731114') &&
    event.block.number >= BigInt.fromString('1617004') &&
    event.transaction.from.toHexString() !== event.params.staker.toHexString()
  ) {
    let newVestingContract = new VestingContract(event.params.staker.toHexString())
    let user = createAndReturnUser(event.transaction.from)
    newVestingContract.user = user.id
    newVestingContract.type = 'Genesis'
    newVestingContract.emittedBy = event.address
    newVestingContract.createdAtTransaction = transaction.id
    newVestingContract.stakeHistory.push(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
    newVestingContract.save()
  } else if (vestingContract == null) {
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
  } else if (vestingContract != null) {
    vestingContract.stakeHistory.push(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
    vestingContract.save()
  }
}

export function handleTokensUnlocked(event: TokensUnlockedEvent): void {}

export function handleTokensWithdrawn(event: TokensWithdrawnEvent): void {
  /** TODO: If staker is user, then withdraw. Otherwise, Withdraw Vested Tokens */
  let transaction = loadTransaction(event)
  let stakeHistoryEntity = new UserStakeHistory(event.transaction.hash.toHexString())
  let user = User.load(event.params.staker.toHexString())
  let vesting = VestingContract.load(event.params.staker.toHexString())
  if (user !== null) {
    stakeHistoryEntity.user = event.params.receiver.toHexString()
    stakeHistoryEntity.action = 'WithdrawStaked' // TODO: Change to Unstake if there is a feesharing TokensTransferred event in this transaction
    stakeHistoryEntity.timestamp = event.block.timestamp
    stakeHistoryEntity.transaction = transaction.id
    stakeHistoryEntity.save()
  } else if (vesting != null) {
    stakeHistoryEntity.user = event.params.receiver.toHexString()
    stakeHistoryEntity.action = 'WithdrawVested' // TODO: Change to Unstake if there is a feesharing TokensTransferred event in this transaction
    stakeHistoryEntity.timestamp = event.block.timestamp
    stakeHistoryEntity.transaction = transaction.id
    stakeHistoryEntity.save()
  }
}

export function handleStakingWithdrawn(event: StakingWithdrawnEvent): void {
  let transaction = loadTransaction(event)
  let stakeHistoryEntity = new UserStakeHistory(event.transaction.hash.toHexString())
  stakeHistoryEntity.user = event.params.receiver.toHexString()
  stakeHistoryEntity.action = 'Withdraw'
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
