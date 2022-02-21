/**
 * This file is a work in progress - the goal is to have all PnL calculations and ot
 */

import { BigInt, Bytes } from '@graphprotocol/graph-ts'
import { Loan } from '../../generated/schema'
export class LoanStartState {
  loanId: Bytes
  user: Bytes
  type: string
  startTimestamp: BigInt
  loanToken: Bytes
  collateralToken: Bytes
  borrowedAmount: BigInt
  positionSize: BigInt
  startRate: BigInt
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
    loanEntity.positionSize = startParams.positionSize
    loanEntity.realizedPnL = BigInt.zero()
    loanEntity.save()
  }
  return loanEntity
}

export function closeLoanWithSwap(loanId: Bytes): void {}

export function closeLoanWithDeposit(loanId: Bytes): void {}

// export function changePositionSize(changeParams: ChangePositionSizeState): void {
//   let loanEntity = Loan.load(changeParams.loanId.toHexString())
//   if (loanEntity != null) {
//     let newPositionSize = loanEntity.positionSize.plus(changeParams.positionSizeToAdd).minus(changeParams.positionSizeToRemove)
//     let newCollateralSize = loanEntity.collateralAmount.plus(changeParams.collateralToAdd).minus(changeParams.collateralToRemove)
//     loanEntity.positionSize = newPositionSize
//     loanEntity.collateralAmount = newCollateralSize
//   }
//   if (changeParams.collateralToRemove != BigZero) {
//     let collateralAmountInNewRate = changeParams.collateralToRemove.times(changeParams.collateralToLoanRate)
//     let collateralAmountInStartRate = changeParams.collateralToRemove.times(loanEntity.startRate)
//     let realisedPnL = collateralAmountInNewRate.minus(collateralAmountInStartRate)
//     loanEntity.realizedPnL = loanEntity.realizedPnL.plus(realisedPnL)
//   }
//   if (changeParams.isLoanClose) {
//     loanEntity.isOpen = false
//   }
//   loanEntity.save()
// }

export function getCollateralAmountFromTrade(positionSize: BigInt, currentLeverage: BigInt): BigInt {
  return positionSize.div(currentLeverage.plus(BigInt.fromString('1000000000000000000')))
}
