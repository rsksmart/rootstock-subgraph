import { NewConverter as NewConverterEvent, OwnerUpdate as OwnerUpdateEvent } from '../generated/ConverterFactory/ConverterFactory'
import { NewConverter, ConverterRegistry } from '../generated/schema'

import { loadTransaction } from './utils/Transaction'
import { BigInt } from '@graphprotocol/graph-ts'
import { createAndReturnLiquidityPool } from './utils/LiquidityPool'

export function handleNewConverter(event: NewConverterEvent): void {
  let entity = new NewConverter(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._type = event.params._type
  entity._converter = event.params._converter
  entity._owner = event.params._owner
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp

  entity.save()
  /**
   * Create new ConverterRegistry
   */

  let converterRegistryEntity = ConverterRegistry.load(event.address.toHex())
  if (converterRegistryEntity == null) {
    converterRegistryEntity = new ConverterRegistry(event.address.toHex())
    converterRegistryEntity.numConverters = BigInt.zero()
  }
  converterRegistryEntity.lastUsedAtBlockTimestamp = event.block.timestamp
  converterRegistryEntity.lastUsedAtTransactionHash = event.transaction.hash.toHex()
  converterRegistryEntity.lastUsedAtBlockNumber = event.block.number
  converterRegistryEntity.numConverters = converterRegistryEntity.numConverters.plus(BigInt.fromI32(1))

  /**
   * Create new LiquidityPool
   */
  createAndReturnLiquidityPool(event.params._converter, event.params._type)

  converterRegistryEntity.save()
}
