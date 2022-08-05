import { BigDecimal } from '@graphprotocol/graph-ts'
import { SmartToken, LiquidityPool } from '../generated/schema'
import { OwnerUpdate as OwnerUpdateEvent } from '../generated/templates/SmartToken/SmartToken'

export function handleOwnerUpdate(event: OwnerUpdateEvent): void {
  const smartTokenEntity = SmartToken.load(event.address.toHexString())
  const oldConverterEntity = LiquidityPool.load(event.params._prevOwner.toHexString())
  const newConverterEntity = LiquidityPool.load(event.params._newOwner.toHexString())

  /** Trying to create a liquidity pool here always throws an error on the converterType method. I don't know why. */

  if (smartTokenEntity != null) {
    smartTokenEntity.owner = event.params._newOwner.toHexString()
    smartTokenEntity.save()
  }

  if (oldConverterEntity !== null && newConverterEntity !== null) {
    const registry = oldConverterEntity.currentConverterRegistry
    const token0Balance = oldConverterEntity.token0Balance
    const token1Balance = oldConverterEntity.token1Balance

    newConverterEntity.currentConverterRegistry = registry
    newConverterEntity.smartToken = event.address.toHexString()

    newConverterEntity.token0Balance = token0Balance
    oldConverterEntity.token0Balance = BigDecimal.zero()

    newConverterEntity.token1Balance = token1Balance
    oldConverterEntity.token1Balance = BigDecimal.zero()

    oldConverterEntity.currentConverterRegistry = null
    oldConverterEntity.smartToken = null
    oldConverterEntity.activated = false

    newConverterEntity.save()
    oldConverterEntity.save()
  }
}
