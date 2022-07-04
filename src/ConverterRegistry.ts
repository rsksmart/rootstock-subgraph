import { SmartTokenAdded as SmartTokenAddedEvent, SmartTokenRemoved as SmartTokenRemovedEvent } from '../generated/ConverterRegistry/ConverterRegistry'
import { SmartTokenAdded, LiquidityPool, ConverterRegistry, SmartToken } from '../generated/schema'
import { createAndReturnSmartToken } from './utils/SmartToken'
import { createAndReturnConverterRegistry } from './utils/ConverterRegistry'

export function handleSmartTokenAdded(event: SmartTokenAddedEvent): void {
  createAndReturnConverterRegistry(event.address)
  let smartTokenAddress = event.params._smartToken
  let smartTokenObj = createAndReturnSmartToken(smartTokenAddress)
  let smartTokenEntity = smartTokenObj.smartToken

  smartTokenEntity.addedToRegistryBlockNumber = event.block.number.toI32()
  smartTokenEntity.addedToRegistryTransactionHash = event.transaction.hash

  smartTokenEntity.currentConverterRegistry = event.address.toHexString()
  smartTokenEntity.save()

  let liquidityPoolEntity = LiquidityPool.load(smartTokenEntity.owner)
  if (liquidityPoolEntity !== null) {
    liquidityPoolEntity.currentConverterRegistry = event.address.toHexString()
    liquidityPoolEntity.save()

    let registry = ConverterRegistry.load(event.address.toHexString())
    if (registry !== null) {
      registry.numConverters = registry.numConverters + 1
      registry.save()
    }
  }

  let entity = new SmartTokenAdded(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._smartToken = event.params._smartToken
  entity.save()
}

export function handleSmartTokenRemoved(event: SmartTokenRemovedEvent): void {
  let smartTokenEntity = SmartToken.load(event.params._smartToken.toHexString())
  if (smartTokenEntity !== null) {
    let registry = ConverterRegistry.load(event.address.toHexString())
    if (registry !== null) {
      registry.numConverters = registry.numConverters - 1
      registry.save()
    }
    smartTokenEntity.currentConverterRegistry = null
    smartTokenEntity.save()
    let liquidityPoolEntity = LiquidityPool.load(smartTokenEntity.owner)
    if (liquidityPoolEntity !== null) {
      liquidityPoolEntity.activated = false
      liquidityPoolEntity.save()
    }
  }
}
