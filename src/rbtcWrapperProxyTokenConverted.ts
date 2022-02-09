import { Address, ethereum } from '@graphprotocol/graph-ts'
import { TokenConverted as TokenConvertedEvent } from '../generated/rbtcWrapperProxyTokenConverted/rbtcWrapperProxyTokenConverted'
import { Swap, TokenConverted } from '../generated/schema'
import { loadTransaction } from './utils/Transaction'
import { rbtcWrapperProxyTokenConverted as rbtcWrapperProxyTemplate } from '../generated/templates'

export function handleTokenConverted(event: TokenConvertedEvent): void {
  let entity = new TokenConverted(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  let swapEntity = Swap.load(event.transaction.hash.toHexString())
  if (swapEntity != null) {
    swapEntity.user = event.params._beneficiary.toHexString()
    swapEntity.save()
  }
}

/** The original wrapper proxy contract will generate new data sources with new addresses when the address changes */
/** TODO: Take out hard-coded addresses and move to a config file */
export function handleBlock(block: ethereum.Block): void {
  let blockNumber = block.number.toString()
  const newWrapperProxyContracts = [
    '0xFFB9470e0B11aAC25a331D8E6Df557Db6c3c0c53',
    '0x106f117Af68586A994234E208c29DE0f1A764C60',
    '0x2C468f9c82C20c37cd1606Cf3a09702f94910691',
    '0x6b1a4735b1E25ccE9406B2d5D7417cE53d1cf90e',
  ]
  const changeBlocks = ['1729783', '1748059', '1834540', '1839810']
  if (changeBlocks.includes(blockNumber)) {
    const index = changeBlocks.indexOf(blockNumber)
    const newAddress = newWrapperProxyContracts[index].toLowerCase()
    rbtcWrapperProxyTemplate.create(Address.fromString(newAddress))
  }
}
