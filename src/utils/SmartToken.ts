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

    /** This is commented out to speed up the subgraph syncing */
    // SmartTokenTemplate.create(smartTokenAddress)
    // log.debug('Smart Token created: {}', [smartTokenAddress.toHex()])

    let smartTokenContract = SmartTokenContract.bind(smartTokenAddress)
    let smartTokenNameResult = smartTokenContract.try_name()
    if (!smartTokenNameResult.reverted) {
      smartToken.name = smartTokenNameResult.value
    }
    let smartTokenSymbolResult = smartTokenContract.try_symbol()
    if (!smartTokenSymbolResult.reverted) {
      smartToken.symbol = smartTokenSymbolResult.value
    }
    let smartTokenDecimalsResult = smartTokenContract.try_decimals()
    if (!smartTokenDecimalsResult.reverted) {
      smartToken.decimals = smartTokenDecimalsResult.value
    }

    let converterAddress = smartTokenContract.owner()
    log.debug('Converter address: {}', [converterAddress.toHex()])
    smartToken.owner = converterAddress
  }

  smartToken.save()

  return { smartToken, isNew }
}
