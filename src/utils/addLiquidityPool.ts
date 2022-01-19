import { LiquidityPool } from '../../generated/schema'
import { Bytes, Address } from '@graphprotocol/graph-ts'
import { log } from 'matchstick-as'
import { LiquidityPoolV2Converter, LiquidityPoolV1Converter } from '../../generated/templates'

export function addLiquidityPool(address: Address): void {
  let liquidityPool = LiquidityPool.load(address.toString())
  if (liquidityPool != null) {
    log.warning('Converter already exists {}', [address.toString()])
  }
  if (liquidityPool == null) {
    LiquidityPoolV1Converter.create(address)
    const newPool = new LiquidityPool(address.toString())
    newPool.save()
    let loadPool = LiquidityPool.load(address.toString())
    if (loadPool != null) {
      log.info('pool loaded: ', [loadPool.id])
    }
  }
}
