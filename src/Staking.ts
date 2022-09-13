import {
  DelegateChanged as DelegateChangedEvent,
  ExtendedStakingDuration as ExtendedStakingDurationEvent,
  TokensStaked as TokensStakedEvent,
  TokensWithdrawn as TokensWithdrawnEvent,
  StakingWithdrawn as StakingWithdrawnEvent,
} from '../generated/Staking/Staking'
import { StakeHistoryItem, TokensStaked, VestingContract, User, Transaction, VestingHistoryItem, FeeSharingTokensTransferred } from '../generated/schema'
import { createAndReturnTransaction } from './utils/Transaction'
import { createAndReturnUser, createAndReturnUserStakeHistory } from './utils/User'
import { DEFAULT_DECIMALS, ZERO_ADDRESS, decimal } from '@protofire/subgraph-toolkit'
import { Address, BigDecimal } from '@graphprotocol/graph-ts'
import { genesisVestingStartBlock, genesisVestingEndBlock } from './blockNumbers/blockNumbers'
import { createAndReturnProtocolStats } from './utils/ProtocolStats'
import { adminContracts } from './contracts/contracts'
import { StakeHistoryAction, VestingHistoryActionItem, VestingContractType } from './utils/types'

export function handleDelegateChanged(event: DelegateChangedEvent): void {
  const user = User.load(event.params.delegator.toHexString())
  if (event.params.fromDelegate.toHexString() != ZERO_ADDRESS && user != null) {
    const transaction = createAndReturnTransaction(event)
    const stakeHistoryItem = new StakeHistoryItem(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
    stakeHistoryItem.user = event.params.delegator.toHexString()
    stakeHistoryItem.action = StakeHistoryAction.Delegate
    stakeHistoryItem.timestamp = event.block.timestamp.toI32()
    stakeHistoryItem.transaction = transaction.id
    stakeHistoryItem.lockedUntil = event.params.lockedUntil.toI32()
    stakeHistoryItem.save()
  }
}

export function handleExtendedStakingDuration(event: ExtendedStakingDurationEvent): void {
  const transaction = createAndReturnTransaction(event)
  const stakeHistoryItem = new StakeHistoryItem(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  stakeHistoryItem.user = event.params.staker.toHexString()
  stakeHistoryItem.action = StakeHistoryAction.ExtendStake
  stakeHistoryItem.timestamp = event.block.timestamp.toI32()
  stakeHistoryItem.transaction = transaction.id
  stakeHistoryItem.lockedUntil = event.params.newDate.toI32()
  stakeHistoryItem.save()
}

export function handleTokensStaked(event: TokensStakedEvent): void {
  const amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
  const totalStaked = decimal.fromBigInt(event.params.totalStaked, DEFAULT_DECIMALS)
  const entity = new TokensStaked(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  const transaction = createAndReturnTransaction(event)
  entity.staker = event.params.staker
  entity.amount = amount
  entity.lockedUntil = event.params.lockedUntil.toI32()
  entity.totalStaked = totalStaked
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address

  const vestingContract = VestingContract.load(event.params.staker.toHexString())
  entity.isUserStaked = false

  /** Gensis Vesting contracts did not emit a VestingCreated event. Therefore, they need to be created from here.
   * We will create a special case for if caller != staker between the genesis block range
   */

  if (
    vestingContract == null &&
    event.block.number <= genesisVestingEndBlock &&
    event.block.number >= genesisVestingStartBlock &&
    event.transaction.from.toHexString() != event.params.staker.toHexString()
  ) {
    const newVestingContract = new VestingContract(event.params.staker.toHexString())
    const user = createAndReturnUser(event.transaction.from, event.block.timestamp)
    newVestingContract.user = user.id
    newVestingContract.type = VestingContractType.Genesis
    newVestingContract.createdAtTimestamp = event.block.timestamp.toI32()
    newVestingContract.emittedBy = event.address
    newVestingContract.createdAtTransaction = transaction.id
    newVestingContract.startingBalance = amount
    newVestingContract.currentBalance = amount
    newVestingContract.save()

    createVestingTokensStaked(event)
  } else if (vestingContract == null) {
    /** Tokens were staked by user. We need to check that tokens staked were not from the FISH staking contract
     * We do not need to check for this on the vesting contracts, as these are already segmented by SOV/FISH
     */

    createAndReturnUser(event.params.staker, event.block.timestamp)

    const userStakeHistory = createAndReturnUserStakeHistory(event.params.staker)
    userStakeHistory.totalStaked = userStakeHistory.totalStaked.plus(amount)
    userStakeHistory.totalRemaining = userStakeHistory.totalRemaining.plus(amount)
    userStakeHistory.save()

    entity.isUserStaked = true
    entity.user = event.params.staker.toHexString()
    const stakeHistoryItem = new StakeHistoryItem(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
    stakeHistoryItem.user = event.params.staker.toHexString()
    stakeHistoryItem.action = event.params.amount < event.params.totalStaked ? StakeHistoryAction.IncreaseStake : StakeHistoryAction.Stake
    stakeHistoryItem.timestamp = event.block.timestamp.toI32()
    stakeHistoryItem.transaction = transaction.id
    stakeHistoryItem.amount = amount
    stakeHistoryItem.lockedUntil = event.params.lockedUntil.toI32()
    stakeHistoryItem.save()

    const protocolStatsEntity = createAndReturnProtocolStats()
    protocolStatsEntity.currentVoluntarilyStakedSov = protocolStatsEntity.currentVoluntarilyStakedSov.plus(
      decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS),
    )
    protocolStatsEntity.save()
  } else {
    vestingContract.currentBalance = vestingContract.currentBalance.plus(amount)
    vestingContract.save()

    const protocolStatsEntity = createAndReturnProtocolStats()
    protocolStatsEntity.currentStakedByVestingSov = protocolStatsEntity.currentStakedByVestingSov.plus(
      decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS),
    )
    protocolStatsEntity.save()

    createVestingTokensStaked(event)
  }

  entity.save()
}

/** When tokens are staked by a vesting contract, create a history item for that contract */
function createVestingTokensStaked(event: TokensStakedEvent): void {
  const amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
  const totalStaked = decimal.fromBigInt(event.params.totalStaked, DEFAULT_DECIMALS)

  const vestingTokensStakedEntity = new VestingHistoryItem(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  vestingTokensStakedEntity.staker = event.params.staker.toHexString()
  vestingTokensStakedEntity.action = VestingHistoryActionItem.TokensStaked
  vestingTokensStakedEntity.amount = amount
  vestingTokensStakedEntity.lockedUntil = event.params.lockedUntil.toI32()
  vestingTokensStakedEntity.totalStaked = totalStaked
  vestingTokensStakedEntity.timestamp = event.block.timestamp.toI32()
  vestingTokensStakedEntity.emittedBy = event.address
  vestingTokensStakedEntity.transaction = event.transaction.hash.toHex()
  vestingTokensStakedEntity.save()
}

export function handleTokensWithdrawn(event: TokensWithdrawnEvent): void {
  const transaction = createAndReturnTransaction(event)
  const amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
  const id = event.transaction.hash.toHex() + event.logIndex.toHex()
  handleStakingOrTokensWithdrawn({
    id: id,
    transaction: transaction,
    stakingContract: event.address,
    staker: event.params.staker,
    receiver: event.params.receiver,
    amount: amount,
  })
}

/** This is a copy of handleTokensWithdrawn. The event was renamed but params remained the same. */
export function handleStakingWithdrawn(event: StakingWithdrawnEvent): void {
  const transaction = createAndReturnTransaction(event)
  const amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
  const id = event.transaction.hash.toHex() + event.logIndex.toHex()
  handleStakingOrTokensWithdrawn({
    id: id,
    transaction: transaction,
    stakingContract: event.address,
    staker: event.params.staker,
    receiver: event.params.receiver,
    amount: amount,
  })
}

class TokensWithdrawnParams {
  id: string
  transaction: Transaction
  stakingContract: Address
  staker: Address
  receiver: Address
  amount: BigDecimal
}

function handleStakingOrTokensWithdrawn(params: TokensWithdrawnParams): void {
  const user = User.load(params.staker.toHexString().toLowerCase())
  const vesting = VestingContract.load(params.staker.toHexString().toLowerCase())
  if (user !== null) {
    const stakeHistoryItem = new StakeHistoryItem(params.id)
    /** Check if there was a fee sharing event in this transaction. If there was, this was early unstaking */
    const feeSharingTokensTransferredEvent = FeeSharingTokensTransferred.load(params.transaction.id)
    stakeHistoryItem.user = params.receiver.toHexString()
    stakeHistoryItem.action = feeSharingTokensTransferredEvent == null ? StakeHistoryAction.WithdrawStaked : StakeHistoryAction.Unstake
    stakeHistoryItem.amount = params.amount
    stakeHistoryItem.timestamp = params.transaction.timestamp
    stakeHistoryItem.transaction = params.transaction.id
    stakeHistoryItem.save()

    const userStakeHistory = createAndReturnUserStakeHistory(params.receiver)
    userStakeHistory.totalWithdrawn = userStakeHistory.totalWithdrawn.plus(params.amount)
    userStakeHistory.totalRemaining = userStakeHistory.totalRemaining.minus(params.amount)
    if (feeSharingTokensTransferredEvent != null) {
      userStakeHistory.totalRemaining = userStakeHistory.totalRemaining.minus(feeSharingTokensTransferredEvent.amount)
    }
    userStakeHistory.save()

    const protocolStatsEntity = createAndReturnProtocolStats()
    protocolStatsEntity.currentVoluntarilyStakedSov = protocolStatsEntity.currentVoluntarilyStakedSov.minus(params.amount)
    protocolStatsEntity.save()
  } else if (vesting != null) {
    const vestingHistoryItem = new VestingHistoryItem(params.id)
    if (adminContracts.includes(params.receiver.toHexString().toLowerCase()) && vesting.type == VestingContractType.Team) {
      /** This happens when a team member with vesting contract leaves the project and their remaining balance is returned to the protocol */
      vestingHistoryItem.action = VestingHistoryActionItem.TeamTokensRevoked
      vestingHistoryItem.staker = vesting.id
      vestingHistoryItem.amount = params.amount
    } else {
      vestingHistoryItem.action = VestingHistoryActionItem.TokensWithdrawn
      vestingHistoryItem.amount = params.amount
      vestingHistoryItem.staker = vesting.id
    }
    vestingHistoryItem.timestamp = params.transaction.timestamp
    vestingHistoryItem.transaction = params.transaction.id
    vestingHistoryItem.save()

    vesting.currentBalance = vesting.currentBalance.minus(params.amount)
    vesting.save()

    const protocolStatsEntity = createAndReturnProtocolStats()
    protocolStatsEntity.currentStakedByVestingSov = protocolStatsEntity.currentStakedByVestingSov.minus(params.amount)
    protocolStatsEntity.save()
  }
}
