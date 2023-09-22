import { PoolTokenAdded, PoolTokenUpdated, RewardClaimed as RewardClaimedEvent } from '../generated/MiningProxy/MiningProxy'
import { LiquidityMiningGlobal, LiquidityMiningAllocationPoint, LendingPool, SmartToken } from '../generated/schema'
import { MiningProxy } from '../generated/MiningProxy/MiningProxy'
import { createAndReturnTransaction } from './utils/Transaction'
import { createAndReturnUser } from './utils/User'
import { BigDecimal, Address, BigInt } from '@graphprotocol/graph-ts'
import { PoolTokenType, RewardsEarnedAction } from './utils/types'
import { DEFAULT_DECIMALS, decimal } from '@protofire/subgraph-toolkit'
import { createOrIncrementRewardItem } from './utils/RewardsEarnedHistoryItem'
import {
  incrementTotalFeesAndRewardsEarned,
  incrementTotalLendingRewards,
  incrementTotalLiquidityRewards,
  getPoolTokenType,
} from './utils/UserRewardsEarnedHistory'
import { SOVAddress } from './contracts/contracts'

export function handleRewardClaimed(event: RewardClaimedEvent): void {
  const amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
  createAndReturnTransaction(event)
  createAndReturnUser(event.params.user, event.block.timestamp)
  incrementTotalFeesAndRewardsEarned(event.params.user, amount)
  const poolTokenType = getPoolTokenType(event.params.poolToken)
  if (poolTokenType == PoolTokenType.Lending) {
    incrementTotalLendingRewards(event.params.user, amount)
  } else if (poolTokenType == PoolTokenType.Amm) {
    incrementTotalLiquidityRewards(event.params.user, amount)
  }
  createOrIncrementRewardItem({
    action: RewardsEarnedAction.RewardClaimed,
    user: event.params.user,
    amount: amount,
    timestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
    token: SOVAddress,
    event,
  })
}

export function handlePoolTokenAdded(event: PoolTokenAdded): void {
  const global = createOrUpdateLiquidityMiningGlobal(event.address)
  createAndReturnLiquidityMiningAllocation(
    event.params.poolToken,
    event.params.allocationPoint,
    global,
    event.block.timestamp.toI32(),
    event.block.number.toI32(),
  )
}

export function handlePoolTokenUpdated(event: PoolTokenUpdated): void {
  const global = createOrUpdateLiquidityMiningGlobal(event.address)
  createAndReturnLiquidityMiningAllocation(
    event.params.poolToken,
    event.params.newAllocationPoint,
    global,
    event.block.timestamp.toI32(),
    event.block.number.toI32(),
  )
}

function createOrUpdateLiquidityMiningGlobal(proxyAddress: Address): LiquidityMiningGlobal {
  let globalEntity = LiquidityMiningGlobal.load('0')
  if (globalEntity == null) {
    globalEntity = new LiquidityMiningGlobal('0')
  }

  const liquidityMiningContract = MiningProxy.bind(proxyAddress)
  const totalAllocationPointResult = liquidityMiningContract.try_totalAllocationPoint()
  if (!totalAllocationPointResult.reverted) {
    globalEntity.totalAllocationPoint = totalAllocationPointResult.value
  }
  const rewardPerBlockResult = liquidityMiningContract.try_rewardTokensPerBlock()
  if (!rewardPerBlockResult.reverted) {
    globalEntity.totalRewardPerBlock = rewardPerBlockResult.value
  }
  globalEntity.save()

  return globalEntity
}

function createAndReturnLiquidityMiningAllocation(
  token: Address,
  allocationPoint: BigInt,
  global: LiquidityMiningGlobal,
  timestamp: i32,
  blockNumber: i32,
): LiquidityMiningAllocationPoint {
  let allocationEntity = LiquidityMiningAllocationPoint.load(token.toHexString())
  if (allocationEntity === null) {
    allocationEntity = new LiquidityMiningAllocationPoint(token.toHexString())
    allocationEntity.allocationPoint = allocationPoint
    allocationEntity.poolTokenAddedBlock = blockNumber
    allocationEntity.poolTokenAddedTimestamp = timestamp
    allocationEntity.poolTokenUpdatedBlock = blockNumber
    allocationEntity.poolTokenUpdatedTimestamp = timestamp
    allocationEntity.rewardPerBlock = calculateRewardPerBlock(global.totalRewardPerBlock, allocationPoint, global.totalAllocationPoint)
    /** Check if the pool token is for a lending or amm pool */
    const smartTokenEntity = SmartToken.load(token.toHexString())
    const lendingPoolEntity = LendingPool.load(token.toHexString())
    if (smartTokenEntity !== null) {
      allocationEntity.ammPoolToken = token.toHexString()
    }
    if (lendingPoolEntity !== null) {
      allocationEntity.lendingPoolToken = token.toHexString()
    }
    allocationEntity.save()
    return allocationEntity
  }

  if (allocationEntity.allocationPoint !== allocationPoint) {
    allocationEntity.allocationPoint = allocationPoint
    allocationEntity.poolTokenUpdatedBlock = blockNumber
    allocationEntity.poolTokenUpdatedTimestamp = timestamp
    allocationEntity.rewardPerBlock = calculateRewardPerBlock(global.totalRewardPerBlock, allocationPoint, global.totalAllocationPoint)
    allocationEntity.save()
    return allocationEntity
  }

  return allocationEntity
}

function calculateRewardPerBlock(totalRewardPerBlock: BigInt, allocationPoint: BigInt, totalAllocationPoint: BigInt): BigDecimal {
  const reward = decimal
    .fromBigInt(totalRewardPerBlock, DEFAULT_DECIMALS)
    .times(decimal.fromBigInt(allocationPoint, DEFAULT_DECIMALS))
    .div(decimal.fromBigInt(totalAllocationPoint, DEFAULT_DECIMALS))
  /** TODO: don't use default decimals. This will require underlying token to be added to contract */
  return reward.truncate(18)
}
