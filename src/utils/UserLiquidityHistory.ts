import { BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts'
import { UserLiquidityHistory, LiquidityHistoryItem, LiquidityPool, LiquidityPoolToken } from '../../generated/schema'
import { decrementPoolBalance, incrementPoolBalance } from './LiquidityPool'
import { LiquidityHistoryType } from './types'

class IUserLiquidityHistory {
  liquidityPool: LiquidityPool
  token: Address
  liquidityPoolToken: LiquidityPoolToken
  id: string
  user: string
  provider: string
  reserveToken: string
  amount: BigDecimal
  newBalance: BigDecimal
  newSupply: BigDecimal
  transaction: string
  timestamp: BigInt
  emittedBy: string
  type: string
}

export function updateLiquidityHistory(params: IUserLiquidityHistory): void {
  const userLiquidityHistoryId = params.user + params.liquidityPoolToken.poolToken
  let userLiquidityHistory = UserLiquidityHistory.load(userLiquidityHistoryId)
  if (userLiquidityHistory == null) {
    userLiquidityHistory = new UserLiquidityHistory(userLiquidityHistoryId)
    userLiquidityHistory.user = params.user
    userLiquidityHistory.poolToken = params.liquidityPoolToken.poolToken
    userLiquidityHistory.totalAsset0LiquidityAdded = BigDecimal.zero()
    userLiquidityHistory.totalAsset0LiquidityRemoved = BigDecimal.zero()
    userLiquidityHistory.totalAsset1LiquidityAdded = BigDecimal.zero()
    userLiquidityHistory.totalAsset1LiquidityRemoved = BigDecimal.zero()
  }

  const amountAdded = params.type == LiquidityHistoryType.Added ? params.amount : BigDecimal.zero()
  const amountRemoved = params.type == LiquidityHistoryType.Removed ? params.amount : BigDecimal.zero()
  updateUserLiquidityHistory(params.liquidityPool, userLiquidityHistory, params.token.toHexString(), amountAdded, amountRemoved)
  createLiquidityHistoryItem(params, userLiquidityHistoryId)
  if (params.type == LiquidityHistoryType.Added) {
    incrementPoolBalance(params.liquidityPool, params.token, params.amount)
  } else if (params.type == LiquidityHistoryType.Removed) {
    decrementPoolBalance(params.liquidityPool, params.token, params.amount)
  }
}

function createLiquidityHistoryItem(params: IUserLiquidityHistory, userLiquidityHistoryId: string): void {
  const liquidityHistoryItem = new LiquidityHistoryItem(params.id)
  liquidityHistoryItem.user = params.user
  liquidityHistoryItem.userLiquidityHistory = userLiquidityHistoryId
  liquidityHistoryItem.type = params.type
  liquidityHistoryItem.provider = params.provider
  liquidityHistoryItem.reserveToken = params.reserveToken
  liquidityHistoryItem.amount = params.amount
  liquidityHistoryItem.newBalance = params.newBalance
  liquidityHistoryItem.newSupply = params.newSupply
  liquidityHistoryItem.transaction = params.transaction
  liquidityHistoryItem.timestamp = params.timestamp.toI32()
  liquidityHistoryItem.emittedBy = params.emittedBy
  liquidityHistoryItem.liquidityPool = params.liquidityPool.id
  liquidityHistoryItem.save()
}

function updateUserLiquidityHistory(
  liquidityPool: LiquidityPool,
  userLiquidityHistory: UserLiquidityHistory,
  token: string,
  amountAdded: BigDecimal,
  amountRemoved: BigDecimal,
): void {
  /** This would be more efficient with another if/else statement for type, but less readable? */
  if (liquidityPool.token0 == token) {
    userLiquidityHistory.totalAsset0LiquidityAdded = userLiquidityHistory.totalAsset0LiquidityAdded.plus(amountAdded)
    userLiquidityHistory.totalAsset0LiquidityRemoved = userLiquidityHistory.totalAsset0LiquidityRemoved.plus(amountRemoved)
  } else if (liquidityPool.token1 == token) {
    userLiquidityHistory.totalAsset1LiquidityAdded = userLiquidityHistory.totalAsset1LiquidityAdded.plus(amountAdded)
    userLiquidityHistory.totalAsset1LiquidityRemoved = userLiquidityHistory.totalAsset1LiquidityRemoved.plus(amountRemoved)
  }
  userLiquidityHistory.save()
}
