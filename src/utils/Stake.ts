import { Stake } from '../../generated/schema'
import { DelegateStakeChanged } from '../../generated/Staking/Staking'
import { decimal, DEFAULT_DECIMALS } from '@protofire/subgraph-toolkit'
import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { store } from '@graphprotocol/graph-ts'

export function createOrUpdateStake(event: DelegateStakeChanged): Stake {
  const stakeId = getStakeId(event.params.delegate.toHexString(), event.params.lockedUntil)
  let stake = Stake.load(stakeId)
  if (stake == null) {
    stake = new Stake(stakeId)
    stake.vestingAmount = BigDecimal.zero()
    stake.delegatedAmount = BigDecimal.zero()
  }
  stake.user = event.params.delegate.toHexString()
  stake.amount = decimal.fromBigInt(event.params.newBalance, DEFAULT_DECIMALS)
  stake.lockedUntil = event.params.lockedUntil.toI32()
  stake.save()
  return stake
}

export function removeStakeIfEmpty(stake: Stake): void {
  if (!stake.amount || (stake.amount as BigDecimal).le(BigDecimal.zero())) {
    store.remove('Stake', stake.id)
  }
}

function createPartialStake(delegate: string, lockedUntil: BigInt): Stake {
  const id = getStakeId(delegate, lockedUntil)
  const stake = new Stake(id)
  stake.vestingAmount = BigDecimal.zero()
  stake.delegatedAmount = BigDecimal.zero()
  stake.user = delegate
  return stake
}

export function incrementVestingStakedAmount(user: string, lockedUntil: BigInt, amount: BigDecimal): void {
  let stake = Stake.load(getStakeId(user, lockedUntil))
  if (stake == null) {
    stake = createPartialStake(user, lockedUntil)
  }
  stake.vestingAmount = stake.vestingAmount.plus(amount)
  stake.save()
}

export function incrementDelegatedAmount(fromDelegate: string, toDelegate: string, lockedUntil: BigInt): void {
  const oldStake = Stake.load(getStakeId(fromDelegate, lockedUntil))
  if (oldStake != null) {
    let newStake = Stake.load(getStakeId(toDelegate, lockedUntil))
    if (newStake == null) {
      newStake = createPartialStake(toDelegate, lockedUntil)
    }
    newStake.delegatedAmount = newStake.delegatedAmount.plus(oldStake.delegatedAmount)
    oldStake.delegatedAmount = BigDecimal.zero()
    newStake.save()
    oldStake.save()
  }
}

export function getStakeId(delegate: string, lockedUntil: BigInt): string {
  return delegate + '-' + lockedUntil.toString()
}
