import { BigInt } from '@graphprotocol/graph-ts'

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
import { LiquidityPoolAdded, LiquidityPoolRemoved, SmartTokenAdded, SmartTokenRemoved, LiquidityPool, ConverterRegistry } from '../generated/schema'
import { SmartToken as SmartTokenContract } from '../generated/ConverterRegistry/SmartToken'
import { log } from '@graphprotocol/graph-ts'
import { loadTransaction } from './utils/Transaction'
import { createAndReturnToken } from './utils/Token'
import { createAndReturnSmartToken } from './utils/SmartToken'
import { createAndReturnLiquidityPool } from './utils/LiquidityPool'

export function handleConverterAnchorAdded(event: ConverterAnchorAddedEvent): void {}

export function handleConverterAnchorRemoved(event: ConverterAnchorRemovedEvent): void {}

export function handleLiquidityPoolAdded(event: LiquidityPoolAddedEvent): void {
  let entity = new LiquidityPoolAdded(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._liquidityPool = event.params._liquidityPool
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address

  let converterRegistryEntity = ConverterRegistry.load(event.address.toHex())
  if (converterRegistryEntity == null) {
    converterRegistryEntity = new ConverterRegistry(event.address.toHex())
    converterRegistryEntity.numConverters = BigInt.zero()
  }
  converterRegistryEntity.lastUsedAtBlockTimestamp = event.block.timestamp
  converterRegistryEntity.lastUsedAtTransactionHash = event.transaction.hash.toHex()
  converterRegistryEntity.lastUsedAtBlockNumber = event.block.number
  converterRegistryEntity.numConverters = converterRegistryEntity.numConverters.plus(BigInt.fromI32(1))

  converterRegistryEntity.save()
  entity.save()

  let liquidityPoolEntity = LiquidityPool.load(event.params._liquidityPool.toHex())
  if (liquidityPoolEntity != null) {
    liquidityPoolEntity.currentConverterRegistry = event.address.toHex()
    liquidityPoolEntity.save()
  }
}

export function handleLiquidityPoolRemoved(event: LiquidityPoolRemovedEvent): void {
  let entity = new LiquidityPoolRemoved(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._liquidityPool = event.params._liquidityPool
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleConvertibleTokenAdded(event: ConvertibleTokenAddedEvent): void {
  const smartTokenAddress = event.params._smartToken
  const smartTokenContract = SmartTokenContract.bind(smartTokenAddress)
  const converterAddress = smartTokenContract.owner()
  const token = createAndReturnToken(event.params._convertibleToken, converterAddress, smartTokenAddress)
  token.currentConverterRegistry = event.address.toHex()
  token.save()
}

export function handleConvertibleTokenRemoved(event: ConvertibleTokenRemovedEvent): void {}

export function handleSmartTokenAdded(event: SmartTokenAddedEvent): void {
  let smartTokenAddress = event.params._smartToken
  let smartTokenObj = createAndReturnSmartToken(smartTokenAddress)

  const isNew = smartTokenObj.isNew
  let smartTokenEntity = smartTokenObj.smartToken
  if (isNew) {
    log.debug('Smart Token created: {}', [smartTokenAddress.toHex()])
  }

  const smartTokenContract = SmartTokenContract.bind(smartTokenAddress)

  if (smartTokenEntity.addedToRegistryBlockNumber === null) {
    smartTokenEntity.addedToRegistryBlockNumber = event.block.number
    smartTokenEntity.addedToRegistryTransactionHash = event.transaction.hash
  }

  log.debug('Smart Token added to registry: {}', [smartTokenAddress.toHex()])

  smartTokenEntity.currentConverterRegistry = event.address.toHex()

  smartTokenEntity.save()

  const converterAddress = smartTokenContract.owner()
  let liquidityPoolEntity = LiquidityPool.load(converterAddress.toHexString())
  if (liquidityPoolEntity != null) {
    liquidityPoolEntity.currentConverterRegistry = event.address.toHex()
    liquidityPoolEntity.save()
  }

  let entity = new SmartTokenAdded(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._smartToken = event.params._smartToken
  entity.save()
}

export function handleSmartTokenRemoved(event: SmartTokenRemovedEvent): void {
  let entity = new SmartTokenRemoved(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._smartToken = event.params._smartToken
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleOwnerUpdate(event: OwnerUpdateEvent): void {}
