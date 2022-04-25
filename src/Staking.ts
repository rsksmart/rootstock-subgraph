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
import { StakeHistoryItem, TokensStaked, VestingContract, User, Transaction, VestingHistoryItem, FeeSharingTokensTransferred } from '../generated/schema'
import { createAndReturnTransaction } from './utils/Transaction'
import { createAndReturnUser, createAndReturnUserStakeHistory } from './utils/User'
import { ZERO_ADDRESS } from '@protofire/subgraph-toolkit'
import { Address, BigInt } from '@graphprotocol/graph-ts'
import { genesisVestingStartBlock, genesisVestingEndBlock } from './blockNumbers/blockNumbers'
import { createAndReturnProtocolStats } from './utils/ProtocolStats'
import { adminContracts, stakingFish } from './contracts/contracts'
import { StakeHistoryAction, VestingHistoryActionItem, VestingContractType } from './utils/types'

export function handleDelegateChanged(event: DelegateChangedEvent): void {
  let user = User.load(event.params.delegator.toHexString())
  if (event.params.fromDelegate.toHexString() != ZERO_ADDRESS && user != null) {
    let transaction = createAndReturnTransaction(event)
    let stakeHistoryItem = new StakeHistoryItem(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
    stakeHistoryItem.user = event.params.delegator.toHexString()
    stakeHistoryItem.action = StakeHistoryAction.Delegate
    stakeHistoryItem.timestamp = event.block.timestamp
    stakeHistoryItem.transaction = transaction.id
    stakeHistoryItem.lockedUntil = event.params.lockedUntil
    stakeHistoryItem.save()
  }
}

export function handleDelegateStakeChanged(event: DelegateStakeChangedEvent): void {}

export function handleExtendedStakingDuration(event: ExtendedStakingDurationEvent): void {
  let transaction = createAndReturnTransaction(event)
  let stakeHistoryItem = new StakeHistoryItem(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  stakeHistoryItem.user = event.params.staker.toHexString()
  stakeHistoryItem.action = StakeHistoryAction.ExtendStake
  stakeHistoryItem.timestamp = event.block.timestamp
  stakeHistoryItem.transaction = transaction.id
  stakeHistoryItem.lockedUntil = event.params.newDate
  stakeHistoryItem.save()
}

export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {}

export function handleTokensStaked(event: TokensStakedEvent): void {
  let entity = new TokensStaked(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  let transaction = createAndReturnTransaction(event)
  entity.staker = event.params.staker
  entity.amount = event.params.amount
  entity.lockedUntil = event.params.lockedUntil
  entity.totalStaked = event.params.totalStaked
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address

  let vestingContract = VestingContract.load(event.params.staker.toHexString())
  entity.isUserStaked == false

  /** Gensis Vesting contracts did not emit a VestingCreated event. Therefore, they need to be created from here.
   * We will create a special case for if caller != staker between the genesis block range
   */

  if (
    vestingContract == null &&
    event.block.number <= genesisVestingEndBlock &&
    event.block.number >= genesisVestingStartBlock &&
    event.transaction.from.toHexString() != event.params.staker.toHexString()
  ) {
    let newVestingContract = new VestingContract(event.params.staker.toHexString())
    let user = createAndReturnUser(event.transaction.from, event.block.timestamp)
    newVestingContract.user = user.id
    newVestingContract.type = VestingContractType.Genesis
    newVestingContract.createdAtTimestamp = event.block.timestamp
    newVestingContract.emittedBy = event.address
    newVestingContract.createdAtTransaction = transaction.id
    newVestingContract.startingBalance = event.params.amount
    newVestingContract.currentBalance = event.params.amount
    newVestingContract.save()

    createVestingTokensStaked(event)
  } else if (vestingContract == null) {
    /** Tokens were staked by user. We need to check that tokens staked were not from the FISH staking contract
     * We do not need to check for this on the vesting contracts, as these are already segmented by SOV/FISH
     */
    if (event.address.toHexString() != stakingFish.toLowerCase()) {
      createAndReturnUser(event.params.staker, event.block.timestamp)

      let userStakeHistory = createAndReturnUserStakeHistory(event.params.staker)
      userStakeHistory.totalStaked = userStakeHistory.totalStaked.plus(event.params.amount)
      userStakeHistory.totalRemaining = userStakeHistory.totalRemaining.plus(event.params.amount)
      userStakeHistory.save()

      entity.isUserStaked = true
      entity.user = event.params.staker.toHexString()
      let stakeHistoryItem = new StakeHistoryItem(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
      stakeHistoryItem.user = event.params.staker.toHexString()
      stakeHistoryItem.action = event.params.amount < event.params.totalStaked ? StakeHistoryAction.IncreaseStake : StakeHistoryAction.Stake
      stakeHistoryItem.timestamp = event.block.timestamp
      stakeHistoryItem.transaction = transaction.id
      stakeHistoryItem.amount = event.params.amount
      stakeHistoryItem.lockedUntil = event.params.lockedUntil
      stakeHistoryItem.save()

      let protocolStatsEntity = createAndReturnProtocolStats()
      protocolStatsEntity.totalVoluntarilyStakedSov = protocolStatsEntity.totalVoluntarilyStakedSov.plus(event.params.amount)
      protocolStatsEntity.save()
    }
  } else {
    vestingContract.currentBalance = vestingContract.currentBalance.plus(event.params.amount)
    vestingContract.save()

    let protocolStatsEntity = createAndReturnProtocolStats()
    protocolStatsEntity.totalStakedByVestingSov = protocolStatsEntity.totalStakedByVestingSov.plus(event.params.amount)
    protocolStatsEntity.save()

    createVestingTokensStaked(event)
  }

  entity.save()
}

/** When tokens are staked by a vesting contract, create a history item for that contract */
function createVestingTokensStaked(event: TokensStakedEvent): void {
  let vestingTokensStakedEntity = new VestingHistoryItem(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  vestingTokensStakedEntity.staker = event.params.staker.toHexString()
  vestingTokensStakedEntity.action = VestingHistoryActionItem.TokensStaked
  vestingTokensStakedEntity.amount = event.params.amount
  vestingTokensStakedEntity.lockedUntil = event.params.lockedUntil
  vestingTokensStakedEntity.totalStaked = event.params.totalStaked
  vestingTokensStakedEntity.timestamp = event.block.timestamp
  vestingTokensStakedEntity.emittedBy = event.address
  vestingTokensStakedEntity.transaction = event.transaction.hash.toHex()
  vestingTokensStakedEntity.save()
}

export function handleTokensUnlocked(event: TokensUnlockedEvent): void {}

export function handleTokensWithdrawn(event: TokensWithdrawnEvent): void {
  let transaction = createAndReturnTransaction(event)
  handleStakingOrTokensWithdrawn(event.transaction.hash.toHex(), transaction, event.params.staker, event.params.receiver, event.params.amount)
}

/** This is a copy of handleTokensWithdrawn. The event was renamed but params remained the same. */
export function handleStakingWithdrawn(event: StakingWithdrawnEvent): void {
  let transaction = createAndReturnTransaction(event)
  handleStakingOrTokensWithdrawn(event.transaction.hash.toHex(), transaction, event.params.staker, event.params.receiver, event.params.amount)
}

function handleStakingOrTokensWithdrawn(id: string, transaction: Transaction, staker: Address, receiver: Address, amount: BigInt): void {
  let user = User.load(staker.toHexString().toLowerCase())
  let vesting = VestingContract.load(staker.toHexString().toLowerCase())
  if (user !== null) {
    let stakeHistoryItem = new StakeHistoryItem(id)
    /** Check if there was a fee sharing event in this transaction. If there was, this was early unstaking */
    let feeSharingTokensTransferredEvent = FeeSharingTokensTransferred.load(transaction.id)
    stakeHistoryItem.user = receiver.toHexString()
    stakeHistoryItem.action = feeSharingTokensTransferredEvent == null ? StakeHistoryAction.WithdrawStaked : StakeHistoryAction.Unstake
    stakeHistoryItem.amount = amount
    stakeHistoryItem.timestamp = transaction.timestamp
    stakeHistoryItem.transaction = transaction.id
    stakeHistoryItem.save()

    let userStakeHistory = createAndReturnUserStakeHistory(receiver)
    userStakeHistory.totalWithdrawn = userStakeHistory.totalWithdrawn.plus(amount)
    userStakeHistory.totalRemaining = userStakeHistory.totalRemaining.minus(amount)
    if (feeSharingTokensTransferredEvent != null) {
      userStakeHistory.totalRemaining = userStakeHistory.totalRemaining.minus(feeSharingTokensTransferredEvent.amount)
    }
    userStakeHistory.save()

    let protocolStatsEntity = createAndReturnProtocolStats()
    protocolStatsEntity.totalVoluntarilyStakedSov = protocolStatsEntity.totalVoluntarilyStakedSov.minus(amount)
    protocolStatsEntity.save()
  } else if (vesting != null) {
    let vestingHistoryItem = new VestingHistoryItem(id)
    if (adminContracts.includes(receiver.toHexString().toLowerCase()) && vesting.type == VestingContractType.Team) {
      /** This happens when a team member with vesting contract leaves the project and their remaining balance is returned to the protocol */
      vestingHistoryItem.action = VestingHistoryActionItem.TeamTokensRevoked
      vestingHistoryItem.staker = vesting.id
      vestingHistoryItem.amount = amount
    } else {
      vestingHistoryItem.action = VestingHistoryActionItem.TokensWithdrawn
      vestingHistoryItem.amount = amount
      vestingHistoryItem.staker = vesting.id
    }
    vestingHistoryItem.timestamp = transaction.timestamp
    vestingHistoryItem.transaction = transaction.id
    vestingHistoryItem.save()

    vesting.currentBalance = vesting.currentBalance.minus(amount)
    vesting.save()

    let protocolStatsEntity = createAndReturnProtocolStats()
    protocolStatsEntity.totalStakedByVestingSov = protocolStatsEntity.totalStakedByVestingSov.minus(amount)
    protocolStatsEntity.save()
  }
}

export function handleVestingTokensWithdrawn(event: VestingTokensWithdrawnEvent): void {}
