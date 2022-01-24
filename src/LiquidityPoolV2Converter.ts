import {
  DynamicFeeFactorUpdate as DynamicFeeFactorUpdateEvent,
  LiquidityAdded as LiquidityAddedEvent,
  LiquidityRemoved as LiquidityRemovedEvent,
  Activation as ActivationEvent,
  Conversion as ConversionEvent,
  TokenRateUpdate as TokenRateUpdateEvent,
  ConversionFeeUpdate as ConversionFeeUpdateEvent,
  OwnerUpdate as OwnerUpdateEvent
} from "../generated/LiquidityPoolV2Converter/LiquidityPoolV2Converter"
import {
  DynamicFeeFactorUpdate,
  LiquidityAdded,
  LiquidityRemoved,
  Activation,
  Conversion,
  TokenRateUpdate,
  ConversionFeeUpdate,
  OwnerUpdate
} from "../generated/schema"

export function handleDynamicFeeFactorUpdate(
  event: DynamicFeeFactorUpdateEvent
): void {
  let entity = new DynamicFeeFactorUpdate(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity._prevFactor = event.params._prevFactor
  entity._newFactor = event.params._newFactor
  entity.save()
}

export function handleLiquidityAdded(event: LiquidityAddedEvent): void {
  let entity = new LiquidityAdded(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity._provider = event.params._provider
  entity._reserveToken = event.params._reserveToken
  entity._amount = event.params._amount
  entity._newBalance = event.params._newBalance
  entity._newSupply = event.params._newSupply
  entity.save()
}

export function handleLiquidityRemoved(event: LiquidityRemovedEvent): void {
  let entity = new LiquidityRemoved(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity._provider = event.params._provider
  entity._reserveToken = event.params._reserveToken
  entity._amount = event.params._amount
  entity._newBalance = event.params._newBalance
  entity._newSupply = event.params._newSupply
  entity.save()
}

export function handleActivation(event: ActivationEvent): void {
  let entity = new Activation(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity._type = event.params._type
  entity._anchor = event.params._anchor
  entity._activated = event.params._activated
  entity.save()
}

export function handleConversion(event: ConversionEvent): void {
  let entity = new Conversion(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity._fromToken = event.params._fromToken
  entity._toToken = event.params._toToken
  entity._trader = event.params._trader
  entity._amount = event.params._amount
  entity._return = event.params._return
  entity._conversionFee = event.params._conversionFee
  entity.save()
}

export function handleTokenRateUpdate(event: TokenRateUpdateEvent): void {
  let entity = new TokenRateUpdate(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity._token1 = event.params._token1
  entity._token2 = event.params._token2
  entity._rateN = event.params._rateN
  entity._rateD = event.params._rateD
  entity.save()
}

export function handleConversionFeeUpdate(
  event: ConversionFeeUpdateEvent
): void {
  let entity = new ConversionFeeUpdate(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity._prevFee = event.params._prevFee
  entity._newFee = event.params._newFee
  entity.save()
}

export function handleOwnerUpdate(event: OwnerUpdateEvent): void {
  let entity = new OwnerUpdate(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity._prevOwner = event.params._prevOwner
  entity._newOwner = event.params._newOwner
  entity.save()
}
