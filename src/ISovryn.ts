import {
  Borrow as BorrowEvent, // User event
  CloseWithDeposit as CloseWithDepositEvent, // User event
  CloseWithSwap as CloseWithSwapEvent, // User event
  DepositCollateral as DepositCollateralEvent, // User event
  EarnReward as EarnRewardEvent, // User event
  ExternalSwap as ExternalSwapEvent,
  Liquidate as LiquidateEvent, // User event
  LoanSwap as LoanSwapEvent,
  PayBorrowingFee as PayBorrowingFeeEvent,
  PayLendingFee as PayLendingFeeEvent,
  PayTradingFee as PayTradingFeeEvent,
  SetLoanPool as SetLoanPoolEvent,
  SetWrbtcToken as SetWrbtcTokenEvent,
  Trade as TradeEvent, // User event
} from '../generated/ISovryn/ISovryn'
import {
  Borrow,
  CloseWithDeposit,
  CloseWithSwap,
  DepositCollateral,
  EarnReward,
  ExternalSwap,
  Liquidate,
  LoanSwap,
  PayBorrowingFee,
  PayLendingFee,
  PayTradingFee,
  SetLoanPool,
  SetWrbtcToken,
  Trade,
  Loan,
  LoanToken,
} from '../generated/schema'
import { LoanTokenLogicStandard as LoanTokenTemplate } from '../generated/templates'
import { loadTransaction } from './utils/Transaction'
import { createAndReturnLoan, LoanStartState, getCollateralAmountFromTrade } from './utils/Loan'
import { DataSourceContext } from '@graphprotocol/graph-ts'

export function handleBorrow(event: BorrowEvent): void {
  let entity = new Borrow(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  let loanParams: LoanStartState = {
    loanId: event.params.loanId,
    isBorrow: true,
    isTrade: false,
    startTimestamp: event.block.timestamp,
    user: event.params.user,
    loanToken: event.params.loanToken,
    collateralToken: event.params.collateralToken,
    borrowedAmount: event.params.newPrincipal,
    collateralAmount: event.params.newCollateral,
    startRate: event.params.collateralToLoanRate,
  }
  let loanEntity = createAndReturnLoan(loanParams)
  entity.user = event.params.user
  entity.lender = event.params.lender
  if (loanEntity != null) {
    entity.loanId = loanEntity.id
  }
  entity.loanToken = event.params.loanToken
  entity.collateralToken = event.params.collateralToken
  entity.newPrincipal = event.params.newPrincipal
  entity.newCollateral = event.params.newCollateral
  entity.interestRate = event.params.interestRate
  entity.interestDuration = event.params.interestDuration
  entity.collateralToLoanRate = event.params.collateralToLoanRate
  entity.currentMargin = event.params.currentMargin
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

/** Close from a Borrow Event */
export function handleCloseWithDeposit(event: CloseWithDepositEvent): void {
  let entity = new CloseWithDeposit(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  let loanEntity = Loan.load(event.params.loanId.toHexString())
  entity.user = event.params.user
  entity.lender = event.params.lender
  if (loanEntity != null) {
    entity.loanId = loanEntity.id
  }
  entity.closer = event.params.closer
  entity.loanToken = event.params.loanToken
  entity.collateralToken = event.params.collateralToken
  /** Repay amount is in loan tokens. Reduces Borrowed amount */
  entity.repayAmount = event.params.repayAmount
  /** Collateral withdraw amount is in collateral tokens. Reduces Collateral amount */
  entity.collateralWithdrawAmount = event.params.collateralWithdrawAmount
  entity.collateralToLoanRate = event.params.collateralToLoanRate
  entity.currentMargin = event.params.currentMargin
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

/** Close from Trade Event */
export function handleCloseWithSwap(event: CloseWithSwapEvent): void {
  let entity = new CloseWithSwap(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  let loanEntity = Loan.load(event.params.loanId.toHexString())
  entity.user = event.params.user
  entity.lender = event.params.lender
  if (loanEntity != null) {
    entity.loanId = loanEntity.id
  }
  entity.collateralToken = event.params.collateralToken
  entity.loanToken = event.params.loanToken
  entity.closer = event.params.closer
  /** Position close size is in collateral tokens */
  entity.positionCloseSize = event.params.positionCloseSize
  /** Loan close amount is in loan tokens */
  entity.loanCloseAmount = event.params.loanCloseAmount
  entity.exitPrice = event.params.exitPrice
  entity.currentLeverage = event.params.currentLeverage
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleDepositCollateral(event: DepositCollateralEvent): void {
  let entity = new DepositCollateral(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  let loanEntity = Loan.load(event.params.loanId.toHexString())
  if (loanEntity != null) {
    entity.loanId = loanEntity.id
  }
  entity.depositAmount = event.params.depositAmount
  entity.rate = event.params.rate
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleEarnReward(event: EarnRewardEvent): void {
  let entity = new EarnReward(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  let loanEntity = Loan.load(event.params.loanId.toHexString())
  entity.receiver = event.params.receiver
  entity.token = event.params.token
  if (loanEntity != null) {
    entity.loanId = loanEntity.id
  }
  entity.feeRebatePercent = event.params.feeRebatePercent
  entity.amount = event.params.amount
  entity.basisPoint = event.params.basisPoint
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleExternalSwap(event: ExternalSwapEvent): void {
  let entity = new ExternalSwap(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.user = event.params.user
  entity.sourceToken = event.params.sourceToken
  entity.destToken = event.params.destToken
  entity.sourceAmount = event.params.sourceAmount
  entity.destAmount = event.params.destAmount
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleLiquidate(event: LiquidateEvent): void {
  let entity = new Liquidate(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  let loanEntity = Loan.load(event.params.loanId.toHexString())
  entity.user = event.params.user
  entity.liquidator = event.params.liquidator
  if (loanEntity != null) {
    entity.loanId = loanEntity.id
  }
  entity.lender = event.params.lender
  entity.loanToken = event.params.loanToken
  entity.collateralToken = event.params.collateralToken
  entity.repayAmount = event.params.repayAmount
  entity.collateralWithdrawAmount = event.params.collateralWithdrawAmount
  entity.collateralToLoanRate = event.params.collateralToLoanRate
  entity.currentMargin = event.params.currentMargin
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleLoanSwap(event: LoanSwapEvent): void {
  let entity = new LoanSwap(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  let loanEntity = Loan.load(event.params.loanId.toHexString())
  if (loanEntity != null) {
    entity.loanId = loanEntity.id
  }
  entity.sourceToken = event.params.sourceToken
  entity.destToken = event.params.destToken
  entity.borrower = event.params.borrower
  entity.sourceAmount = event.params.sourceAmount
  entity.destAmount = event.params.destAmount
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handlePayBorrowingFee(event: PayBorrowingFeeEvent): void {
  let entity = new PayBorrowingFee(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  let loanEntity = Loan.load(event.params.loanId.toHexString())
  entity.payer = event.params.payer
  entity.token = event.params.token
  if (loanEntity != null) {
    entity.loanId = loanEntity.id
  }
  entity.amount = event.params.amount
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handlePayLendingFee(event: PayLendingFeeEvent): void {
  let entity = new PayLendingFee(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.payer = event.params.payer
  entity.token = event.params.token
  entity.amount = event.params.amount
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handlePayTradingFee(event: PayTradingFeeEvent): void {
  let entity = new PayTradingFee(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  let loanEntity = Loan.load(event.params.loanId.toHexString())
  entity.payer = event.params.payer
  entity.token = event.params.token
  if (loanEntity != null) {
    entity.loanId = loanEntity.id
  }
  entity.amount = event.params.amount
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleSetLoanPool(event: SetLoanPoolEvent): void {
  /** This function creates a new lending pool */

  /** Context not currently working, not sure why */
  let context = new DataSourceContext()
  context.setString('underlyingAsset', event.params.underlying.toHexString())
  LoanTokenTemplate.createWithContext(event.params.loanPool, context)

  let entity = new SetLoanPool(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.sender = event.params.sender
  entity.loanPool = event.params.loanPool
  entity.underlying = event.params.underlying
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address

  let loanTokenEntity = new LoanToken(event.params.loanPool.toHexString())
  loanTokenEntity.underlyingAsset = event.params.underlying.toHexString()
  loanTokenEntity.save()

  entity.save()
}

export function handleSetWrbtcToken(event: SetWrbtcTokenEvent): void {
  let entity = new SetWrbtcToken(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.sender = event.params.sender
  entity.oldWethToken = event.params.oldWethToken
  entity.newWethToken = event.params.newWethToken
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleTrade(event: TradeEvent): void {
  let entity = new Trade(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  let loanParams: LoanStartState = {
    loanId: event.params.loanId,
    isBorrow: false,
    isTrade: true,
    startTimestamp: event.block.timestamp,
    user: event.params.user,
    loanToken: event.params.loanToken,
    collateralToken: event.params.collateralToken,
    borrowedAmount: event.params.borrowedAmount,
    collateralAmount: getCollateralAmountFromTrade(event.params.positionSize, event.params.currentLeverage),
    startRate: event.params.entryPrice,
  }
  let loanEntity = createAndReturnLoan(loanParams)
  entity.user = event.params.user
  entity.lender = event.params.lender
  if (loanEntity != null) {
    entity.loanId = loanEntity.id
  }
  entity.collateralToken = event.params.collateralToken
  entity.loanToken = event.params.loanToken
  /** In Collteral tokens */
  entity.positionSize = event.params.positionSize
  /** In Loan tokens */
  entity.borrowedAmount = event.params.borrowedAmount
  entity.interestRate = event.params.interestRate
  entity.settlementDate = event.params.settlementDate
  entity.entryPrice = event.params.entryPrice
  entity.entryLeverage = event.params.entryLeverage
  entity.currentLeverage = event.params.currentLeverage
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}
