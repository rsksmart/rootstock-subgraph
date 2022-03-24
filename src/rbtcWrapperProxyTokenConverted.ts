import { TokenConverted as TokenConvertedEvent } from '../generated/rbtcWrapperProxyTokenConverted/rbtcWrapperProxyTokenConverted'
import { Swap, TokenConverted } from '../generated/schema'
import { loadTransaction } from './utils/Transaction'

/**
 * This event sometimes includes the user address when a Swap occurs. This is useful for updating the Swap entity with the correct user address
 */
export function handleTokenConverted(event: TokenConvertedEvent): void {
  let entity = new TokenConverted(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  let swapEntity = Swap.load(event.transaction.hash.toHexString())
  if (swapEntity != null) {
    swapEntity.user = event.params._beneficiary.toHexString()
    swapEntity.save()
  }
}
