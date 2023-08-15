import {
  DelegateChanged as DelegateChangedEvent,
  ExtendedStakingDuration as ExtendedStakingDurationEvent,
  TokensStaked as TokensStakedEvent,
  TokensWithdrawn as TokensWithdrawnEvent,
  StakingWithdrawn as StakingWithdrawnEvent,
  DelegateStakeChanged as DelegateStakeChangedEvent,
} from '../generated/Staking/Staking'
import { VestingContract, User, Transaction, FeeSharingTokensTransferred } from '../generated/schema'
import { createAndReturnTransaction } from './utils/Transaction'
import { createAndReturnUser } from './utils/User'
import { DEFAULT_DECIMALS, ZERO_ADDRESS, decimal } from '@protofire/subgraph-toolkit'
import { Address, BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { genesisVestingStartBlock, genesisVestingEndBlock } from './blockNumbers/blockNumbers'
import {
  decrementCurrentStakedByVestingSov,
  decrementCurrentVoluntarilyStakedSov,
  incrementCurrentStakedByVestingSov,
  incrementCurrentVoluntarilyStakedSov,
} from './utils/ProtocolStats'
import { adminContracts } from './contracts/contracts'
import { StakeHistoryAction, VestingHistoryActionItem, VestingContractType } from './utils/types'
import { createOrUpdateStake, incrementDelegatedAmount, incrementVestingStakedAmount, removeStakeIfEmpty } from './utils/Stake'
import { createAndReturnVestingContract, decrementVestingContractBalance, incrementVestingContractBalance } from './utils/VestingContract'
import { decrementUserStakeHistory, incrementUserStakeHistory } from './utils/UserStakeHistory'
import { createAndReturnStakeHistoryItem } from './utils/StakeHistoryItem'
import { createAndReturnVestingHistoryItem } from './utils/VestingHistoryItem'
import {
  createAndReturnV2DelegateChanged,
  createAndReturnV2ExtendedStakingDuration,
  createAndReturnV2StakingWithdrawn,
  createAndReturnV2TokensStaked,
} from './utils/V2Stake'

export function handleDelegateChanged(event: DelegateChangedEvent): void {
  createAndReturnTransaction(event)
  createAndReturnV2DelegateChanged(event)
  const delegator = event.params.delegator.toHexString()
  const fromDelegate = event.params.fromDelegate.toHexString()
  const toDelegate = event.params.toDelegate.toHexString()
  const isUserDelegated =
    fromDelegate != ZERO_ADDRESS && toDelegate != ZERO_ADDRESS && fromDelegate != toDelegate && delegator == event.transaction.from.toHexString()
  if (isUserDelegated) {
    createAndReturnUser(event.params.toDelegate, event.block.timestamp)
    incrementDelegatedAmount(fromDelegate, toDelegate, event.params.lockedUntil)
  }

  createAndReturnStakeHistoryItem({
    event,
    user: delegator,
    action: StakeHistoryAction.Delegate,
    amount: BigDecimal.zero(),
    token: ZERO_ADDRESS,
    // on testnet, one of the lockedUntil values is 1614429908000, which is too big for i32
    lockedUntil: event.params.lockedUntil.toString() == '1614429908000' ? BigInt.fromString('1614429908') : event.params.lockedUntil,
    delegatee: toDelegate,
  })
}

export function handleDelegateStakeChanged(event: DelegateStakeChangedEvent): void {
  createAndReturnUser(event.params.delegate, event.block.timestamp)
  const stake = createOrUpdateStake(event)
  removeStakeIfEmpty(stake)
}

export function handleExtendedStakingDuration(event: ExtendedStakingDurationEvent): void {
  createAndReturnV2ExtendedStakingDuration(event)
  const staker = event.params.staker.toHexString()
  createAndReturnTransaction(event)
  createAndReturnStakeHistoryItem({
    event,
    user: staker,
    action: StakeHistoryAction.ExtendStake,
    amount: BigDecimal.zero(),
    token: ZERO_ADDRESS,
    lockedUntil: event.params.newDate,
    delegatee: ZERO_ADDRESS,
  })
}

export function handleTokensStaked(event: TokensStakedEvent): void {
  createAndReturnV2TokensStaked(event)
  createAndReturnTransaction(event)
  const amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
  const totalStaked = decimal.fromBigInt(event.params.totalStaked, DEFAULT_DECIMALS)
  let vestingContract = VestingContract.load(event.params.staker.toHexString())
  /** Gensis Vesting contracts did not emit a VestingCreated event. Therefore, they need to be created from here. **/
  const isGenesisContract =
    vestingContract == null &&
    event.block.number <= genesisVestingEndBlock &&
    event.block.number >= genesisVestingStartBlock &&
    event.transaction.from.toHexString() != event.params.staker.toHexString()

  if (isGenesisContract) {
    vestingContract = createAndReturnVestingContract({
      vestingAddress: event.params.staker.toHexString(),
      user: event.transaction.from.toHexString(),
      cliff: BigInt.zero(),
      duration: BigInt.zero(),
      balance: amount,
      type: VestingContractType.Genesis,
      event: event,
    })
  }

  if (vestingContract != null) {
    createAndReturnVestingHistoryItem({
      staker: event.params.staker.toHexString(),
      action: VestingHistoryActionItem.TokensStaked,
      amount: amount,
      lockedUntil: event.params.lockedUntil,
      totalStaked: totalStaked,
      delegatee: null,
      event,
    })
    incrementCurrentStakedByVestingSov(amount)
    if (!isGenesisContract) {
      incrementVestingContractBalance(vestingContract, amount)
    }
    incrementVestingStakedAmount(vestingContract.user, event.params.lockedUntil, amount)
  } else {
    const staker = event.params.staker.toHexString()
    createAndReturnUser(event.params.staker, event.block.timestamp)
    createAndReturnStakeHistoryItem({
      event,
      user: staker,
      action: event.params.amount < event.params.totalStaked ? StakeHistoryAction.IncreaseStake : StakeHistoryAction.Stake,
      amount: amount,
      token: ZERO_ADDRESS,
      lockedUntil: event.params.lockedUntil,
      delegatee: ZERO_ADDRESS,
    })
    incrementUserStakeHistory(event.params.staker, amount)
    incrementCurrentVoluntarilyStakedSov(amount)
  }
}

export function handleTokensWithdrawn(event: TokensWithdrawnEvent): void {
  const transaction = createAndReturnTransaction(event)
  const amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
  const id = event.transaction.hash.toHex() + event.logIndex.toHex()
  handleStakingOrTokensWithdrawn({
    id,
    transaction: transaction,
    stakingContract: event.address,
    staker: event.params.staker,
    receiver: event.params.receiver,
    lockedUntil: BigInt.zero(),
    totalStaked: BigDecimal.zero(),
    amount: amount,
    event: event,
  })
}

/** This is a copy of handleTokensWithdrawn. The event was renamed but params remained the same. */
export function handleStakingWithdrawn(event: StakingWithdrawnEvent): void {
  createAndReturnV2StakingWithdrawn(event)
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
    lockedUntil: event.params.until,
    totalStaked: BigDecimal.zero(),
    event: event,
  })
}

class TokensWithdrawnParams {
  id: string
  transaction: Transaction
  stakingContract: Address
  staker: Address
  receiver: Address
  amount: BigDecimal
  lockedUntil: BigInt
  totalStaked: BigDecimal
  event: ethereum.Event
}

function handleStakingOrTokensWithdrawn(params: TokensWithdrawnParams): void {
  const user = User.load(params.staker.toHexString().toLowerCase())
  const vesting = VestingContract.load(params.staker.toHexString())
  if (user != null) {
    const slashingEvent = FeeSharingTokensTransferred.load(params.transaction.id)
    const slashedAmount = slashingEvent == null ? BigDecimal.zero() : slashingEvent.amount
    createAndReturnStakeHistoryItem({
      event: params.event,
      user: params.receiver.toHexString(),
      action: slashingEvent == null ? StakeHistoryAction.WithdrawStaked : StakeHistoryAction.Unstake,
      amount: params.amount,
      token: ZERO_ADDRESS,
      lockedUntil: BigInt.zero(),
      delegatee: ZERO_ADDRESS,
    })
    decrementUserStakeHistory(params.receiver, params.amount, slashedAmount)
    decrementCurrentVoluntarilyStakedSov(params.amount.plus(slashedAmount))
  }
  if (vesting != null) {
    const isRevoked = adminContracts.includes(params.receiver.toHexString().toLowerCase()) && vesting.type == VestingContractType.Team
    createAndReturnVestingHistoryItem({
      staker: params.staker.toHexString(),
      action: isRevoked ? VestingHistoryActionItem.TeamTokensRevoked : VestingHistoryActionItem.TokensWithdrawn,
      amount: params.amount,
      lockedUntil: BigInt.zero(),
      totalStaked: BigDecimal.zero(),
      delegatee: null,
      event: params.event,
    })
    decrementVestingContractBalance(params.staker.toHexString(), params.amount)
    decrementCurrentStakedByVestingSov(params.amount)
  }
}
