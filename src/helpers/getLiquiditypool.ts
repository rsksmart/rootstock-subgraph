import { Address, log } from '@graphprotocol/graph-ts'
import { LiquidityPoolV1Converter } from '../../generated/schema'
import { LiquidityPoolV1Converter as LiquidityPoolV1ConverterContract } from '../../generated/templates/LiquidityPoolV1Converter/LiquidityPoolV1Converter'
import { LiquidityPoolV1Converter as LiquidityPoolV1ConverterTemplate } from '../../generated/templates'

export class IGetLiquidityPool {
  liquidityPoolV1Converter: LiquidityPoolV1Converter
  isNew: boolean
}

export function getLiquiditypool(converterAddress: Address): IGetLiquidityPool {
  let liquidityPoolV1Converter = LiquidityPoolV1Converter.load(converterAddress.toHex())
  let isNew = false
  if (liquidityPoolV1Converter == null) {
    isNew = true
    LiquidityPoolV1ConverterTemplate.create(converterAddress)
    liquidityPoolV1Converter = new LiquidityPoolV1Converter(converterAddress.toHex())

    let converterContract = LiquidityPoolV1ConverterContract.bind(converterAddress)

    // liquidityPoolV1Converter.currentConverterRegistry = event.address.toHex()
    // let converterContractRegistryResult = converterContract.try_registry()
    // if (!converterContractRegistryResult.reverted) {
    //   log.debug('getLiquiditypool - currentContractRegistry address: {}', [converterContractRegistryResult.value.toHex()])
    //   liquidityPoolV1Converter.currentContractRegistry = converterContractRegistryResult.value.toHex()
    // }
    // let converterVersionResult = converterContract.try_version()
    // if (!converterVersionResult.reverted) {
    //   liquidityPoolV1Converter.version = converterVersionResult.value
    // }
    let converterOwnerResult = converterContract.try_owner()
    if (!converterOwnerResult.reverted) {
      liquidityPoolV1Converter.owner = converterOwnerResult.value
    }
    let converterMaxConversionFeeResult = converterContract.try_maxConversionFee()
    if (!converterMaxConversionFeeResult.reverted) {
      liquidityPoolV1Converter.maxConversionFee = converterMaxConversionFeeResult.value
    }
    let converterTypeResult = converterContract.try_converterType()
    if (!converterTypeResult.reverted) {
      liquidityPoolV1Converter.type = converterTypeResult.value
    }
  }

  liquidityPoolV1Converter.save()
  return { liquidityPoolV1Converter, isNew }
}
