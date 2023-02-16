/**
 * The ISovryn contract handles everything related to Loans.
 * This includes Margin Trades, Borrow loans, and all loan lifecycle events
 */

import {
  Borrow as BorrowEvent, // User event
  CloseWithDeposit as CloseWithDepositEvent, // User event
  CloseWithSwap as CloseWithSwapEvent, // User event
  DepositCollateral as DepositCollateralEvent, // User event
  EarnReward as EarnRewardEvent, // User event
  Liquidate as LiquidateEvent, // User event
  PayBorrowingFee as PayBorrowingFeeEvent,
  PayLendingFee as PayLendingFeeEvent,
  PayTradingFee as PayTradingFeeEvent,
  SetLoanPool as SetLoanPoolEvent,
  Trade as TradeEvent, // User event
  Rollover as RolloverEvent,
  WithdrawFees as WithdrawFeesEvent,
  PayInterestTransfer as PayInterestTransferEvent,
} from '../generated/ISovryn/ISovryn'
import { DepositCollateral as DepositCollateralLegacyEvent } from '../generated/DepositCollateralLegacy/DepositCollateralLegacy'
import { DepositCollateral as DepositCollateralNonIndexedEvent } from '../generated/DepositCollateralNonIndexed/DepositCollateralNonIndexed'
import {
  Borrow,
  CloseWithDeposit,
  CloseWithSwap,
  DepositCollateral,
  Liquidate,
  PayBorrowingFee,
  PayLendingFee,
  PayTradingFee,
  Trade,
  Loan,
  Rollover,
  Token,
  ProtocolWithdrawFee,
  PayInterestTransfer,
} from '../generated/schema'
import { LoanTokenLogicStandard as LoanTokenTemplate } from '../generated/templates'
import { createAndReturnTransaction } from './utils/Transaction'
import { createAndReturnLoan, LoanStartState, updateLoanReturnPnL, ChangeLoanState, LoanActionType } from './utils/Loan'
import { BigDecimal, BigInt, DataSourceContext, ethereum } from '@graphprotocol/graph-ts'
import { createAndReturnProtocolStats, createAndReturnUserTotals } from './utils/ProtocolStats'
import { convertToUsd } from './utils/Prices'
import { decimal, DEFAULT_DECIMALS } from '@protofire/subgraph-toolkit'
import { createAndReturnLendingPool } from './utils/LendingPool'
import { RewardsEarnedAction, ProtocolFeeType } from './utils/types'
import { createOrIncrementRewardItem } from './utils/RewardsEarnedHistoryItem'
import { incrementAvailableTradingRewards, incrementTotalFeesAndRewardsEarned, incrementTotalTradingRewards } from './utils/UserRewardsEarnedHistory'
import { SOVAddress } from './contracts/contracts'

export function handleBorrow(event: BorrowEvent): void {
  createAndReturnTransaction(event)
  const entity = new Borrow(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  const newPrincipal = decimal.fromBigInt(event.params.newPrincipal, DEFAULT_DECIMALS)
  const newCollateral = decimal.fromBigInt(event.params.newCollateral, DEFAULT_DECIMALS)
  const interestRate = decimal.fromBigInt(event.params.interestRate, DEFAULT_DECIMALS)
  const interestDuration = decimal.fromBigInt(event.params.interestDuration, DEFAULT_DECIMALS)
  const collateralToLoanRate = decimal.fromBigInt(event.params.collateralToLoanRate, DEFAULT_DECIMALS)
  const currentMargin = decimal.fromBigInt(event.params.currentMargin, DEFAULT_DECIMALS)

  const loanParams: LoanStartState = {
    loanId: event.params.loanId,
    type: 'Borrow',
    startTimestamp: event.block.timestamp,
    endTimestamp: event.block.timestamp.plus(event.params.interestDuration),
    user: event.params.user,
    loanToken: event.params.loanToken,
    collateralToken: event.params.collateralToken,
    borrowedAmount: newPrincipal,
    positionSize: newCollateral,
    startRate: collateralToLoanRate,
  }
  createAndReturnLoan(loanParams)
  entity.user = event.params.user.toHexString()
  entity.lender = event.params.lender
  entity.loanId = event.params.loanId.toHexString()
  entity.loanToken = event.params.loanToken
  entity.collateralToken = event.params.collateralToken
  entity.newPrincipal = newPrincipal
  entity.newCollateral = newCollateral
  entity.interestRate = interestRate
  entity.interestDuration = interestDuration
  entity.collateralToLoanRate = collateralToLoanRate
  entity.currentMargin = currentMargin
  const transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  const protocolStatsEntity = createAndReturnProtocolStats()
  const userTotalsEntity = createAndReturnUserTotals(event.params.user)
  const usdVolume = convertToUsd(event.params.collateralToken, event.params.newCollateral)
  protocolStatsEntity.totalBorrowVolumeUsd = protocolStatsEntity.totalBorrowVolumeUsd.plus(usdVolume)
  userTotalsEntity.totalBorrowVolumeUsd = userTotalsEntity.totalBorrowVolumeUsd.plus(usdVolume)
  protocolStatsEntity.save()
  userTotalsEntity.save()
}

/** Close from a Borrow Event */
export function handleCloseWithDeposit(event: CloseWithDepositEvent): void {
  const repayAmount = decimal.fromBigInt(event.params.repayAmount, DEFAULT_DECIMALS)
  /** Collateral withdraw amount is in collateral tokens. Reduces Collateral amount */
  const collateralWithdrawAmount = decimal.fromBigInt(event.params.collateralWithdrawAmount, DEFAULT_DECIMALS)
  const collateralToLoanRate = decimal.fromBigInt(event.params.collateralToLoanRate, DEFAULT_DECIMALS)
  const currentMargin = decimal.fromBigInt(event.params.currentMargin, DEFAULT_DECIMALS)

  const entity = new CloseWithDeposit(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.user = event.params.user
  entity.lender = event.params.lender
  entity.loanId = event.params.loanId.toHexString()
  entity.closer = event.params.closer
  entity.loanToken = event.params.loanToken
  entity.collateralToken = event.params.collateralToken
  /** Repay amount is in loan tokens. Reduces Borrowed amount */
  entity.repayAmount = repayAmount
  /** Collateral withdraw amount is in collateral tokens. Reduces Collateral amount */
  entity.collateralWithdrawAmount = collateralWithdrawAmount
  entity.collateralToLoanRate = collateralToLoanRate
  entity.currentMargin = currentMargin
  const transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  const changeParams: ChangeLoanState = {
    loanId: event.params.loanId.toHexString(),
    borrowedAmountChange: BigDecimal.zero().minus(repayAmount),
    positionSizeChange: BigDecimal.zero().minus(collateralWithdrawAmount),
    isOpen: event.params.currentMargin.gt(BigInt.zero()) ? true : false,
    rate: collateralToLoanRate,
    type: LoanActionType.CLOSE_WITH_DEPOSIT,
    timestamp: event.block.timestamp,
  }
  updateLoanReturnPnL(changeParams)

  const protocolStatsEntity = createAndReturnProtocolStats()
  const userTotalsEntity = createAndReturnUserTotals(event.params.user)
  const usdVolume = convertToUsd(event.params.collateralToken, event.params.collateralWithdrawAmount)
  protocolStatsEntity.totalCloseWithDepositVolumeUsd = protocolStatsEntity.totalCloseWithDepositVolumeUsd.plus(usdVolume)
  userTotalsEntity.totalCloseWithDepositVolumeUsd = userTotalsEntity.totalCloseWithDepositVolumeUsd.plus(usdVolume)
  protocolStatsEntity.save()
  userTotalsEntity.save()
}

/** Close from Trade Event */
export function handleCloseWithSwap(event: CloseWithSwapEvent): void {
  const positionCloseSize = decimal.fromBigInt(event.params.positionCloseSize, DEFAULT_DECIMALS)
  /** Loan close amount is in loan tokens */
  const loanCloseAmount = decimal.fromBigInt(event.params.loanCloseAmount, DEFAULT_DECIMALS)
  const exitPrice = decimal.fromBigInt(event.params.exitPrice, DEFAULT_DECIMALS)
  const currentLeverage = decimal.fromBigInt(event.params.currentLeverage, DEFAULT_DECIMALS)

  const entity = new CloseWithSwap(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.user = event.params.user
  entity.lender = event.params.lender
  entity.loanId = event.params.loanId.toHexString()
  entity.collateralToken = event.params.collateralToken
  entity.loanToken = event.params.loanToken
  entity.closer = event.params.closer
  /** Position close size is in collateral tokens */
  entity.positionCloseSize = positionCloseSize
  /** Loan close amount is in loan tokens */
  entity.loanCloseAmount = loanCloseAmount
  entity.exitPrice = exitPrice
  entity.currentLeverage = currentLeverage
  const transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  const changeParams: ChangeLoanState = {
    loanId: event.params.loanId.toHexString(),
    borrowedAmountChange: BigDecimal.zero().minus(loanCloseAmount),
    positionSizeChange: BigDecimal.zero().minus(positionCloseSize),
    isOpen: event.params.currentLeverage.gt(BigInt.zero()) ? true : false,
    rate: exitPrice,
    type: LoanActionType.CLOSE_WITH_SWAP,
    timestamp: event.block.timestamp,
  }
  updateLoanReturnPnL(changeParams)

  const protocolStatsEntity = createAndReturnProtocolStats()
  const userTotalsEntity = createAndReturnUserTotals(event.params.closer)
  const usdVolume = convertToUsd(event.params.collateralToken, event.params.positionCloseSize)
  protocolStatsEntity.totalCloseWithSwapVolumeUsd = protocolStatsEntity.totalCloseWithSwapVolumeUsd.plus(usdVolume)
  userTotalsEntity.totalCloseWithSwapVolumeUsd = userTotalsEntity.totalCloseWithSwapVolumeUsd.plus(usdVolume)
  protocolStatsEntity.save()
  userTotalsEntity.save()
}

export function handleDepositCollateralNonIndexed(event: DepositCollateralNonIndexedEvent): void {
  const depositAmount = decimal.fromBigInt(event.params.depositAmount, DEFAULT_DECIMALS)
  const rate = decimal.fromBigInt(event.params.rate, DEFAULT_DECIMALS)

  const entity = new DepositCollateral(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.loanId = event.params.loanId.toHexString()
  entity.depositAmount = depositAmount
  entity.rate = rate
  const transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  const changeParams: ChangeLoanState = {
    loanId: event.params.loanId.toHexString(),
    borrowedAmountChange: BigDecimal.zero(),
    positionSizeChange: depositAmount,
    isOpen: true,
    rate: rate,
    type: LoanActionType.DEPOSIT_COLLATERAL,
    timestamp: event.block.timestamp,
  }
  updateLoanReturnPnL(changeParams)

  /** TODO: Update protocolStats. Need to return collateralToken from updateLoanReturnPnL */
}

export function handleDepositCollateral(event: DepositCollateralEvent): void {
  const depositAmount = decimal.fromBigInt(event.params.depositAmount, DEFAULT_DECIMALS)
  const rate = decimal.fromBigInt(event.params.rate, DEFAULT_DECIMALS)

  const entity = new DepositCollateral(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.loanId = event.params.loanId.toHexString()
  entity.depositAmount = depositAmount
  entity.rate = rate
  const transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  const changeParams: ChangeLoanState = {
    loanId: event.params.loanId.toHexString(),
    borrowedAmountChange: BigDecimal.zero(),
    positionSizeChange: depositAmount,
    isOpen: true,
    rate: rate,
    type: LoanActionType.DEPOSIT_COLLATERAL,
    timestamp: event.block.timestamp,
  }
  updateLoanReturnPnL(changeParams)

  /** TODO: Update protocolStats. Need to return collateralToken from updateLoanReturnPnL */
}

export function handleDepositCollateralLegacy(event: DepositCollateralLegacyEvent): void {
  const entity = new DepositCollateral(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.loanId = event.params.loanId.toHexString()
  entity.depositAmount = decimal.fromBigInt(event.params.depositAmount, DEFAULT_DECIMALS)
  const transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  const changeParams: ChangeLoanState = {
    loanId: event.params.loanId.toHexString(),
    borrowedAmountChange: BigDecimal.zero(),
    positionSizeChange: decimal.fromBigInt(event.params.depositAmount, DEFAULT_DECIMALS),
    isOpen: true,
    rate: decimal.ONE, //This is a placeholder, this value is not used for DepositCollateral events
    type: LoanActionType.DEPOSIT_COLLATERAL_LEGACY,
    timestamp: event.block.timestamp,
  }
  updateLoanReturnPnL(changeParams)

  /** TODO: Update protocolStats. Need to return collateralToken from updateLoanReturnPnL */
}

/**
 * EarnReward is emitted when a user margin trades and earns a % of the trading fee as a reward in SOV
 */
export function handleEarnReward(event: EarnRewardEvent): void {
  const amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
  createAndReturnTransaction(event)
  incrementTotalTradingRewards(event.params.receiver, amount)
  incrementTotalFeesAndRewardsEarned(event.params.receiver, amount)
  incrementAvailableTradingRewards(event.params.receiver, amount)
  createOrIncrementRewardItem({
    action: RewardsEarnedAction.EarnReward,
    user: event.params.receiver,
    amount: amount,
    timestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
    token: SOVAddress,
  })
}

export function handleLiquidate(event: LiquidateEvent): void {
  const repayAmount = decimal.fromBigInt(event.params.repayAmount, DEFAULT_DECIMALS)
  const collateralWithdrawAmount = decimal.fromBigInt(event.params.collateralWithdrawAmount, DEFAULT_DECIMALS)
  const collateralToLoanRate = decimal.fromBigInt(event.params.collateralToLoanRate, DEFAULT_DECIMALS)
  const currentMargin = decimal.fromBigInt(event.params.currentMargin, DEFAULT_DECIMALS)

  const entity = new Liquidate(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.user = event.params.user.toHexString()
  entity.liquidator = event.params.liquidator
  entity.loanId = event.params.loanId.toHexString()
  entity.lender = event.params.lender
  entity.loanToken = event.params.loanToken
  entity.collateralToken = event.params.collateralToken
  entity.repayAmount = repayAmount
  entity.collateralWithdrawAmount = collateralWithdrawAmount
  entity.collateralToLoanRate = collateralToLoanRate
  entity.currentMargin = currentMargin
  const transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  const changeParams: ChangeLoanState = {
    loanId: event.params.loanId.toHexString(),
    borrowedAmountChange: BigDecimal.zero().minus(repayAmount),
    positionSizeChange: BigDecimal.zero().minus(collateralWithdrawAmount),
    isOpen: event.params.currentMargin.gt(BigInt.zero()) ? true : false,
    rate: collateralToLoanRate,
    type: LoanActionType.LIQUIDATE,
    timestamp: event.block.timestamp,
  }
  updateLoanReturnPnL(changeParams)

  const protocolStatsEntity = createAndReturnProtocolStats()
  const userTotalsEntity = createAndReturnUserTotals(event.params.user)
  const usdVolume = convertToUsd(event.params.collateralToken, event.params.collateralWithdrawAmount)
  protocolStatsEntity.totalLiquidateVolumeUsd = protocolStatsEntity.totalLiquidateVolumeUsd.plus(usdVolume)
  userTotalsEntity.totalLiquidateVolumeUsd = userTotalsEntity.totalLiquidateVolumeUsd.plus(usdVolume)
  protocolStatsEntity.save()
  userTotalsEntity.save()
}

export function handlePayBorrowingFee(event: PayBorrowingFeeEvent): void {
  const entity = new PayBorrowingFee(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.payer = event.params.payer
  entity.token = event.params.token
  entity.loanId = event.params.loanId.toHexString()
  entity.amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
  const transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  const protocolStatsEntity = createAndReturnProtocolStats()
  const userTotalsEntity = createAndReturnUserTotals(event.params.payer)
  const usdVolume = convertToUsd(event.params.token, event.params.amount)
  protocolStatsEntity.totalBorrowingFeesUsd = protocolStatsEntity.totalBorrowingFeesUsd.plus(usdVolume)
  userTotalsEntity.totalBorrowingFeesUsd = userTotalsEntity.totalBorrowingFeesUsd.plus(usdVolume)
  protocolStatsEntity.save()
  userTotalsEntity.save()
}

export function handlePayLendingFee(event: PayLendingFeeEvent): void {
  const entity = new PayLendingFee(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.payer = event.params.payer
  entity.token = event.params.token
  entity.amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
  const transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  const protocolStatsEntity = createAndReturnProtocolStats()
  const userTotalsEntity = createAndReturnUserTotals(event.params.payer)
  const usdVolume = convertToUsd(event.params.token, event.params.amount)
  protocolStatsEntity.totalLendingFeesUsd = protocolStatsEntity.totalLendingFeesUsd.plus(usdVolume)
  userTotalsEntity.totalLendingFeesUsd = userTotalsEntity.totalLendingFeesUsd.plus(usdVolume)
  protocolStatsEntity.save()
  userTotalsEntity.save()
}

export function handlePayTradingFee(event: PayTradingFeeEvent): void {
  const entity = new PayTradingFee(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.payer = event.params.payer
  entity.token = event.params.token
  entity.loanId = event.params.loanId.toHexString()
  entity.amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
  const transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  const protocolStatsEntity = createAndReturnProtocolStats()
  const userTotalsEntity = createAndReturnUserTotals(event.params.payer)
  const usdVolume = convertToUsd(event.params.token, event.params.amount)
  protocolStatsEntity.totalTradingFeesUsd = protocolStatsEntity.totalTradingFeesUsd.plus(usdVolume)
  userTotalsEntity.totalTradingFeesUsd = userTotalsEntity.totalTradingFeesUsd.plus(usdVolume)
  protocolStatsEntity.save()
  userTotalsEntity.save()
}

export function handleSetLoanPool(event: SetLoanPoolEvent): void {
  /** This function creates a new lending pool */
  const context = new DataSourceContext()
  context.setString('underlyingAsset', event.params.underlying.toHexString())
  LoanTokenTemplate.createWithContext(event.params.loanPool, context)
  createAndReturnTransaction(event)
  createAndReturnLendingPool(event)
}

export function handleTrade(event: TradeEvent): void {
  const positionSize = decimal.fromBigInt(event.params.positionSize, DEFAULT_DECIMALS)
  const borrowedAmount = decimal.fromBigInt(event.params.borrowedAmount, DEFAULT_DECIMALS)
  const interestRate = decimal.fromBigInt(event.params.interestRate, DEFAULT_DECIMALS)
  const entryPrice = decimal.fromBigInt(event.params.entryPrice, DEFAULT_DECIMALS)
  const entryLeverage = decimal.fromBigInt(event.params.entryLeverage, DEFAULT_DECIMALS)
  const currentLeverage = decimal.fromBigInt(event.params.currentLeverage, DEFAULT_DECIMALS)

  createAndReturnTransaction(event)

  const entity = new Trade(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  const loanParams: LoanStartState = {
    loanId: event.params.loanId,
    type: 'Trade',
    startTimestamp: event.block.timestamp,
    endTimestamp: event.params.settlementDate,
    user: event.params.user,
    loanToken: event.params.loanToken,
    collateralToken: event.params.collateralToken,
    borrowedAmount: borrowedAmount,
    positionSize: positionSize,
    startRate: entryPrice,
  }
  createAndReturnLoan(loanParams)
  entity.user = event.params.user.toHexString()
  entity.lender = event.params.lender
  entity.loanId = event.params.loanId.toHexString()
  entity.collateralToken = event.params.collateralToken.toHexString()
  entity.loanToken = event.params.loanToken.toHexString()
  /** In Collateral tokens */
  entity.positionSize = positionSize
  /** In Loan tokens */
  entity.borrowedAmount = borrowedAmount
  entity.interestRate = interestRate
  entity.settlementDate = event.params.settlementDate.toI32()
  entity.entryPrice = entryPrice
  entity.entryLeverage = entryLeverage
  entity.currentLeverage = currentLeverage

  const transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  const protocolStatsEntity = createAndReturnProtocolStats()
  const userTotalsEntity = createAndReturnUserTotals(event.params.user)
  const usdTradeVolume = convertToUsd(event.params.collateralToken, event.params.positionSize)
  protocolStatsEntity.totalMarginTradeVolumeUsd = protocolStatsEntity.totalMarginTradeVolumeUsd.plus(usdTradeVolume)
  userTotalsEntity.totalMarginTradeVolumeUsd = userTotalsEntity.totalMarginTradeVolumeUsd.plus(usdTradeVolume)
  protocolStatsEntity.save()
  userTotalsEntity.save()
}

export function handleRollover(event: RolloverEvent): void {
  createAndReturnTransaction(event)
  const loan = Loan.load(event.params.loanId.toHexString())
  if (loan != null) {
    loan.nextRollover = event.params.endTimestamp.toI32()
    loan.positionSize = decimal.fromBigInt(event.params.collateral, DEFAULT_DECIMALS)
    loan.borrowedAmount = decimal.fromBigInt(event.params.principal, DEFAULT_DECIMALS)
    if (loan.positionSize == BigDecimal.zero() || loan.borrowedAmount == BigDecimal.zero()) {
      loan.isOpen = false
      loan.endTimestamp = event.block.timestamp.toI32()
    }
    loan.save()

    const rolloverEntity = new Rollover(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
    rolloverEntity.loanId = event.params.loanId.toHexString()
    rolloverEntity.principal = decimal.fromBigInt(event.params.principal, DEFAULT_DECIMALS)
    rolloverEntity.collateral = decimal.fromBigInt(event.params.collateral, DEFAULT_DECIMALS)
    rolloverEntity.endTimestamp = event.params.endTimestamp.toI32()
    rolloverEntity.rewardReceiver = event.params.rewardReceiver.toHexString()
    rolloverEntity.reward = decimal.fromBigInt(event.params.reward, DEFAULT_DECIMALS)
    rolloverEntity.timestamp = event.block.timestamp.toI32()
    rolloverEntity.user = event.params.user.toHexString()
    rolloverEntity.emittedBy = event.address
    rolloverEntity.transaction = event.transaction.hash.toHexString()
    rolloverEntity.save()
  }
}

export function handleWithdrawFees(event: WithdrawFeesEvent): void {
  createAndReturnTransaction(event)
  function createWithdrawFees(amount: BigDecimal, token: Token, feeType: string, event: ethereum.Event): void {
    const withdrawFees = new ProtocolWithdrawFee(event.transaction.hash.toHexString() + '-' + event.logIndex.toHexString() + '-' + feeType)
    withdrawFees.amount = amount
    withdrawFees.amountUsd = amount.times(token.lastPriceUsd)
    withdrawFees.token = token.id
    withdrawFees.feeType = feeType
    withdrawFees.transaction = event.transaction.hash.toHexString()
    withdrawFees.timestamp = event.block.timestamp.toI32()
    withdrawFees.emittedBy = event.address.toHexString()
    withdrawFees.save()
  }
  const token = Token.load(event.params.token.toHexString())
  if (token != null) {
    createWithdrawFees(decimal.fromBigInt(event.params.tradingAmount, token.decimals), token, ProtocolFeeType.Trading, event)
    createWithdrawFees(decimal.fromBigInt(event.params.borrowingAmount, token.decimals), token, ProtocolFeeType.Borrowing, event)
    createWithdrawFees(decimal.fromBigInt(event.params.lendingAmount, token.decimals), token, ProtocolFeeType.Lending, event)
  }
}

export function handlePayInterestTransfer(event: PayInterestTransferEvent): void {
  createAndReturnTransaction(event)
  const payInterestTransfer = new PayInterestTransfer(event.transaction.hash.toHexString() + '-' + event.logIndex.toHexString())
  payInterestTransfer.interestToken = event.params.interestToken.toHexString()
  payInterestTransfer.lender = event.params.lender.toHexString()
  payInterestTransfer.effectiveInterest = decimal.fromBigInt(event.params.effectiveInterest, DEFAULT_DECIMALS)
  payInterestTransfer.transaction = event.transaction.hash.toHexString()
  payInterestTransfer.emittedBy = event.address.toHexString()
  payInterestTransfer.timestamp = event.block.timestamp.toI32()
  payInterestTransfer.save()
}
