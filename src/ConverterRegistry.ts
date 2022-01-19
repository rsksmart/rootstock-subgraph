import {
  ConverterAnchorAdded as ConverterAnchorAddedEvent,
  ConverterAnchorRemoved as ConverterAnchorRemovedEvent,
  LiquidityPoolAdded as LiquidityPoolAddedEvent,
  LiquidityPoolRemoved as LiquidityPoolRemovedEvent,
  ConvertibleTokenAdded as ConvertibleTokenAddedEvent,
  ConvertibleTokenRemoved as ConvertibleTokenRemovedEvent,
  SmartTokenAdded as SmartTokenAddedEvent,
  SmartTokenRemoved as SmartTokenRemovedEvent,
  OwnerUpdate as OwnerUpdateEvent,
} from '../generated/ConverterRegistry/ConverterRegistry'
import {
  ConverterAnchorAdded,
  ConverterAnchorRemoved,
  LiquidityPoolAdded,
  LiquidityPoolRemoved,
  ConvertibleTokenAdded,
  ConvertibleTokenRemoved,
  SmartTokenAdded,
  SmartTokenRemoved,
  OwnerUpdate,
  LiquidityPool,
} from '../generated/schema'

export function handleConverterAnchorAdded(event: ConverterAnchorAddedEvent): void {
  let entity = new ConverterAnchorAdded(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._anchor = event.params._anchor
  entity.save()
}

export function handleConverterAnchorRemoved(event: ConverterAnchorRemovedEvent): void {
  let entity = new ConverterAnchorRemoved(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._anchor = event.params._anchor
  entity.save()
}

export function handleLiquidityPoolAdded(event: LiquidityPoolAddedEvent): void {
  let entity = new LiquidityPoolAdded(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._liquidityPool = event.params._liquidityPool
  entity.save()

  /**
   * Add a new LiquiditiyPool Entity
   */

  let liquidityPool = new LiquidityPool(entity._liquidityPool.toString())
  liquidityPool.save()
}

export function handleLiquidityPoolRemoved(event: LiquidityPoolRemovedEvent): void {
  let entity = new LiquidityPoolRemoved(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._liquidityPool = event.params._liquidityPool
  entity.save()
}

export function handleConvertibleTokenAdded(event: ConvertibleTokenAddedEvent): void {
  let entity = new ConvertibleTokenAdded(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._convertibleToken = event.params._convertibleToken
  entity._smartToken = event.params._smartToken
  entity.save()
}

export function handleConvertibleTokenRemoved(event: ConvertibleTokenRemovedEvent): void {
  let entity = new ConvertibleTokenRemoved(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._convertibleToken = event.params._convertibleToken
  entity._smartToken = event.params._smartToken
  entity.save()
}

export function handleSmartTokenAdded(event: SmartTokenAddedEvent): void {
  let entity = new SmartTokenAdded(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._smartToken = event.params._smartToken
  entity.save()
}

export function handleSmartTokenRemoved(event: SmartTokenRemovedEvent): void {
  let entity = new SmartTokenRemoved(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._smartToken = event.params._smartToken
  entity.save()
}

export function handleOwnerUpdate(event: OwnerUpdateEvent): void {
  let entity = new OwnerUpdate(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._prevOwner = event.params._prevOwner
  entity._newOwner = event.params._newOwner
  entity.save()
}
