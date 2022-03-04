import { Address, BigDecimal, log } from '@graphprotocol/graph-ts'
import { Token, LiquidityPoolToken, TokenSmartToken } from '../../generated/schema'
import { ERC20 as ERC20TokenContract } from '../../generated/templates/ERC20/ERC20'
import { createAndReturnProtocolStats } from './ProtocolStats'

export function createAndReturnToken(tokenAddress: Address, converterAddress: Address, smartTokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHex())
  let isNewToken = false
  if (token === null) {
    isNewToken = true
    token = new Token(tokenAddress.toHex())
    token.lastPriceUsd = BigDecimal.zero()
    token.lastPriceBtc = BigDecimal.zero()
    token.btcVolume = BigDecimal.zero()
    token.usdVolume = BigDecimal.zero()
    token.tokenVolume = BigDecimal.zero()

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

  if (isNewToken == true) {
    log.debug('TOKEN IS NEW, ADDING TO PROTOCOL STATS', [])
    let protocolStats = createAndReturnProtocolStats()
    protocolStats.tokens = protocolStats.tokens.concat([tokenAddress.toHexString()])
    protocolStats.save()
  }

  return token
}
