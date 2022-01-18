import { clearStore, test, assert } from 'matchstick-as/assembly/index'
import { LiquidityPoolAdded as LiquidityPoolAddedSchema } from '../generated/schema'
import { log } from '@graphprotocol/graph-ts'
// import { LiquidityPoolAdded } from '../../generated/ConverterRegistry/ConverterRegistry'
// import { handleLiquidityPoolAdded } from '../ConverterRegistry'

log.info('RUNNING THIS FILE (CONVERTER)', [])

test('Testing the test function', () => {
  log.info('Running this test...', [])
  let liquidityPool = new LiquidityPoolAddedSchema('0x70d228bc14fa78304ca05db387dfd7f50a90cbe2')
  liquidityPool.save()
  assert.fieldEquals('LiquidityPoolAdded', '0x70d228bc14fa78304ca05db387dfd7f50a90cbe2', '_liquidityPool', '0x70d228bc14fa78304ca05db387dfd7f50a90cbe2')

  clearStore()
})
