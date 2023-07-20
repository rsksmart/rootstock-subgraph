import { V2Stake, V2TokensStaked, V2ExtendedStakingDuration, V2StakingWithdrawn, V2DelegateChanged } from '../../generated/schema'
import { DelegateChanged, ExtendedStakingDuration, StakingWithdrawn, TokensStaked } from '../../generated/Staking/Staking'
import { decimal, DEFAULT_DECIMALS, ZERO_ADDRESS } from '@protofire/subgraph-toolkit'
import { BigDecimal, log } from '@graphprotocol/graph-ts'
import { createAndReturnUser } from './User'
import { getStakeId } from './Stake'

function createAndReturnV2Stake(event: TokensStaked): V2Stake {
  const id = event.params.staker.toHexString() + '-' + event.params.lockedUntil.toI32().toString()

  let stake = V2Stake.load(id)
  if (stake == null) {
    stake = new V2Stake(id)
    stake.user = createAndReturnUser(event.params.staker, event.block.timestamp).id
    stake.lockedUntil = event.params.lockedUntil.toI32()
    stake.timestamp = event.block.timestamp.toI32()
  }
  stake.amount = decimal.fromBigInt(event.params.totalStaked, DEFAULT_DECIMALS)
  stake.save()
  return stake
}

export function createAndReturnV2TokensStaked(event: TokensStaked): V2TokensStaked {
  const id = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()

  let staked = V2TokensStaked.load(id)
  if (staked == null) {
    staked = new V2TokensStaked(id)
    staked.user = createAndReturnUser(event.params.staker, event.block.timestamp).id
    staked.amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
    staked.totalStaked = decimal.fromBigInt(event.params.totalStaked, DEFAULT_DECIMALS)
    staked.lockedUntil = event.params.lockedUntil.toI32()
    staked.timestamp = event.block.timestamp.toI32()
  }
  staked.save()

  createAndReturnV2Stake(event)
  return staked
}

export function createAndReturnV2ExtendedStakingDuration(event: ExtendedStakingDuration): V2ExtendedStakingDuration {
  const previousId = event.params.staker.toHexString() + '-' + event.params.previousDate.toI32().toString()
  const newId = event.params.staker.toHexString() + '-' + event.params.newDate.toI32().toString()

  const previousStake = V2Stake.load(previousId)
  if (previousStake != null) {
    previousStake.amount = BigDecimal.zero()
    previousStake.save()
  }

  let newStake = V2Stake.load(newId)
  if (newStake == null) {
    newStake = new V2Stake(newId)
    newStake.user = createAndReturnUser(event.params.staker, event.block.timestamp).id
    newStake.lockedUntil = event.params.newDate.toI32()
    newStake.timestamp = event.block.timestamp.toI32()
    newStake.amount = BigDecimal.zero()
  }
  newStake.amount = newStake.amount.plus(decimal.fromBigInt(event.params.amountStaked, DEFAULT_DECIMALS))
  newStake.save()

  const id = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()

  let extended = V2ExtendedStakingDuration.load(id)
  if (extended == null) {
    extended = new V2ExtendedStakingDuration(id)
    extended.user = createAndReturnUser(event.params.staker, event.block.timestamp).id
    extended.previousDate = event.params.previousDate.toI32()
    extended.newDate = event.params.newDate.toI32()
    extended.timestamp = event.block.timestamp.toI32()
    extended.amountStaked = decimal.fromBigInt(event.params.amountStaked, DEFAULT_DECIMALS)
    extended.save()
  }
  return extended
}

export function createAndReturnV2StakingWithdrawn(event: StakingWithdrawn): V2StakingWithdrawn {
  const id = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()

  let withdrawn = V2StakingWithdrawn.load(id)
  if (withdrawn == null) {
    withdrawn = new V2StakingWithdrawn(id)
    withdrawn.user = createAndReturnUser(event.params.staker, event.block.timestamp).id
    withdrawn.receiver = createAndReturnUser(event.params.receiver, event.block.timestamp).id
    withdrawn.amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
    withdrawn.until = event.params.until.toI32()
    withdrawn.timestamp = event.block.timestamp.toI32()
    withdrawn.isGovernance = event.params.isGovernance
    withdrawn.save()
  }

  if (!withdrawn.isGovernance) {
    const stakeId = event.params.staker.toHexString() + '-' + event.params.until.toI32().toString()
    const stake = V2Stake.load(stakeId)
    if (stake != null) {
      stake.amount = stake.amount.minus(decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS))
      stake.save()
    }
  }

  return withdrawn
}

export function createAndReturnV2DelegateChanged(event: DelegateChanged): void {
  log.info('createAndReturnV2DelegateChanged {}', [event.params.lockedUntil.toString()])

  const id = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()

  let delegate = V2DelegateChanged.load(id)
  if (delegate == null) {
    delegate = new V2DelegateChanged(id)
    delegate.user = createAndReturnUser(event.params.delegator, event.block.timestamp).id

    if (event.params.toDelegate.toHexString() != ZERO_ADDRESS) {
      delegate.delegate = createAndReturnUser(event.params.toDelegate, event.block.timestamp).id
    } else {
      delegate.delegate = null
    }

    if (event.params.fromDelegate.toHexString() != ZERO_ADDRESS) {
      delegate.previousDelegate = createAndReturnUser(event.params.fromDelegate, event.block.timestamp).id
    } else {
      delegate.previousDelegate = null
    }

    // on testnet, one of the lockedUntil values is 1614429908000, which is too big for i32
    delegate.lockedUntil = event.params.lockedUntil.toString() == '1614429908000' ? 1614429908 : event.params.lockedUntil.toI32()
    delegate.timestamp = event.block.timestamp.toI32()

    delegate.save()
  }

  const stake = V2Stake.load(getStakeId(event.params.delegator.toHexString(), event.params.lockedUntil))
  if (stake != null) {
    stake.delegate = event.params.toDelegate.toHexString() === ZERO_ADDRESS ? null : createAndReturnUser(event.params.toDelegate, event.block.timestamp).id
    stake.save()
  }
}
