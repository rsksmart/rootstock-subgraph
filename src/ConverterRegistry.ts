import { log, BigInt, Address } from '@graphprotocol/graph-ts'
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

import { SmartToken as SmartTokenContract } from '../generated/ConverterRegistry/SmartToken'
import { LiquidityPoolV1Converter as LiquidityPoolV1ConverterContract } from '../generated/ConverterRegistry/LiquidityPoolV1Converter'

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
  Token,
  SmartToken,
  LiquidityPoolV1Converter,
  ConverterRegistry,
  LiquidityPoolToken,
  TokenSmartToken,
} from '../generated/schema'

import {
  SmartToken as SmartTokenTemplate,
  LiquidityPoolV1Converter as LiquidityPoolV1ConverterTemplate,
  ERC20Token as ERC20TokenTemplate,
} from '../generated/templates'

import { getToken } from './helpers/getToken'
import { getSmartToken } from './helpers/getSmartToken'
import { getLiquiditypool } from './helpers/getLiquiditypool'

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

  log.debug('Convertible token removed from registry: {}', [event.params._convertibleToken.toHex()])
  let token = getToken(event.params._convertibleToken, event.address, event.params._smartToken)
  token.currentConverterRegistry = null
  token.save()
}

export function handleSmartTokenAdded(event: SmartTokenAddedEvent): void {
  let smartTokenAddress = event.params._smartToken
  let smartTokenObj = getSmartToken(smartTokenAddress)

  const isNew = smartTokenObj.isNew
  const smartTokenEntity = smartTokenObj.smartToken
  if (isNew) {
    log.debug('Smart Token created: {}', [smartTokenAddress.toHex()])
  }

  let smartTokenContract = SmartTokenContract.bind(smartTokenAddress)

  if (smartTokenEntity.addedToRegistryBlockNumber === null) {
    smartTokenEntity.addedToRegistryBlockNumber = event.block.number
    smartTokenEntity.addedToRegistryTransactionHash = event.transaction.hash
  }

  log.debug('Smart Token added to registry: {}', [smartTokenAddress.toHex()])

  let converterAddress = smartTokenContract.owner()
  log.debug('Converter address: {}', [converterAddress.toHex()])
  let converterObj = getLiquiditypool(converterAddress)
  let converterEntity = converterObj.liquidityPoolV1Converter

  let converterContract = LiquidityPoolV1ConverterContract.bind(converterAddress)

  let converterConnectorTokenCountResult = converterContract.try_connectorTokenCount()

  if (!converterConnectorTokenCountResult.reverted) {
    let numConnectorTokens = converterConnectorTokenCountResult.value
    for (let i = 0; i < numConnectorTokens; i++) {
      let connectorTokenResult = converterContract.try_connectorTokens(BigInt.fromI32(i))
      if (!connectorTokenResult.reverted) {
        let connectorTokenAddress = connectorTokenResult.value

        let connectorTokenEntity = getToken(connectorTokenAddress, converterAddress, smartTokenAddress)

        // log.debug('Connector Token Converters: {}', [connectorTokenConverters.toString()])
        // connectorTokenEntity.liquidityPools = connectorTokenConverters
        connectorTokenEntity.currentConverterRegistry = event.address.toHex()
        connectorTokenEntity.save()
      }
    }
    if (converterConnectorTokenCountResult.value == 2) {
      smartTokenEntity.smartTokenType = 'Relay'
    } else {
      smartTokenEntity.smartTokenType = 'Liquid'
    }
  }

  smartTokenEntity.currentConverterRegistry = event.address.toHex()

  converterEntity.smartToken = smartTokenAddress.toHex()
  converterEntity.currentConverterRegistry = event.address.toHex()
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
  smartTokenEntity.save()
  converterEntity.save()

  let entity = new SmartTokenAdded(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._smartToken = event.params._smartToken
  entity.save()
}

export function handleSmartTokenRemoved(event: SmartTokenRemovedEvent): void {
  let entity = new SmartTokenRemoved(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._smartToken = event.params._smartToken
  entity.save()

  log.debug('Smart Token removed from registry: {}', [event.params._smartToken.toHex()])
  let smartTokenEntity = getSmartToken(event.params._smartToken).smartToken

  smartTokenEntity.currentConverterRegistry = null
  smartTokenEntity.save()

  let liquidityPoolV1Converter = getLiquiditypool(smartTokenEntity.owner as Address).liquidityPoolV1Converter
  liquidityPoolV1Converter.smartToken = null
  liquidityPoolV1Converter.save()
}

export function handleOwnerUpdate(event: OwnerUpdateEvent): void {
  let entity = new OwnerUpdate(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._prevOwner = event.params._prevOwner
  entity._newOwner = event.params._newOwner
  entity.save()

  let converterRegistryEntity = ConverterRegistry.load(event.address.toHex())
  if (converterRegistryEntity === null) {
    converterRegistryEntity = new ConverterRegistry(event.address.toHex())
  }

  converterRegistryEntity.owner = event.params._newOwner
  converterRegistryEntity.save()
}
