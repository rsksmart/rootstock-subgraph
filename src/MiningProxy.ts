import { PoolTokenAdded, PoolTokenUpdated, RewardClaimed as RewardClaimedEvent } from '../generated/MiningProxy/MiningProxy'
import {
  UserRewardsEarnedHistory,
  RewardsEarnedHistoryItem,
  LiquidityMiningGlobal,
  LiquidityMiningAllocationPoint,
  LendingPool,
  SmartToken,
} from '../generated/schema'
import { MiningProxy } from '../generated/MiningProxy/MiningProxy'
import { createAndReturnTransaction } from './utils/Transaction'
import { createAndReturnUser } from './utils/User'
import { BigDecimal, Address, BigInt } from '@graphprotocol/graph-ts'
import { RewardsEarnedAction } from './utils/types'
import { DEFAULT_DECIMALS, decimal } from '@protofire/subgraph-toolkit'

export function handleRewardClaimed(event: RewardClaimedEvent): void {
  createAndReturnTransaction(event)
  createAndReturnUser(event.params.user, event.block.timestamp)

  const amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)

  let userRewardsEarnedHistory = UserRewardsEarnedHistory.load(event.params.user.toHexString())
  if (userRewardsEarnedHistory != null) {
    userRewardsEarnedHistory.totalFeesAndRewardsEarned = userRewardsEarnedHistory.totalFeesAndRewardsEarned.plus(amount)
    userRewardsEarnedHistory.save()
  } else {
    userRewardsEarnedHistory = new UserRewardsEarnedHistory(event.params.user.toHexString())
    userRewardsEarnedHistory.totalTradingRewards = BigDecimal.zero()
    userRewardsEarnedHistory.availableTradingRewards = BigDecimal.zero()
    userRewardsEarnedHistory.totalFeesAndRewardsEarned = userRewardsEarnedHistory.totalFeesAndRewardsEarned.plus(amount)
    userRewardsEarnedHistory.user = event.params.user.toHexString()
    userRewardsEarnedHistory.save()
  }

  let rewardsEarnedHistoryItem = new RewardsEarnedHistoryItem(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  rewardsEarnedHistoryItem.action = RewardsEarnedAction.RewardClaimed
  rewardsEarnedHistoryItem.user = event.params.user.toHexString()
  rewardsEarnedHistoryItem.amount = amount
  rewardsEarnedHistoryItem.timestamp = event.block.timestamp.toI32()
  rewardsEarnedHistoryItem.transaction = event.transaction.hash.toHexString()
  rewardsEarnedHistoryItem.save()
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

  let liquidityMiningContract = MiningProxy.bind(proxyAddress)
  let totalAllocationPointResult = liquidityMiningContract.try_totalAllocationPoint()
  if (!totalAllocationPointResult.reverted) {
    globalEntity.totalAllocationPoint = totalAllocationPointResult.value
  }
  let rewardPerBlockResult = liquidityMiningContract.try_rewardTokensPerBlock()
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
    allocationEntity.poolTokenAddedTimestamp = timestamp
    allocationEntity.rewardPerBlock = calculateRewardPerBlock(global.totalRewardPerBlock, allocationPoint, global.totalAllocationPoint)
    /** Check if the pool token is for a lending or amm pool */
    let smartTokenEntity = SmartToken.load(token.toHexString())
    let lendingPoolEntity = LendingPool.load(token.toHexString())
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
    allocationEntity.poolTokenAddedTimestamp = timestamp
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
