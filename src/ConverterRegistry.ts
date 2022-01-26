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
import { SmartToken as SmartTokenContract } from '../generated/ConverterRegistry/SmartToken'

import { loadTransaction } from './utils/Transaction'

export function handleConverterAnchorAdded(event: ConverterAnchorAddedEvent): void {
  let entity = new ConverterAnchorAdded(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._anchor = event.params._anchor
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleConverterAnchorRemoved(event: ConverterAnchorRemovedEvent): void {
  let entity = new ConverterAnchorRemoved(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._anchor = event.params._anchor
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleLiquidityPoolAdded(event: LiquidityPoolAddedEvent): void {
  let entity = new LiquidityPoolAdded(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._liquidityPool = event.params._liquidityPool
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
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
  let entity = new ConvertibleTokenAdded(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._convertibleToken = event.params._convertibleToken
  entity._smartToken = event.params._smartToken
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  /**
   * Get smart token owner
   */

  let smartTokenContract = SmartTokenContract.bind(event.params._smartToken)
  let smartTokenOwnerResult = smartTokenContract.try_owner()

  if (!smartTokenOwnerResult.reverted) {
    let liquidityPool = LiquidityPool.load(smartTokenOwnerResult.value.toHex())
    if (liquidityPool != null) {
      const smartToken = event.params._smartToken
      const convertibleToken = event.params._convertibleToken.toHex()
      let existingSmartTokens = liquidityPool.smartToken ? liquidityPool.smartToken : [smartToken]

      /** Check whether to add smart tokens and underlying assets to liquidity pool */
      const addSmartToken = existingSmartTokens != null && !existingSmartTokens.includes(smartToken)

      if (addSmartToken && existingSmartTokens != null && existingSmartTokens != []) {
        liquidityPool.smartToken = existingSmartTokens.concat([smartToken])
      } else {
        liquidityPool.smartToken = existingSmartTokens
      }

      liquidityPool.save()
    }
  }
}

export function handleConvertibleTokenRemoved(event: ConvertibleTokenRemovedEvent): void {
  let entity = new ConvertibleTokenRemoved(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._convertibleToken = event.params._convertibleToken
  entity._smartToken = event.params._smartToken
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleSmartTokenAdded(event: SmartTokenAddedEvent): void {
  let entity = new SmartTokenAdded(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._smartToken = event.params._smartToken
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  /**
   * 1. Create SmartToken contract
   * 2. Add SmartToken to liquidity pool
   * 3. Add UnderlyingToken to liquidity pool
   */
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

export function handleOwnerUpdate(event: OwnerUpdateEvent): void {
  let entity = new OwnerUpdate(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._prevOwner = event.params._prevOwner
  entity._newOwner = event.params._newOwner
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.save()
}
