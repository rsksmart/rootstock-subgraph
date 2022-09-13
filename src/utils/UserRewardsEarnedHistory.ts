import { Address, BigDecimal } from '@graphprotocol/graph-ts'
import { LiquidityMiningAllocationPoint, Token, UserRewardsEarnedHistory } from '../../generated/schema'
import { BTCLoanToken } from '../contracts/contracts'
import { PoolTokenType } from './types'

function getUserRewardsEarnedHistory(user: Address): UserRewardsEarnedHistory {
  let userRewardsEarnedHistory = UserRewardsEarnedHistory.load(user.toHexString())
  if (userRewardsEarnedHistory == null) {
    userRewardsEarnedHistory = new UserRewardsEarnedHistory(user.toHexString())
    userRewardsEarnedHistory.user = user.toHexString()
    userRewardsEarnedHistory.totalLendingRewards = BigDecimal.zero()
    userRewardsEarnedHistory.totalLiquidityRewards = BigDecimal.zero()
    userRewardsEarnedHistory.totalStakingRewards = BigDecimal.zero()
    userRewardsEarnedHistory.totalFeeWithdrawn = BigDecimal.zero()
    userRewardsEarnedHistory.totalTradingRewards = BigDecimal.zero()
    userRewardsEarnedHistory.availableTradingRewards = BigDecimal.zero()
    userRewardsEarnedHistory.totalFeesAndRewardsEarned = BigDecimal.zero()
  }
  return userRewardsEarnedHistory
}

export function incrementTotalLendingRewards(user: Address, amount: BigDecimal): void {
  const userRewardsEarnedHistory = getUserRewardsEarnedHistory(user)
  userRewardsEarnedHistory.totalLendingRewards = userRewardsEarnedHistory.totalLendingRewards.plus(amount)
  userRewardsEarnedHistory.save()
}

export function incrementTotalLiquidityRewards(user: Address, amount: BigDecimal): void {
  const userRewardsEarnedHistory = getUserRewardsEarnedHistory(user)
  userRewardsEarnedHistory.totalLiquidityRewards = userRewardsEarnedHistory.totalLiquidityRewards.plus(amount)
  userRewardsEarnedHistory.save()
}

export function incrementTotalStakingRewards(user: Address, amount: BigDecimal): void {
  const userRewardsEarnedHistory = getUserRewardsEarnedHistory(user)
  userRewardsEarnedHistory.totalStakingRewards = userRewardsEarnedHistory.totalStakingRewards.plus(amount)
  userRewardsEarnedHistory.save()
}

export function incrementTotalFeeWithdrawn(user: Address, amount: BigDecimal, token: Address): void {
  const userRewardsEarnedHistory = getUserRewardsEarnedHistory(user)
  let rbtcAmount = BigDecimal.zero()
  if (token.toHexString() != BTCLoanToken) {
    const tokenEntity = Token.load(token.toHexString())
    if (tokenEntity != null) {
      rbtcAmount = amount.times(tokenEntity.lastPriceBtc)
    }
  } else {
    rbtcAmount = amount
  }
  userRewardsEarnedHistory.totalFeeWithdrawn = userRewardsEarnedHistory.totalFeeWithdrawn.plus(rbtcAmount)
  userRewardsEarnedHistory.save()
}

export function incrementTotalTradingRewards(user: Address, amount: BigDecimal): void {
  const userRewardsEarnedHistory = getUserRewardsEarnedHistory(user)
  userRewardsEarnedHistory.totalTradingRewards = userRewardsEarnedHistory.totalTradingRewards.plus(amount)
  userRewardsEarnedHistory.save()
}

export function incrementTotalFeesAndRewardsEarned(user: Address, amount: BigDecimal): void {
  const userRewardsEarnedHistory = getUserRewardsEarnedHistory(user)
  userRewardsEarnedHistory.totalFeesAndRewardsEarned = userRewardsEarnedHistory.totalFeesAndRewardsEarned.plus(amount)
  userRewardsEarnedHistory.save()
}

export function incrementAvailableTradingRewards(user: Address, amount: BigDecimal): void {
  const userRewardsEarnedHistory = getUserRewardsEarnedHistory(user)
  userRewardsEarnedHistory.availableTradingRewards = userRewardsEarnedHistory.availableTradingRewards.plus(amount)
  userRewardsEarnedHistory.save()
}

export function resetAvailableTradingRewards(user: Address): void {
  const userRewardsEarnedHistory = getUserRewardsEarnedHistory(user)
  userRewardsEarnedHistory.availableTradingRewards = BigDecimal.zero()
  userRewardsEarnedHistory.save()
}

export function getPoolTokenType(token: Address): string | null {
  const allocationPointToken = LiquidityMiningAllocationPoint.load(token.toHexString())
  let output: string | null = null
  if (allocationPointToken != null) {
    if (allocationPointToken.ammPoolToken != null) {
      output = PoolTokenType.Amm
    } else if (allocationPointToken.lendingPoolToken != null) {
      output = PoolTokenType.Lending
    }
  }
  return output
}
