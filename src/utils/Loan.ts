/**
 * This file is a work in progress - the goal is to have all PnL calculations and ot
 */

import { BigDecimal, BigInt, Bytes, log } from '@graphprotocol/graph-ts'
import { Loan } from '../../generated/schema'
import { integer } from '@protofire/subgraph-toolkit'
export class LoanStartState {
  loanId: Bytes
  user: Bytes
  type: string
  startTimestamp: BigInt
  loanToken: Bytes
  collateralToken: Bytes
  /** For Borrow, this is newPrincipal. For Trade this is borrowedAmount */
  borrowedAmount: BigInt
  /** For Borrow, this is newCollateral. For Trade, this is positionSize */
  positionSize: BigInt
  startRate: BigInt
}
export class ChangeLoanState {
  loanId: string
  positionSizeChange: BigInt
  borrowedAmountChange: BigInt
  isOpen: boolean
  type: string | null // Buy or Sell
  rate: BigInt
}

export function createAndReturnLoan(startParams: LoanStartState): Loan {
  let loanEntity = Loan.load(startParams.loanId.toHexString())
  if (loanEntity == null) {
    loanEntity = new Loan(startParams.loanId.toHexString())
    loanEntity.type = startParams.type
    loanEntity.isOpen = true
    loanEntity.startTimestamp = startParams.startTimestamp
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
    loanEntity.totalSold = BigInt.zero()
    loanEntity.averageBuyPrice = startParams.startRate
    loanEntity.averageSellPrice = BigInt.zero()
    loanEntity.realizedPnL = BigInt.zero()
    loanEntity.realizedPnLPercent = BigDecimal.zero()
    loanEntity.save()
    /**
     * TODO: Add Max Position Size for calculating PnL percentage
     */
  }
  return loanEntity
}

export function updateLoanReturnPnL(params: ChangeLoanState): BigInt {
  let loanEntity = Loan.load(params.loanId)
  let eventPnL = BigInt.zero()
  if (loanEntity != null) {
    loanEntity.positionSize = loanEntity.positionSize.plus(params.positionSizeChange)
    loanEntity.borrowedAmount = loanEntity.borrowedAmount.plus(params.borrowedAmountChange)
    loanEntity.isOpen = params.isOpen
    if (loanEntity.positionSize.gt(loanEntity.maximumPositionSize)) {
      loanEntity.maximumPositionSize = loanEntity.positionSize
    }
    if (loanEntity.borrowedAmount.gt(loanEntity.maxBorrowedAmount)) {
      loanEntity.maxBorrowedAmount = loanEntity.borrowedAmount
    }

    if (params.type == 'Buy') {
      let oldWeightedPrice = loanEntity.totalBought.times(loanEntity.averageBuyPrice)
      let newWeightedPrice = params.positionSizeChange.times(params.rate)
      const newTotalBought = loanEntity.totalBought.plus(params.positionSizeChange)
      loanEntity.totalBought = newTotalBought
      loanEntity.averageBuyPrice = oldWeightedPrice.plus(newWeightedPrice).div(newTotalBought)
    } else if (params.type == 'Sell') {
      const amountSold = BigInt.zero().minus(params.positionSizeChange)
      const priceSoldAt = params.rate
      const differenceFromBuyPrice = loanEntity.averageBuyPrice.minus(priceSoldAt)
      const newPnL = differenceFromBuyPrice.times(amountSold).div(BigInt.fromString('1000000000000000000'))

      log.debug('DEBUGGING PNL: \nSELL RATE: {} \nLOAN ID: {} \nAMOUNT SOLD: {} \nDIFFERENCE FROM BUY PRICE: {} \nNEW PNL: {}', [
        params.rate.toString(),
        params.loanId.toString(),
        amountSold.toString(),
        differenceFromBuyPrice.toString(),
        newPnL.toString(),
      ])

      let oldWeightedPrice = loanEntity.totalSold.times(loanEntity.averageSellPrice) // If first time, this is 0
      let newWeightedPrice = amountSold.times(params.rate)
      const newTotalSold = loanEntity.totalSold.plus(amountSold)
      loanEntity.totalSold = newTotalSold
      const totalWeightedPrice = oldWeightedPrice.plus(newWeightedPrice)
      loanEntity.averageSellPrice = totalWeightedPrice.div(newTotalSold)
      eventPnL = newPnL
      loanEntity.realizedPnL = loanEntity.realizedPnL.plus(newPnL)
      loanEntity.realizedPnLPercent = loanEntity.realizedPnL.times(BigInt.fromI32(100)).divDecimal(loanEntity.maximumPositionSize.toBigDecimal()).truncate(8)
    } else if (params.type == null) {
      /**
       * TODO: How does DepositCollateral affect PnL?
       */
    }
    loanEntity.save()
  }
  return eventPnL
}
