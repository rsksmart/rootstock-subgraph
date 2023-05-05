import { Conversion } from '../../generated/schema'
import { IConversionEvent } from '../LiquidityPoolConverter'

export function createAndReturnConversion(event: IConversionEvent): Conversion {
  const entity = new Conversion(event.transaction.id + '-' + event.logIndex.toString())
  entity._fromToken = event.fromToken.id
  entity._toToken = event.toToken.id
  entity._trader = event.trader
  entity._amount = event.fromAmount
  entity._return = event.toAmount
  entity._conversionFee = event.conversionFee
  entity._protocolFee = event.protocolFee
  entity.transaction = event.transaction.id
  entity.timestamp = event.transaction.timestamp
  entity.emittedBy = event.liquidityPool.id
  entity.blockNumber = event.transaction.blockNumber
  entity.save()
  return entity
}
