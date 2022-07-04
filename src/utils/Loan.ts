/**
 * This file is a work in progress - the goal is to have all PnL calculations and ot
 */

import { BigDecimal, BigInt, Bytes } from '@graphprotocol/graph-ts'
import { Loan } from '../../generated/schema'
import { decimal } from '@protofire/subgraph-toolkit'
import { LoanType } from './types'
export class LoanStartState {
  loanId: Bytes
  user: Bytes
  type: string
  startTimestamp: BigInt
  endTimestamp: BigInt
  loanToken: Bytes
  collateralToken: Bytes
  /** For Borrow, this is newPrincipal. For Trade this is borrowedAmount */
  borrowedAmount: BigDecimal
  /** For Borrow, this is newCollateral. For Trade, this is positionSize */
  positionSize: BigDecimal
  startRate: BigDecimal
}
export class ChangeLoanState {
  loanId: string
  positionSizeChange: BigDecimal
  borrowedAmountChange: BigDecimal
  isOpen: boolean
  type: LoanActionType // Buy or Sell
  rate: BigDecimal
  timestamp: BigInt
}

export enum LoanActionType {
  LIQUIDATE,
  CLOSE_WITH_SWAP,
  CLOSE_WITH_DEPOSIT,
  DEPOSIT_COLLATERAL,
  DEPOSIT_COLLATERAL_LEGACY,
  ROLLOVER,
}

export function createAndReturnLoan(startParams: LoanStartState): Loan {
  let loanEntity = Loan.load(startParams.loanId.toHexString())
  if (loanEntity === null) {
    loanEntity = new Loan(startParams.loanId.toHexString())
    loanEntity.type = startParams.type
    loanEntity.isOpen = true
    loanEntity.startTimestamp = startParams.startTimestamp.toI32()
    loanEntity.nextRollover = startParams.endTimestamp.toI32()
    loanEntity.user = startParams.user.toHexString()
    loanEntity.collateralToken = startParams.collateralToken.toHexString()
    loanEntity.loanToken = startParams.loanToken.toHexString()
    loanEntity.borrowedAmount = startParams.borrowedAmount
    loanEntity.startBorrowedAmount = startParams.borrowedAmount
    loanEntity.maxBorrowedAmount = startParams.borrowedAmount
    loanEntity.positionSize = startParams.positionSize
    loanEntity.startPositionSize = startParams.positionSize
    loanEntity.maximumPositionSize = startParams.positionSize
    loanEntity.totalBought = startParams.positionSize
    loanEntity.totalSold = BigDecimal.zero()
    loanEntity.averageBuyPrice = startParams.startRate
    loanEntity.averageSellPrice = BigDecimal.zero()
    loanEntity.realizedPnL = BigDecimal.zero()
    loanEntity.realizedPnLPercent = BigDecimal.zero()
    loanEntity.save()
  }
  return loanEntity
}

export function updateLoanReturnPnL(params: ChangeLoanState): BigDecimal {
  let loanEntity = Loan.load(params.loanId)
  let eventPnL = BigDecimal.zero()
  const buyActions: LoanActionType[] = []
  const sellActions: LoanActionType[] = [LoanActionType.CLOSE_WITH_DEPOSIT, LoanActionType.CLOSE_WITH_SWAP, LoanActionType.LIQUIDATE]
  const neutralActions: LoanActionType[] = [LoanActionType.DEPOSIT_COLLATERAL_LEGACY, LoanActionType.DEPOSIT_COLLATERAL, LoanActionType.ROLLOVER]
  if (loanEntity !== null) {
    loanEntity.positionSize = loanEntity.positionSize.plus(params.positionSizeChange)
    loanEntity.borrowedAmount = loanEntity.borrowedAmount.plus(params.borrowedAmountChange)
    loanEntity.isOpen = loanEntity.positionSize.gt(BigDecimal.zero())
    if (!loanEntity.isOpen) {
      loanEntity.endTimestamp = params.timestamp.toI32()
    }

    if (loanEntity.positionSize.gt(loanEntity.maximumPositionSize)) {
      loanEntity.maximumPositionSize = loanEntity.positionSize
    }
    if (loanEntity.borrowedAmount.gt(loanEntity.maxBorrowedAmount)) {
      loanEntity.maxBorrowedAmount = loanEntity.borrowedAmount
    }

    if (buyActions.includes(params.type)) {
      let oldWeightedPrice = loanEntity.totalBought.times(loanEntity.averageBuyPrice)
      let newWeightedPrice = params.positionSizeChange.times(params.rate)
      const newTotalBought = loanEntity.totalBought.plus(params.positionSizeChange)
      loanEntity.totalBought = newTotalBought
      if (newWeightedPrice.gt(decimal.ZERO) && newTotalBought.gt(decimal.ZERO)) {
        loanEntity.averageBuyPrice = oldWeightedPrice.plus(newWeightedPrice).div(newTotalBought)
      }
    } else if (sellActions.includes(params.type)) {
      const amountSold = BigDecimal.zero().minus(params.positionSizeChange)
      const priceSoldAt = getSellPrice(params.type, loanEntity.type, params.rate)
      const differenceFromBuyPrice = loanEntity.averageBuyPrice.minus(priceSoldAt)
      let oldWeightedPrice = loanEntity.totalSold.times(loanEntity.averageSellPrice) // If first time, this is 0
      let newWeightedPrice = amountSold.times(priceSoldAt)
      const newTotalSold = loanEntity.totalSold.plus(amountSold)
      loanEntity.totalSold = newTotalSold
      const totalWeightedPrice = oldWeightedPrice.plus(newWeightedPrice)
      if (totalWeightedPrice.gt(decimal.ZERO) && newTotalSold.gt(decimal.ZERO)) {
        loanEntity.averageSellPrice = totalWeightedPrice.div(newTotalSold)
      }

      if (differenceFromBuyPrice != decimal.ZERO && amountSold != decimal.ZERO && loanEntity.averageSellPrice != decimal.ZERO) {
        const newPnL = amountSold.div(loanEntity.averageSellPrice.div(differenceFromBuyPrice))

        eventPnL = newPnL
        loanEntity.realizedPnL = loanEntity.realizedPnL.plus(newPnL).truncate(18)
        loanEntity.realizedPnLPercent = loanEntity.realizedPnL.times(decimal.fromNumber(100)).div(loanEntity.maximumPositionSize).truncate(8)
      }
    } else if (neutralActions.includes(params.type)) {
      /**
       * TODO: How does DepositCollateral and Rollover affect PnL?
       */
    }
    loanEntity.save()
  }
  return eventPnL
}

/** Borrow loans use inverse price for CloseWithSwap,
 * Trade loans use inverse price for liquidate
 * TODO: Check DepositCollateral
 * */
function getSellPrice(actionType: LoanActionType, loanType: string, rate: BigDecimal): BigDecimal {
  if (actionType == LoanActionType.CLOSE_WITH_SWAP && loanType == LoanType.Borrow) {
    return decimal.ONE.div(rate)
  }
  if (actionType == LoanActionType.CLOSE_WITH_DEPOSIT && loanType == LoanType.Trade) {
    return decimal.ONE.div(rate)
  }
  if (actionType == LoanActionType.LIQUIDATE && loanType == LoanType.Trade) {
    return decimal.ONE.div(rate)
  }
  return rate
}
