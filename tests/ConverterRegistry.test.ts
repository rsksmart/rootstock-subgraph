import { clearStore, test, assert } from 'matchstick-as/assembly/index'
import { LiquidityPoolAdded as LiquidityPoolAddedSchema } from '../generated/schema'
import { Address, Bytes, ethereum, log } from '@graphprotocol/graph-ts'
// import { LiquidityPoolAdded } from '../../generated/ConverterRegistry/ConverterRegistry'
// import { handleLiquidityPoolAdded } from '../ConverterRegistry'

log.info('RUNNING THIS FILE (CONVERTER)', [])

test('Saving a new liquidity pool', () => {
  const txHash = '0x0087b4e9d9ca7ad9fb9a098b959c0451a9852db1873261f5fa8537f704d7f83d'
  const logIndex = 5
  const addressString = '0x70d228bc14fa78304ca05db387dfd7f50a90cbe2'
  const poolAddress = Address.fromString(addressString)
  let liquidityPool = new LiquidityPoolAddedSchema(txHash + logIndex.toString())
  liquidityPool._liquidityPool = poolAddress
  liquidityPool.save()
  assert.fieldEquals('LiquidityPoolAdded', txHash + logIndex.toString(), '_liquidityPool', addressString)

  clearStore()
})
