import { Address, log } from '@graphprotocol/graph-ts'
import { Token, LiquidityPoolToken, TokenSmartToken } from '../../generated/schema'
import { ERC20 as ERC20TokenContract } from '../../generated/templates/ERC20/ERC20'

export function createAndReturnToken(tokenAddress: Address, converterAddress: Address, smartTokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHex())
  if (token === null) {
    token = new Token(tokenAddress.toHex())
    log.debug('Token created: {}', [smartTokenAddress.toHex()])
    const tokenContract = ERC20TokenContract.bind(tokenAddress)
    let connectorTokenNameResult = tokenContract.try_name()
    if (!connectorTokenNameResult.reverted) {
      token.name = connectorTokenNameResult.value
    }
    let connectorTokenSymbolResult = tokenContract.try_symbol()
    if (!connectorTokenSymbolResult.reverted) {
      token.symbol = connectorTokenSymbolResult.value
    }
    let connectorTokenDecimalsResult = tokenContract.try_decimals()
    if (!connectorTokenDecimalsResult.reverted) {
      token.decimals = connectorTokenDecimalsResult.value
    }
  }
  let liquidityPoolToken = LiquidityPoolToken.load(converterAddress.toHex() + tokenAddress.toHex())
  if (liquidityPoolToken === null) {
    liquidityPoolToken = new LiquidityPoolToken(converterAddress.toHex() + tokenAddress.toHex())
  }

  liquidityPoolToken.token = tokenAddress.toHex()
  liquidityPoolToken.liquidityPool = converterAddress.toHex()
  liquidityPoolToken.save()

  let tokenSmartToken = TokenSmartToken.load(tokenAddress.toHex() + smartTokenAddress.toHex())
  if (tokenSmartToken === null) {
    tokenSmartToken = new TokenSmartToken(tokenAddress.toHex() + smartTokenAddress.toHex())
  }

  tokenSmartToken.token = tokenAddress.toHex()
  tokenSmartToken.smartToken = smartTokenAddress.toHex()
  tokenSmartToken.save()
  token.save()

  return token
}
