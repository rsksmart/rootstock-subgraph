import { TokenConverted as TokenConvertedEvent } from '../generated/rbtcWrapperProxyTokenConverted/rbtcWrapperProxyTokenConverted'
import { Swap } from '../generated/schema'
import { createAndReturnTransaction } from './utils/Transaction'

/**
 * This event sometimes includes the user address when a Swap occurs. This is useful for updating the Swap entity with the correct user address
 */
export function handleTokenConverted(event: TokenConvertedEvent): void {
  createAndReturnTransaction(event)

  let swapEntity = Swap.load(event.transaction.hash.toHexString())
  if (swapEntity != null) {
    swapEntity.user = event.params._beneficiary.toHexString()
    swapEntity.save()
  }
}
