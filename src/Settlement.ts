import {
  Deposit as DepositEvent,
  MarginOrderCanceled as MarginOrderCanceledEvent,
  MarginOrderFilled as MarginOrderFilledEvent,
  OrderCanceled as OrderCanceledEvent,
  OrderFilled as OrderFilledEvent,
  Withdrawal as WithdrawalEvent,
} from '../generated/Settlement/Settlement'
import { MarginOrderCanceled, MarginOrderFilled, OrderCanceled, OrderFilled, Withdrawal, Swap, Deposit } from '../generated/schema'
import { decimal, DEFAULT_DECIMALS } from '@protofire/subgraph-toolkit'
import { decimalize } from './utils/Token'

import { createAndReturnTransaction } from './utils/Transaction'
import { createAndReturnUser } from './utils/User'

export function handleDeposit(event: DepositEvent): void {
  const entity = new Deposit(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.to = event.params.to
  entity.amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
  const transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleMarginOrderCanceled(event: MarginOrderCanceledEvent): void {
  const entity = new MarginOrderCanceled(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.hash = event.params.hash
  entity.trader = event.params.trader
  const transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleMarginOrderFilled(event: MarginOrderFilledEvent): void {
  const entity = new MarginOrderFilled(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.hash = event.params.hash
  createAndReturnUser(event.params.trader, event.block.timestamp)
  entity.trader = event.params.trader.toHexString()
  entity.principal = decimal.fromBigInt(event.params.principal, DEFAULT_DECIMALS)
  entity.collateral = decimal.fromBigInt(event.params.collateral, DEFAULT_DECIMALS)
  entity.leverageAmount = decimal.fromBigInt(event.params.leverageAmount, DEFAULT_DECIMALS)
  entity.loanTokenAddress = event.params.loanTokenAddress
  entity.loanTokenSent = decimal.fromBigInt(event.params.loanTokenSent, DEFAULT_DECIMALS)
  entity.collateralTokenSent = decimal.fromBigInt(event.params.collateralTokenSent, DEFAULT_DECIMALS)
  entity.collateralTokenAddress = event.params.collateralTokenAddress
  entity.filledPrice = decimal.fromBigInt(event.params.filledPrice, DEFAULT_DECIMALS)
  const transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  /** TODO: Load Trade entity and set isLimit to true */
}

export function handleOrderCanceled(event: OrderCanceledEvent): void {
  const entity = new OrderCanceled(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.hash = event.params.hash
  entity.maker = event.params.maker
  const transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleOrderFilled(event: OrderFilledEvent): void {
  createAndReturnUser(event.params.maker, event.block.timestamp)
  const fromToken = event.params.path[0]
  const toToken = event.params.path[event.params.path.length - 1]

  const entity = new OrderFilled(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.hash = event.params.hash
  entity.maker = event.params.maker.toHexString()
  entity.amountIn = decimalize(event.params.amountIn, fromToken)
  entity.amountOut = decimalize(event.params.amountOut, toToken)
  entity.path = event.params.path.map<string>((item) => item.toHexString())
  entity.filledPrice = decimalize(event.params.filledPrice, toToken)
  const transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  /** Load Swap entity and set isLimit to true */
  const swapEntity = Swap.load(event.transaction.hash.toHex())
  if (swapEntity != null) {
    swapEntity.user = event.params.maker.toHexString()
    swapEntity.isLimit = true
    swapEntity.save()
  }
}

export function handleWithdrawal(event: WithdrawalEvent): void {
  const entity = new Withdrawal(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.receiver = event.params.receiver
  entity.amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
  const transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}
