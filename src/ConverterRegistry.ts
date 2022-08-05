import { SmartTokenAdded as SmartTokenAddedEvent, SmartTokenRemoved as SmartTokenRemovedEvent } from '../generated/ConverterRegistry/ConverterRegistry'
import { LiquidityPool, ConverterRegistry, SmartToken } from '../generated/schema'
import { createAndReturnSmartToken } from './utils/SmartToken'
import { createAndReturnConverterRegistry } from './utils/ConverterRegistry'

export function handleSmartTokenAdded(event: SmartTokenAddedEvent): void {
  createAndReturnConverterRegistry(event.address)
  const smartTokenAddress = event.params._smartToken
  const smartTokenObj = createAndReturnSmartToken(smartTokenAddress)
  const smartTokenEntity = smartTokenObj.smartToken

  smartTokenEntity.addedToRegistryBlockNumber = event.block.number.toI32()
  smartTokenEntity.addedToRegistryTransactionHash = event.transaction.hash

  smartTokenEntity.currentConverterRegistry = event.address.toHexString()
  smartTokenEntity.save()

  const liquidityPoolEntity = LiquidityPool.load(smartTokenEntity.owner)
  if (liquidityPoolEntity !== null) {
    liquidityPoolEntity.currentConverterRegistry = event.address.toHexString()
    liquidityPoolEntity.save()

    const registry = ConverterRegistry.load(event.address.toHexString())
    if (registry !== null) {
      registry.numConverters = registry.numConverters + 1
      registry.save()
    }
  }
}

export function handleSmartTokenRemoved(event: SmartTokenRemovedEvent): void {
  const smartTokenEntity = SmartToken.load(event.params._smartToken.toHexString())
  if (smartTokenEntity !== null) {
    const registry = ConverterRegistry.load(event.address.toHexString())
    if (registry !== null) {
      registry.numConverters = registry.numConverters - 1
      registry.save()
    }
    smartTokenEntity.currentConverterRegistry = null
    smartTokenEntity.save()
    const liquidityPoolEntity = LiquidityPool.load(smartTokenEntity.owner)
    if (liquidityPoolEntity !== null) {
      liquidityPoolEntity.activated = false
      liquidityPoolEntity.save()
    }
  }
}
