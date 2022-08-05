import { Address, log } from '@graphprotocol/graph-ts'
import { SmartToken } from '../../generated/schema'
import { SmartToken as SmartTokenContract } from '../../generated/templates/SmartToken/SmartToken'
import { SmartToken as SmartTokenTemplate } from '../../generated/templates'

export class IGetSmartToken {
  smartToken: SmartToken
  isNew: boolean
}

export function createAndReturnSmartToken(smartTokenAddress: Address): IGetSmartToken {
  let isNew = false
  let smartToken = SmartToken.load(smartTokenAddress.toHex())
  if (smartToken == null) {
    smartToken = new SmartToken(smartTokenAddress.toHex())

    isNew = true

    SmartTokenTemplate.create(smartTokenAddress)
    log.debug('Smart Token created: {}', [smartTokenAddress.toHex()])

    const smartTokenContract = SmartTokenContract.bind(smartTokenAddress)
    const smartTokenNameResult = smartTokenContract.try_name()
    if (!smartTokenNameResult.reverted) {
      smartToken.name = smartTokenNameResult.value
    }
    const smartTokenSymbolResult = smartTokenContract.try_symbol()
    if (!smartTokenSymbolResult.reverted) {
      smartToken.symbol = smartTokenSymbolResult.value
    }
    const smartTokenDecimalsResult = smartTokenContract.try_decimals()
    if (!smartTokenDecimalsResult.reverted) {
      smartToken.decimals = smartTokenDecimalsResult.value
    }

    const converterAddress = smartTokenContract.owner()
    log.debug('Converter address: {}', [converterAddress.toHex()])
    smartToken.owner = converterAddress.toHexString()
  }

  smartToken.save()

  return { smartToken, isNew }
}
