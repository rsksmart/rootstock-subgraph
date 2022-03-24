import { Address, BigInt } from '@graphprotocol/graph-ts'
import { LiquidityPool } from '../../generated/schema'
import { LiquidityPoolV1Converter as LiquidityPoolV1ConverterContract } from '../../generated/templates/LiquidityPoolV1Converter/LiquidityPoolV1Converter'
import { LiquidityPoolV2Converter as LiquidityPoolV2ConverterContract } from '../../generated/templates/LiquidityPoolV2Converter/LiquidityPoolV2Converter'
import { LiquidityPoolV1ConverterProtocolFee as LiquidityPoolV1ConverterContract_V2 } from '../../generated/templates/LiquidityPoolV1ConverterProtocolFee/LiquidityPoolV1ConverterProtocolFee'
import {
  LiquidityPoolV1Converter as LiquidityPoolV1ConverterTemplate,
  LiquidityPoolV2Converter as LiquidityPoolV2ConverterTemplate,
  LiquidityPoolV1ConverterProtocolFee as LiquidityPoolV1ConverterTemplate_V2,
} from '../../generated/templates'
import { version2Block } from '../blockNumbers/blockNumbers'

export class IGetLiquidityPool {
  liquidityPool: LiquidityPool
  isNew: boolean
}

export function createAndReturnLiquidityPool(
  converterAddress: Address,
  createdAtTimestamp: BigInt,
  createdAtBlockNumber: BigInt,
  createdAtTransaction: string
): IGetLiquidityPool {
  let isNew = false
  let liquidityPool = LiquidityPool.load(converterAddress.toHex())
  if (liquidityPool === null) {
    liquidityPool = new LiquidityPool(converterAddress.toHex())
    const type = getPoolType(converterAddress)
    liquidityPool.activated = false
    if (type === 1 && createdAtBlockNumber <= version2Block) {
      LiquidityPoolV1ConverterTemplate.create(converterAddress)
      liquidityPool.type = 1
      let converterContract = LiquidityPoolV1ConverterContract.bind(converterAddress)
      let converterOwnerResult = converterContract.try_owner()
      if (!converterOwnerResult.reverted) {
        liquidityPool.owner = converterOwnerResult.value.toHex()
      }
      let converterMaxConversionFeeResult = converterContract.try_maxConversionFee()
      if (!converterMaxConversionFeeResult.reverted) {
        liquidityPool.maxConversionFee = converterMaxConversionFeeResult.value
      }
      let conversionFee = converterContract.try_conversionFee()
      if (!conversionFee.reverted) {
        liquidityPool.conversionFee = conversionFee.value
      }
    } else if (type === 1 && createdAtBlockNumber > version2Block) {
      LiquidityPoolV1ConverterTemplate_V2.create(converterAddress)
      liquidityPool.type = 1
      let converterContract = LiquidityPoolV1ConverterContract_V2.bind(converterAddress)
      let converterOwnerResult = converterContract.try_owner()
      if (!converterOwnerResult.reverted) {
        liquidityPool.owner = converterOwnerResult.value.toHex()
      }
      let converterMaxConversionFeeResult = converterContract.try_maxConversionFee()
      if (!converterMaxConversionFeeResult.reverted) {
        liquidityPool.maxConversionFee = converterMaxConversionFeeResult.value
      }
      let conversionFee = converterContract.try_conversionFee()
      if (!conversionFee.reverted) {
        liquidityPool.conversionFee = conversionFee.value
      }
    } else if (type === 2) {
      LiquidityPoolV2ConverterTemplate.create(converterAddress)
      liquidityPool.type = 2
      let converterContract = LiquidityPoolV2ConverterContract.bind(converterAddress)
      let converterOwnerResult = converterContract.try_owner()
      if (!converterOwnerResult.reverted) {
        liquidityPool.owner = converterOwnerResult.value.toHex()
      }
      let converterMaxConversionFeeResult = converterContract.try_maxConversionFee()
      if (!converterMaxConversionFeeResult.reverted) {
        liquidityPool.maxConversionFee = converterMaxConversionFeeResult.value
      }
      let conversionFee = converterContract.try_conversionFee()
      if (!conversionFee.reverted) {
        liquidityPool.conversionFee = conversionFee.value
      }
    }
    liquidityPool.createdAtBlockNumber = createdAtBlockNumber
    liquidityPool.createdAtTimestamp = createdAtTimestamp
    liquidityPool.createdAtTransaction = createdAtTransaction
    liquidityPool.save()
    isNew = true
  }
  return { liquidityPool, isNew }
}

function getPoolType(address: Address): number {
  let converterContract = LiquidityPoolV1ConverterContract.bind(address)
  let converterTypeResult = converterContract.try_converterType()
  let type = -1
  if (!converterTypeResult.reverted) {
    type = converterTypeResult.value
  }

  return type
}
