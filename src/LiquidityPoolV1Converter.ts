import {
  PriceDataUpdate as PriceDataUpdateEvent,
  LiquidityAdded as LiquidityAddedEvent,
  LiquidityRemoved as LiquidityRemovedEvent,
  Activation as ActivationEvent,
  Conversion as ConversionEvent,
  TokenRateUpdate as TokenRateUpdateEvent,
  ConversionFeeUpdate as ConversionFeeUpdateEvent,
  WithdrawFees as WithdrawFeesEvent,
  OwnerUpdate as OwnerUpdateEvent,
} from '../generated/LiquidityPoolV1Converter/LiquidityPoolV1Converter'
import {
  PriceDataUpdate,
  LiquidityAdded,
  LiquidityRemoved,
  Activation,
  Conversion,
  TokenRateUpdate,
  ConversionFeeUpdate,
  WithdrawFees,
  OwnerUpdate,
} from '../generated/schema'
import { createSwap } from './utils/Swap'
import { createAndReturnToken } from './utils/Token'

import { loadTransaction } from './utils/Transaction'

export function handlePriceDataUpdate(event: PriceDataUpdateEvent): void {
  let entity = new PriceDataUpdate(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._connectorToken = event.params._connectorToken
  entity._tokenSupply = event.params._tokenSupply
  entity._connectorBalance = event.params._connectorBalance
  entity._connectorWeight = event.params._connectorWeight
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleLiquidityAdded(event: LiquidityAddedEvent): void {
  let entity = new LiquidityAdded(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._provider = event.params._provider
  entity._reserveToken = event.params._reserveToken
  entity._amount = event.params._amount
  entity._newBalance = event.params._newBalance
  entity._newSupply = event.params._newSupply
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleLiquidityRemoved(event: LiquidityRemovedEvent): void {
  let entity = new LiquidityRemoved(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._provider = event.params._provider
  entity._reserveToken = event.params._reserveToken
  entity._amount = event.params._amount
  entity._newBalance = event.params._newBalance
  entity._newSupply = event.params._newSupply
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleActivation(event: ActivationEvent): void {
  let entity = new Activation(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._type = event.params._type
  entity._anchor = event.params._anchor
  entity._activated = event.params._activated
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleConversion(event: ConversionEvent): void {
  createAndReturnToken(event.params._fromToken)
  createAndReturnToken(event.params._toToken)

  let entity = new Conversion(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._fromToken = event.params._fromToken
  entity._toToken = event.params._toToken
  entity._trader = event.params._trader
  entity._amount = event.params._amount
  entity._return = event.params._return
  entity._conversionFee = event.params._conversionFee
  entity._protocolFee = event.params._protocolFee
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address

  entity.save()

  /** create a Swap entity from this event */
  createSwap(event)
}

export function handleTokenRateUpdate(event: TokenRateUpdateEvent): void {
  let entity = new TokenRateUpdate(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._token1 = event.params._token1
  entity._token2 = event.params._token2
  entity._rateN = event.params._rateN
  entity._rateD = event.params._rateD
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleConversionFeeUpdate(event: ConversionFeeUpdateEvent): void {
  let entity = new ConversionFeeUpdate(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._prevFee = event.params._prevFee
  entity._newFee = event.params._newFee
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleWithdrawFees(event: WithdrawFeesEvent): void {
  let entity = new WithdrawFees(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.sender = event.params.sender
  entity.receiver = event.params.receiver
  entity.token = event.params.token
  entity.protocolFeeAmount = event.params.protocolFeeAmount
  entity.wRBTCConverted = event.params.wRBTCConverted
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleOwnerUpdate(event: OwnerUpdateEvent): void {
  let entity = new OwnerUpdate(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._prevOwner = event.params._prevOwner
  entity._newOwner = event.params._newOwner
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}
