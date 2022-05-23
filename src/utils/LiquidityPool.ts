import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { LiquidityPool, Token } from '../../generated/schema'
import { LiquidityPoolV1Converter as LiquidityPoolV1ConverterContract } from '../../generated/templates/LiquidityPoolV1Converter/LiquidityPoolV1Converter'
import { LiquidityPoolV2Converter as LiquidityPoolV2ConverterContract } from '../../generated/templates/LiquidityPoolV2Converter/LiquidityPoolV2Converter'
import { LiquidityPoolV1ConverterProtocolFee as LiquidityPoolV1ConverterContract_V2 } from '../../generated/templates/LiquidityPoolV1ConverterProtocolFee/LiquidityPoolV1ConverterProtocolFee'
import {
  LiquidityPoolV1Converter as LiquidityPoolV1ConverterTemplate,
  LiquidityPoolV2Converter as LiquidityPoolV2ConverterTemplate,
  LiquidityPoolV1ConverterProtocolFee as LiquidityPoolV1ConverterTemplate_V2,
} from '../../generated/templates'
import { ConversionEventForSwap } from './Swap'
import { decimalize } from './Token'
import { decimal } from '@protofire/subgraph-toolkit'
import { WRBTCAddress } from '../contracts/contracts'

export class IGetLiquidityPool {
  liquidityPool: LiquidityPool
  isNew: boolean
}

export function createAndReturnLiquidityPool(
  converterAddress: Address,
  createdAtTimestamp: BigInt,
  createdAtBlockNumber: BigInt,
  createdAtTransaction: string,
): IGetLiquidityPool {
  let isNew = false
  let liquidityPool = LiquidityPool.load(converterAddress.toHex())
  /** To see if a contract was deployed with the fee split abi, try to call the protocolFeeTokensHeld method
   * If it is reverted, use old abi
   */
  if (liquidityPool === null) {
    liquidityPool = new LiquidityPool(converterAddress.toHex())
    const type = getPoolType(converterAddress)
    liquidityPool.activated = false
    if (type === 1) {
      const isFeeSplit = isFeeSplitAbi(converterAddress)
      if (!isFeeSplit) {
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
      } else {
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
    liquidityPool.createdAtBlockNumber = createdAtBlockNumber.toI32()
    liquidityPool.createdAtTimestamp = createdAtTimestamp.toI32()
    liquidityPool.createdAtTransaction = createdAtTransaction
    liquidityPool.token0Balance = BigDecimal.zero()
    liquidityPool.token1Balance = BigDecimal.zero()
    liquidityPool.save()
    isNew = true
  }
  return { liquidityPool, isNew }
}

function isFeeSplitAbi(address: Address): boolean {
  let converterContract = LiquidityPoolV1ConverterContract_V2.bind(address)
  let protocolFeeTokensHeldResult = converterContract.try_protocolFeeTokensHeld(Address.fromString(WRBTCAddress))
  if (protocolFeeTokensHeldResult.reverted) {
    return false
  } else {
    return true
  }
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

export function incrementPoolBalance(liquidityPool: LiquidityPool, token: Address, amount: BigDecimal): LiquidityPool {
  if (liquidityPool.token0 == token.toHexString()) {
    liquidityPool.token0Balance = liquidityPool.token0Balance.plus(amount)
  } else if (liquidityPool.token1 == token.toHexString()) {
    liquidityPool.token1Balance = liquidityPool.token1Balance.plus(amount)
  }
  liquidityPool.save()
  return liquidityPool
}

export function decrementPoolBalance(liquidityPool: LiquidityPool, token: Address, amount: BigDecimal): LiquidityPool {
  if (liquidityPool.token0 == token.toHexString()) {
    liquidityPool.token0Balance = liquidityPool.token0Balance.minus(amount)
  } else if (liquidityPool.token1 == token.toHexString()) {
    liquidityPool.token1Balance = liquidityPool.token1Balance.minus(amount)
  }
  liquidityPool.save()
  return liquidityPool
}
