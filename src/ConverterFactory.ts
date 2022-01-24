import { NewConverter as NewConverterEvent, OwnerUpdate as OwnerUpdateEvent } from '../generated/ConverterFactory/ConverterFactory'
import { NewConverter, OwnerUpdate } from '../generated/schema'
import { LiquidityPoolV1Converter, LiquidityPoolV2Converter } from '../generated/templates'
import { loadTransaction } from './utils/Transaction'

export function handleNewConverter(event: NewConverterEvent): void {
  let entity = new NewConverter(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._type = event.params._type
  entity._converter = event.params._converter
  entity._owner = event.params._owner

  let transaction = loadTransaction(event)
  entity.transaction = transaction.id

  if (entity._type == 2) {
    /** Create V2 liquidity pool */
    LiquidityPoolV2Converter.create(event.params._converter)
  } else if (entity._type == 1) {
    /** Create V1 liquidity pool */
    LiquidityPoolV1Converter.create(event.params._converter)
  }

  entity.save()
}

export function handleOwnerUpdate(event: OwnerUpdateEvent): void {
  let entity = new OwnerUpdate(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._prevOwner = event.params._prevOwner
  entity._newOwner = event.params._newOwner
  entity.save()
}
