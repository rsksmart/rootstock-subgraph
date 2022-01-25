import { Conversion as ConversionEventV1 } from '../../generated/LiquidityPoolV1Converter/LiquidityPoolV1Converter'
import { Conversion as ConversionEventV2 } from '../../generated/LiquidityPoolV1Converter/LiquidityPoolV1Converter'
import { Swap, User, LiquidityPool } from '../../generated/schema'

export function createSwap(event: ConversionEventV1): void {
  /**
   * 1. Check if Swap entity with Tx hash already exists
   * 2. If not, create it
   * 3. If it does, add this Conversion event to Conversion array
   */

  let userEntity = User.load(event.transaction.from.toHex())
  let swapEntity = Swap.load(event.transaction.hash.toHex())

  /** Create user entity */
  if (userEntity == null) {
    userEntity = new User(event.transaction.from.toHex())
    userEntity.numSwaps = 1
  } else if (userEntity != null && swapEntity == null) {
    userEntity.numSwaps = userEntity.numSwaps + 1
  }

  /** Create swap  */
  if (swapEntity == null) {
    swapEntity = new Swap(event.transaction.hash.toHex())
    swapEntity.ammConversionEvents = [event.transaction.hash.toHex() + '-' + event.logIndex.toString()]
    swapEntity.fromToken = event.params._fromToken
    swapEntity.toToken = event.params._toToken
    swapEntity.fromAmount = event.params._amount
    swapEntity.toAmount = event.params._return
    swapEntity.rate = event.params._amount.div(event.params._return) // TODO: Change this to proper decimal division using token decimals
    swapEntity.user = userEntity.id
    swapEntity.isMarginTrade = false
    swapEntity.isBorrow = false
    swapEntity.timestamp = event.block.timestamp
  }

  /** Swap already exists - this means it has multiple conversion events */
  if (swapEntity != null && swapEntity.ammConversionEvents != null) {
    const existingEvents = swapEntity.ammConversionEvents
    if (existingEvents != null && existingEvents != [] && existingEvents.length > 0) {
      swapEntity.ammConversionEvents = existingEvents.concat([event.transaction.hash.toHex() + '-' + event.logIndex.toString()])
    } else if (existingEvents == []) {
      swapEntity.ammConversionEvents = [event.transaction.hash.toHex() + '-' + event.logIndex.toString()]
    }
    swapEntity.toToken = event.params._toToken
    swapEntity.toAmount = event.params._return
    swapEntity.rate = event.params._amount.div(event.params._return)
  }

  if (userEntity != null && userEntity.swaps == null) {
    userEntity.swaps = [event.transaction.hash.toHex()]
  } else if (userEntity != null && userEntity.swaps != null && userEntity.swaps != []) {
    const existingSwaps = userEntity.swaps
    if (existingSwaps != null && existingSwaps != [] && existingSwaps.length > 0) {
      swapEntity.ammConversionEvents = existingSwaps.concat([event.transaction.hash.toHex()])
    }
  }

  swapEntity.save()
  userEntity.save()
}
