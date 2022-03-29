import { NewConverter as NewConverterEvent, OwnerUpdate as OwnerUpdateEvent } from '../generated/ConverterFactory/ConverterFactory'
import { NewConverter } from '../generated/schema'

import { createAndReturnTransaction } from './utils/Transaction'
import { createAndReturnLiquidityPool } from './utils/LiquidityPool'

export function handleNewConverter(event: NewConverterEvent): void {
  let entity = new NewConverter(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._type = event.params._type
  entity._converter = event.params._converter
  entity._owner = event.params._owner
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp

  entity.save()

  /**
   * Create new LiquidityPool
   */
  createAndReturnLiquidityPool(event.params._converter, event.block.timestamp, event.block.number, event.transaction.hash.toHexString())
}

export function handleOwnerUpdate(event: OwnerUpdateEvent): void {}
