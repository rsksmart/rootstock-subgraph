import { Address } from '@graphprotocol/graph-ts'
import { Token as TokenEntity } from '../../generated/schema'
import { ERC20 as ERC20Token } from '../../generated/templates/ERC20/ERC20'

export function createAndReturnToken(tokenAddress: Address): TokenEntity {
  let id = tokenAddress.toHexString()
  let token = TokenEntity.load(id)
  if (token == null) {
    let tokenContract = ERC20Token.bind(tokenAddress)
    let nameResult = tokenContract.try_name()
    let symbolResult = tokenContract.try_symbol()
    let decimalsResult = tokenContract.try_decimals()

    token = new TokenEntity(id)
    token.name = nameResult.reverted ? '' : nameResult.value
    token.symbol = symbolResult.reverted ? '' : symbolResult.value
    token.decimals = decimalsResult.reverted ? 0 : decimalsResult.value
  }
  token.save()
  return token
}
