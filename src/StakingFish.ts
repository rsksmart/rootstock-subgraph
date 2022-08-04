import {
  TokensStaked as TokensStakedEvent,
  TokensWithdrawn as TokensWithdrawnEvent,
  StakingWithdrawn as StakingWithdrawnEvent,
} from '../generated/Staking/Staking'
import { VestingContract, Transaction, VestingHistoryItem } from '../generated/schema'
import { createAndReturnTransaction } from './utils/Transaction'
import { DEFAULT_DECIMALS, decimal } from '@protofire/subgraph-toolkit'
import { Address, BigDecimal } from '@graphprotocol/graph-ts'
import { VestingHistoryActionItem } from './utils/types'

export function handleTokensStaked(event: TokensStakedEvent): void {
  const vestingContract = VestingContract.load(event.params.staker.toHexString())
  if (vestingContract != null) {
    const amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
    vestingContract.currentBalance = vestingContract.currentBalance.plus(amount)
    vestingContract.save()
    createVestingTokensStaked(event)
  }
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
  const vesting = VestingContract.load(params.staker.toHexString().toLowerCase())
  if (vesting !== null) {
    const vestingHistoryItem = new VestingHistoryItem(params.id)
    vestingHistoryItem.action = VestingHistoryActionItem.TokensWithdrawn
    vestingHistoryItem.amount = params.amount
    vestingHistoryItem.staker = vesting.id
    vestingHistoryItem.timestamp = params.transaction.timestamp
    vestingHistoryItem.transaction = params.transaction.id
    vestingHistoryItem.save()
    vesting.currentBalance = vesting.currentBalance.minus(params.amount)
    vesting.save()
  }
}
