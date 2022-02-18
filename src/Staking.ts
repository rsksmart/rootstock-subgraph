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
import { DelegateStakeChanged, StakeHistoryItem, TokensStaked, VestingContract, VestingTokensWithdrawn, User, Transaction } from '../generated/schema'
import { loadTransaction } from './utils/Transaction'
import { createAndReturnUser, createAndReturnUserStakeHistory } from './utils/User'
import { ZERO_ADDRESS } from '@protofire/subgraph-toolkit'
import { Address, BigInt } from '@graphprotocol/graph-ts'

export function handleDelegateChanged(event: DelegateChangedEvent): void {
  let user = User.load(event.params.delegator.toHexString())
  if (event.params.fromDelegate.toHexString() != ZERO_ADDRESS && user != null) {
    let transaction = loadTransaction(event)
    let stakeHistoryItem = new StakeHistoryItem(event.transaction.hash.toHexString())
    stakeHistoryItem.user = event.params.delegator.toHexString()
    stakeHistoryItem.action = 'Delegate'
    stakeHistoryItem.timestamp = event.block.timestamp
    stakeHistoryItem.transaction = transaction.id
    stakeHistoryItem.lockedUntil = event.params.lockedUntil
    stakeHistoryItem.save()
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
  let stakeHistoryItem = new StakeHistoryItem(event.params.staker.toHexString())
  stakeHistoryItem.user = event.params.staker.toHexString()
  stakeHistoryItem.action = 'Extend Stake'
  stakeHistoryItem.timestamp = event.block.timestamp
  stakeHistoryItem.transaction = transaction.id
  stakeHistoryItem.lockedUntil = event.params.newDate
  stakeHistoryItem.save()
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
    newVestingContract.startingBalance = event.params.amount
    newVestingContract.currentBalance = BigInt.zero()
    newVestingContract.save()
  } else if (vestingContract == null) {
    createAndReturnUser(event.params.staker)

    let userStakeHistory = createAndReturnUserStakeHistory(event.params.staker)
    userStakeHistory.totalStaked = userStakeHistory.totalStaked.plus(event.params.amount)
    userStakeHistory.totalRemaining = userStakeHistory.totalRemaining.plus(event.params.amount)
    userStakeHistory.save()

    entity.isUserStaked = true
    entity.user = event.params.staker.toHexString()
    let stakeHistoryItem = new StakeHistoryItem(event.params.staker.toHexString())
    stakeHistoryItem.user = event.params.staker.toHexString()
    stakeHistoryItem.action = event.params.amount < event.params.totalStaked ? 'Increase Stake' : 'Stake'
    stakeHistoryItem.timestamp = event.block.timestamp
    stakeHistoryItem.transaction = transaction.id
    stakeHistoryItem.amount = event.params.amount
    stakeHistoryItem.lockedUntil = event.params.lockedUntil
    stakeHistoryItem.save()
  }
}

export function handleTokensUnlocked(event: TokensUnlockedEvent): void {}

export function handleTokensWithdrawn(event: TokensWithdrawnEvent): void {
  let transaction = loadTransaction(event)
  handleStakingOrTokensWithdrawn(transaction, event.params.staker, event.params.receiver, event.params.amount)
}

/** This is a copy of handleTokensWithdrawn. The event was renamed but params remained the same. */
export function handleStakingWithdrawn(event: StakingWithdrawnEvent): void {
  let transaction = loadTransaction(event)
  handleStakingOrTokensWithdrawn(transaction, event.params.staker, event.params.receiver, event.params.amount)
}

function handleStakingOrTokensWithdrawn(transaction: Transaction, staker: Address, receiver: Address, amount: BigInt): void {
  let stakeHistoryItem = new StakeHistoryItem(transaction.id)
  let user = User.load(staker.toHexString())
  let vesting = VestingContract.load(staker.toHexString())
  if (user !== null) {
    stakeHistoryItem.user = receiver.toHexString()
    /** In the FeeSharingProxy mapping, the handleTokensTransferred function will change this to Unstaked if a slashing event occurred */
    stakeHistoryItem.action = 'WithdrawStaked'
    stakeHistoryItem.timestamp = transaction.timestamp
    stakeHistoryItem.transaction = transaction.id
    stakeHistoryItem.save()

    let userStakeHistory = createAndReturnUserStakeHistory(receiver)
    userStakeHistory.totalWithdrawn = userStakeHistory.totalWithdrawn.minus(amount)
    userStakeHistory.totalRemaining = userStakeHistory.totalRemaining.minus(amount)
    userStakeHistory.save()
  } else if (vesting != null) {
    /** TODO: Don't hard code the addresses. They are GovernorAlpha, GovernorOwner and Multisig */
    const adminContracts = [
      '0x924f5ad34698Fd20c90Fe5D5A8A0abd3b42dc711'.toLowerCase(),
      '0x05f4f068DF59a5aA7911f57cE4f41ebFBcB8E247'.toLowerCase(),
      '0x51C754330c6cD04B810014E769Dab0343E31409E'.toLowerCase(),
    ]
    if (adminContracts.includes(receiver.toHexString().toLowerCase()) && vesting.type == 'Team') {
      /** This happens when a team member with vesting contract leaves the project and their remaining balance is returned to the protocol */
      stakeHistoryItem.action = 'Revoked'
      stakeHistoryItem.user = vesting.user
    } else {
      stakeHistoryItem.action = 'WithdrawVested'
      stakeHistoryItem.user = receiver.toHexString()
    }
    stakeHistoryItem.timestamp = transaction.timestamp
    stakeHistoryItem.transaction = transaction.id
    stakeHistoryItem.save()

    vesting.currentBalance.minus(amount)
    vesting.save()
  }
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
