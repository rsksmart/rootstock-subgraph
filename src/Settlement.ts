import {
  Deposit as DepositEvent,
  MarginOrderCanceled as MarginOrderCanceledEvent,
  MarginOrderFilled as MarginOrderFilledEvent,
  OrderCanceled as OrderCanceledEvent,
  OrderFilled as OrderFilledEvent,
  Withdrawal as WithdrawalEvent,
} from '../generated/Settlement/Settlement'
import { Deposit, MarginOrderCanceled, MarginOrderFilled, OrderCanceled, OrderFilled, Withdrawal, Trade, Swap } from '../generated/schema'

import { createAndReturnTransaction } from './utils/Transaction'
import { createAndReturnUser } from './utils/User'

export function handleDeposit(event: DepositEvent): void {
  let entity = new Deposit(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.to = event.params.to
  entity.amount = event.params.amount
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleMarginOrderCanceled(event: MarginOrderCanceledEvent): void {
  let entity = new MarginOrderCanceled(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.hash = event.params.hash
  entity.trader = event.params.trader
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleMarginOrderFilled(event: MarginOrderFilledEvent): void {
  let entity = new MarginOrderFilled(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.hash = event.params.hash
  createAndReturnUser(event.params.trader, event.block.timestamp)
  entity.trader = event.params.trader.toHexString()
  entity.principal = event.params.principal
  entity.collateral = event.params.collateral
  entity.leverageAmount = event.params.leverageAmount
  entity.loanTokenAddress = event.params.loanTokenAddress
  entity.loanTokenSent = event.params.loanTokenSent
  entity.collateralTokenSent = event.params.collateralTokenSent
  entity.collateralTokenAddress = event.params.collateralTokenAddress
  entity.filledPrice = event.params.filledPrice
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  /** TODO: Load Trade entity and set isLimit to true */
}

export function handleOrderCanceled(event: OrderCanceledEvent): void {
  let entity = new OrderCanceled(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.hash = event.params.hash
  entity.maker = event.params.maker
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleOrderFilled(event: OrderFilledEvent): void {
  let entity = new OrderFilled(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.hash = event.params.hash
  createAndReturnUser(event.params.maker, event.block.timestamp)
  entity.maker = event.params.maker.toHexString()
  entity.amountIn = event.params.amountIn
  entity.amountOut = event.params.amountOut
  entity.path = event.params.path.map<string>((item) => item.toHexString())
  entity.filledPrice = event.params.filledPrice
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  /** Load Swap entity and set isLimit to true */
  let swapEntity = Swap.load(event.transaction.hash.toHex())
  if (swapEntity != null) {
    swapEntity.user = event.params.maker.toHexString()
    swapEntity.isLimit = true
    swapEntity.save()
  }
}

export function handleWithdrawal(event: WithdrawalEvent): void {
  let entity = new Withdrawal(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.receiver = event.params.receiver
  entity.amount = event.params.amount
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}
