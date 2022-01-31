import { BigInt, Bytes, Address } from '@graphprotocol/graph-ts'
import { Loan } from '../../generated/schema'
import { createAndReturnUser } from './User'
import { Token } from '../../generated/schema'

export class LoanStartState {
  loanId: Bytes
  user: Bytes
  isTrade: boolean
  isBorrow: boolean
  startTimestamp: BigInt
  loanToken: Bytes
  collateralToken: Bytes
  borrowedAmount: BigInt
  collateralAmount: BigInt
  startRate: BigInt
}

// export class ChangePositionSizeState {
//   loanId: Bytes
//   collateralToAdd: BigInt = BigZero
//   collateralToRemove: BigInt = BigZero
//   positionSizeToAdd: BigInt = BigZero
//   positionSizeToRemove: BigInt = BigZero
//   collateralToLoanRate: BigInt
//   isLoanClose: boolean = false
// }

const BigZero = BigInt.fromString('0')

export function createAndReturnLoan(startParams: LoanStartState): Loan {
  let loanEntity = Loan.load(startParams.loanId.toHexString())
  if (loanEntity == null) {
    loanEntity = new Loan(startParams.loanId.toHexString())
    loanEntity.isTrade = startParams.isTrade
    loanEntity.isBorrow = startParams.isBorrow
    loanEntity.isOpen = true
    loanEntity.startTimestamp = startParams.startTimestamp
    let userEntity = createAndReturnUser(Address.fromString(startParams.user.toHexString()))
    loanEntity.user = userEntity.id
    let collateralToken = Token.load(startParams.collateralToken.toHexString())
    if (collateralToken != null) {
      loanEntity.collateralToken = collateralToken.id
    }
    let loanToken = Token.load(startParams.loanToken.toHexString())
    if (loanToken != null) {
      loanEntity.loanToken = loanToken.id
    }
    loanEntity.borrowedAmount = startParams.borrowedAmount
    loanEntity.collateralAmount = startParams.collateralAmount
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
