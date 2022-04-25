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
  PayInterestTransfer as PayInterestTransferEvent,
  PayTradingFee as PayTradingFeeEvent,
  SetLoanPool as SetLoanPoolEvent,
  SetWrbtcToken as SetWrbtcTokenEvent,
  Trade as TradeEvent, // User event
} from '../generated/ISovryn/ISovryn'
import { DepositCollateral as DepositCollateralLegacyEvent } from '../generated/DepositCollateralLegacy/DepositCollateralLegacy'
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
  Swap,
  UserRewardsEarnedHistory,
  RewardsEarnedHistoryItem,
} from '../generated/schema'
import { LoanTokenLogicStandard as LoanTokenTemplate } from '../generated/templates'
import { createAndReturnTransaction } from './utils/Transaction'
import { createAndReturnLoan, LoanStartState, updateLoanReturnPnL, ChangeLoanState, LoanActionType } from './utils/Loan'
import { BigDecimal, BigInt, DataSourceContext } from '@graphprotocol/graph-ts'
import { createAndReturnUser } from './utils/User'
import { createAndReturnProtocolStats, createAndReturnUserTotals } from './utils/ProtocolStats'
import { convertToUsd } from './utils/Prices'
import { decimal } from '@protofire/subgraph-toolkit'
import { createAndReturnLendingPool } from './utils/LendingPool'
import { RewardsEarnedAction } from './utils/types'

export function handleBorrow(event: BorrowEvent): void {
  let transaction = createAndReturnTransaction(event)

  let entity = new Borrow(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  let loanParams: LoanStartState = {
    loanId: event.params.loanId,
    type: 'Borrow',
    startTimestamp: event.block.timestamp,
    user: event.params.user,
    loanToken: event.params.loanToken,
    collateralToken: event.params.collateralToken,
    borrowedAmount: decimal.fromBigInt(event.params.newPrincipal, 18),
    positionSize: decimal.fromBigInt(event.params.newCollateral, 18),
    startRate: decimal.ONE.div(decimal.fromBigInt(event.params.collateralToLoanRate, 18)),
  }
  createAndReturnLoan(loanParams)
  entity.user = event.params.user.toHexString()
  entity.lender = event.params.lender
  entity.loanId = event.params.loanId.toHexString()
  entity.loanToken = event.params.loanToken
  entity.collateralToken = event.params.collateralToken
  entity.newPrincipal = event.params.newPrincipal
  entity.newCollateral = event.params.newCollateral
  entity.interestRate = event.params.interestRate
  entity.interestDuration = event.params.interestDuration
  entity.collateralToLoanRate = event.params.collateralToLoanRate
  entity.currentMargin = event.params.currentMargin

  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  let protocolStatsEntity = createAndReturnProtocolStats()
  let userTotalsEntity = createAndReturnUserTotals(event.params.user)
  let usdVolume = convertToUsd(event.params.collateralToken, event.params.newCollateral)
  protocolStatsEntity.totalBorrowVolumeUsd = protocolStatsEntity.totalBorrowVolumeUsd.plus(usdVolume)
  userTotalsEntity.totalBorrowVolumeUsd = userTotalsEntity.totalBorrowVolumeUsd.plus(usdVolume)
  protocolStatsEntity.save()
  userTotalsEntity.save()
}

/** Close from a Borrow Event */
export function handleCloseWithDeposit(event: CloseWithDepositEvent): void {
  let entity = new CloseWithDeposit(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.user = event.params.user
  entity.lender = event.params.lender
  entity.loanId = event.params.loanId.toHexString()
  entity.closer = event.params.closer
  entity.loanToken = event.params.loanToken
  entity.collateralToken = event.params.collateralToken
  /** Repay amount is in loan tokens. Reduces Borrowed amount */
  entity.repayAmount = event.params.repayAmount
  /** Collateral withdraw amount is in collateral tokens. Reduces Collateral amount */
  entity.collateralWithdrawAmount = event.params.collateralWithdrawAmount
  entity.collateralToLoanRate = event.params.collateralToLoanRate
  entity.currentMargin = event.params.currentMargin
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  let changeParams: ChangeLoanState = {
    loanId: event.params.loanId.toHexString(),
    borrowedAmountChange: BigDecimal.zero().minus(decimal.fromBigInt(event.params.repayAmount, 18)),
    positionSizeChange: BigDecimal.zero().minus(decimal.fromBigInt(event.params.collateralWithdrawAmount, 18)),
    isOpen: event.params.currentMargin.gt(BigInt.zero()) ? true : false,
    rate: decimal.ONE.div(decimal.fromBigInt(event.params.collateralToLoanRate, 18)),
    type: LoanActionType.SELL,
    timestamp: event.block.timestamp,
  }
  updateLoanReturnPnL(changeParams)

  let protocolStatsEntity = createAndReturnProtocolStats()
  let userTotalsEntity = createAndReturnUserTotals(event.params.user)
  let usdVolume = convertToUsd(event.params.collateralToken, event.params.collateralWithdrawAmount)
  protocolStatsEntity.totalCloseWithDepositVolumeUsd = protocolStatsEntity.totalCloseWithDepositVolumeUsd.plus(usdVolume)
  userTotalsEntity.totalCloseWithDepositVolumeUsd = userTotalsEntity.totalCloseWithDepositVolumeUsd.plus(usdVolume)
  protocolStatsEntity.save()
  userTotalsEntity.save()
}

/** Close from Trade Event */
export function handleCloseWithSwap(event: CloseWithSwapEvent): void {
  let entity = new CloseWithSwap(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.user = event.params.user
  entity.lender = event.params.lender
  entity.loanId = event.params.loanId.toHexString()
  entity.collateralToken = event.params.collateralToken
  entity.loanToken = event.params.loanToken
  entity.closer = event.params.closer
  /** Position close size is in collateral tokens */
  entity.positionCloseSize = event.params.positionCloseSize
  /** Loan close amount is in loan tokens */
  entity.loanCloseAmount = event.params.loanCloseAmount
  entity.exitPrice = event.params.exitPrice
  entity.currentLeverage = event.params.currentLeverage
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  let changeParams: ChangeLoanState = {
    loanId: event.params.loanId.toHexString(),
    borrowedAmountChange: BigDecimal.zero().minus(decimal.fromBigInt(event.params.loanCloseAmount, 18)),
    positionSizeChange: BigDecimal.zero().minus(decimal.fromBigInt(event.params.positionCloseSize, 18)),
    isOpen: event.params.currentLeverage.gt(BigInt.zero()) ? true : false,
    rate: decimal.fromBigInt(event.params.exitPrice, 18),
    type: LoanActionType.SELL,
    timestamp: event.block.timestamp,
  }
  updateLoanReturnPnL(changeParams)

  let protocolStatsEntity = createAndReturnProtocolStats()
  let userTotalsEntity = createAndReturnUserTotals(event.params.closer)
  let usdVolume = convertToUsd(event.params.collateralToken, event.params.positionCloseSize)
  protocolStatsEntity.totalCloseWithSwapVolumeUsd = protocolStatsEntity.totalCloseWithSwapVolumeUsd.plus(usdVolume)
  userTotalsEntity.totalCloseWithSwapVolumeUsd = userTotalsEntity.totalCloseWithSwapVolumeUsd.plus(usdVolume)
  protocolStatsEntity.save()
  userTotalsEntity.save()
}

export function handleDepositCollateral(event: DepositCollateralEvent): void {
  let entity = new DepositCollateral(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.loanId = event.params.loanId.toHexString()
  entity.depositAmount = event.params.depositAmount
  entity.rate = event.params.rate
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  let changeParams: ChangeLoanState = {
    loanId: event.params.loanId.toHexString(),
    borrowedAmountChange: BigDecimal.zero(),
    positionSizeChange: decimal.fromBigInt(event.params.depositAmount, 18),
    isOpen: true,
    rate: decimal.fromBigInt(event.params.rate, 18),
    type: LoanActionType.NEUTRAL,
    timestamp: event.block.timestamp,
  }
  updateLoanReturnPnL(changeParams)

  /** TODO: Update protocolStats. Need to return collateralToken from updateLoanReturnPnL */
}

export function handleDepositCollateralLegacy(event: DepositCollateralLegacyEvent): void {
  let entity = new DepositCollateral(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.loanId = event.params.loanId.toHexString()
  entity.depositAmount = event.params.depositAmount
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  let changeParams: ChangeLoanState = {
    loanId: event.params.loanId.toHexString(),
    borrowedAmountChange: BigDecimal.zero(),
    positionSizeChange: decimal.fromBigInt(event.params.depositAmount),
    isOpen: true,
    rate: decimal.ONE, //This is a placeholder, this value is not used for DepositCollateral events
    type: LoanActionType.NEUTRAL,
    timestamp: event.block.timestamp,
  }
  updateLoanReturnPnL(changeParams)

  /** TODO: Update protocolStats. Need to return collateralToken from updateLoanReturnPnL */
}

export function handleEarnReward(event: EarnRewardEvent): void {
  createAndReturnTransaction(event)
  let userRewardsEarnedHistory = UserRewardsEarnedHistory.load(event.params.receiver.toHexString())
  if (userRewardsEarnedHistory != null) {
    userRewardsEarnedHistory.availableRewardSov = userRewardsEarnedHistory.availableRewardSov.plus(event.params.amount)
    userRewardsEarnedHistory.availableTradingRewards = userRewardsEarnedHistory.availableTradingRewards.plus(event.params.amount)
    userRewardsEarnedHistory.totalFeesAndRewardsEarned = userRewardsEarnedHistory.totalFeesAndRewardsEarned.plus(event.params.amount)
    userRewardsEarnedHistory.save()
  } else {
    userRewardsEarnedHistory = new UserRewardsEarnedHistory(event.params.receiver.toHexString())
    userRewardsEarnedHistory.availableRewardSov = event.params.amount
    userRewardsEarnedHistory.availableTradingRewards = event.params.amount
    userRewardsEarnedHistory.totalFeesAndRewardsEarned = event.params.amount
    userRewardsEarnedHistory.user = event.params.receiver.toHexString()
    userRewardsEarnedHistory.save()
  }

  let rewardsEarnedHistoryItem = new RewardsEarnedHistoryItem(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  rewardsEarnedHistoryItem.action = RewardsEarnedAction.EarnReward
  rewardsEarnedHistoryItem.user = event.params.receiver.toHexString()
  rewardsEarnedHistoryItem.amount = event.params.amount
  rewardsEarnedHistoryItem.timestamp = event.block.timestamp
  rewardsEarnedHistoryItem.transaction = event.transaction.hash.toHexString()
  rewardsEarnedHistoryItem.save()
}

export function handleExternalSwap(event: ExternalSwapEvent): void {
  let swapEntity = Swap.load(event.transaction.hash.toHexString())
  if (swapEntity != null) {
    createAndReturnTransaction(event)
    swapEntity.user = event.transaction.from.toHexString()
    swapEntity.save()
  }
}

export function handleLiquidate(event: LiquidateEvent): void {
  let entity = new Liquidate(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.user = event.params.user.toHexString()
  entity.liquidator = event.params.liquidator
  entity.loanId = event.params.loanId.toHexString()
  entity.lender = event.params.lender
  entity.loanToken = event.params.loanToken
  entity.collateralToken = event.params.collateralToken
  entity.repayAmount = event.params.repayAmount
  entity.collateralWithdrawAmount = event.params.collateralWithdrawAmount
  entity.collateralToLoanRate = event.params.collateralToLoanRate
  entity.currentMargin = event.params.currentMargin
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  let changeParams: ChangeLoanState = {
    loanId: event.params.loanId.toHexString(),
    borrowedAmountChange: BigDecimal.zero().minus(decimal.fromBigInt(event.params.repayAmount, 18)),
    positionSizeChange: BigDecimal.zero().minus(decimal.fromBigInt(event.params.collateralWithdrawAmount)),
    isOpen: event.params.currentMargin.gt(BigInt.zero()) ? true : false,
    rate: decimal.ONE.div(decimal.fromBigInt(event.params.collateralToLoanRate, 18)),
    type: LoanActionType.SELL,
    timestamp: event.block.timestamp,
  }
  updateLoanReturnPnL(changeParams)

  let protocolStatsEntity = createAndReturnProtocolStats()
  let userTotalsEntity = createAndReturnUserTotals(event.params.user)
  let usdVolume = convertToUsd(event.params.collateralToken, event.params.collateralWithdrawAmount)
  protocolStatsEntity.totalLiquidateVolumeUsd = protocolStatsEntity.totalLiquidateVolumeUsd.plus(usdVolume)
  userTotalsEntity.totalLiquidateVolumeUsd = userTotalsEntity.totalLiquidateVolumeUsd.plus(usdVolume)
  protocolStatsEntity.save()
  userTotalsEntity.save()
}

export function handleLoanSwap(event: LoanSwapEvent): void {}

export function handlePayBorrowingFee(event: PayBorrowingFeeEvent): void {
  let entity = new PayBorrowingFee(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.payer = event.params.payer
  entity.token = event.params.token
  entity.loanId = event.params.loanId.toHexString()
  entity.amount = event.params.amount
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  let protocolStatsEntity = createAndReturnProtocolStats()
  let userTotalsEntity = createAndReturnUserTotals(event.params.payer)
  let usdVolume = convertToUsd(event.params.token, event.params.amount)
  protocolStatsEntity.totalBorrowingFeesUsd = protocolStatsEntity.totalBorrowingFeesUsd.plus(usdVolume)
  userTotalsEntity.totalBorrowingFeesUsd = userTotalsEntity.totalBorrowingFeesUsd.plus(usdVolume)
  protocolStatsEntity.save()
  userTotalsEntity.save()
}

export function handlePayLendingFee(event: PayLendingFeeEvent): void {
  let entity = new PayLendingFee(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.payer = event.params.payer
  entity.token = event.params.token
  entity.amount = event.params.amount
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  let protocolStatsEntity = createAndReturnProtocolStats()
  let userTotalsEntity = createAndReturnUserTotals(event.params.payer)
  let usdVolume = convertToUsd(event.params.token, event.params.amount)
  protocolStatsEntity.totalLendingFeesUsd = protocolStatsEntity.totalLendingFeesUsd.plus(usdVolume)
  userTotalsEntity.totalLendingFeesUsd = userTotalsEntity.totalLendingFeesUsd.plus(usdVolume)
  protocolStatsEntity.save()
  userTotalsEntity.save()
}

export function handlePayInterestTransfer(event: PayInterestTransferEvent): void {}

export function handlePayTradingFee(event: PayTradingFeeEvent): void {
  let entity = new PayTradingFee(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.payer = event.params.payer
  entity.token = event.params.token
  entity.loanId = event.params.loanId.toHexString()
  entity.amount = event.params.amount
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  let protocolStatsEntity = createAndReturnProtocolStats()
  let userTotalsEntity = createAndReturnUserTotals(event.params.payer)
  let usdVolume = convertToUsd(event.params.token, event.params.amount)
  protocolStatsEntity.totalTradingFeesUsd = protocolStatsEntity.totalTradingFeesUsd.plus(usdVolume)
  userTotalsEntity.totalTradingFeesUsd = userTotalsEntity.totalTradingFeesUsd.plus(usdVolume)
  protocolStatsEntity.save()
  userTotalsEntity.save()
}

export function handleSetLoanPool(event: SetLoanPoolEvent): void {
  /** This function creates a new lending pool */

  /** Context not currently working, not sure why */
  let context = new DataSourceContext()
  context.setString('underlyingAsset', event.params.underlying.toHexString())
  LoanTokenTemplate.createWithContext(event.params.loanPool, context)
  createAndReturnTransaction(event)
  createAndReturnLendingPool(event)
}

export function handleSetWrbtcToken(event: SetWrbtcTokenEvent): void {}

export function handleTrade(event: TradeEvent): void {
  let transaction = createAndReturnTransaction(event)

  let entity = new Trade(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  let loanParams: LoanStartState = {
    loanId: event.params.loanId,
    type: 'Trade',
    startTimestamp: event.block.timestamp,
    user: event.params.user,
    loanToken: event.params.loanToken,
    collateralToken: event.params.collateralToken,
    borrowedAmount: decimal.fromBigInt(event.params.borrowedAmount, 18),
    positionSize: decimal.fromBigInt(event.params.positionSize, 18),
    startRate: decimal.fromBigInt(event.params.entryPrice, 18),
  }
  createAndReturnLoan(loanParams)
  let swapEntity = Swap.load(event.transaction.hash.toHexString())
  if (swapEntity != null) {
    swapEntity.isMarginTrade = true
    swapEntity.user = null
    swapEntity.save()
  }
  entity.user = event.params.user.toHexString()
  entity.lender = event.params.lender
  entity.loanId = event.params.loanId.toHexString()
  entity.collateralToken = event.params.collateralToken.toHexString()
  entity.loanToken = event.params.loanToken.toHexString()
  /** In Collteral tokens */
  entity.positionSize = event.params.positionSize
  /** In Loan tokens */
  entity.borrowedAmount = event.params.borrowedAmount
  entity.interestRate = event.params.interestRate
  entity.settlementDate = event.params.settlementDate
  entity.entryPrice = event.params.entryPrice
  entity.entryLeverage = event.params.entryLeverage
  entity.currentLeverage = event.params.currentLeverage

  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  let protocolStatsEntity = createAndReturnProtocolStats()
  let userTotalsEntity = createAndReturnUserTotals(event.params.user)
  let usdTradeVolume = convertToUsd(event.params.collateralToken, event.params.positionSize)
  protocolStatsEntity.totalMarginTradeVolumeUsd = protocolStatsEntity.totalMarginTradeVolumeUsd.plus(usdTradeVolume)
  userTotalsEntity.totalMarginTradeVolumeUsd = userTotalsEntity.totalMarginTradeVolumeUsd.plus(usdTradeVolume)
  protocolStatsEntity.save()
  userTotalsEntity.save()
}
