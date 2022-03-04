import { ConverterRegistry } from '../../generated/schema'
import { Address, BigInt } from '@graphprotocol/graph-ts'

export function createAndReturnConverterRegistry(address: Address): ConverterRegistry {
  let converterRegistryEntity = ConverterRegistry.load(address.toHex())
  if (converterRegistryEntity == null) {
    converterRegistryEntity = new ConverterRegistry(address.toHex())
    converterRegistryEntity.numConverters = BigInt.zero()
    converterRegistryEntity.save()
  }
  return converterRegistryEntity
}
