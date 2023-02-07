import { NewBitcoinTransferIncoming as NewBitcoinTransferIncomingEvent } from '../generated/ManagedWallet/ManagedWallet'
import { BitcoinTransfer, NewBitcoinTransferIncoming } from '../generated/schema'
import { BigInt } from '@graphprotocol/graph-ts'
import { createAndReturnTransaction } from './utils/Transaction'
import { decimal, DEFAULT_DECIMALS } from '@protofire/subgraph-toolkit'
import { createAndReturnUser } from './utils/User'

export function handleNewBitcoinTransferIncoming(event: NewBitcoinTransferIncomingEvent): void {
  const entity = new NewBitcoinTransferIncoming(event.transaction.hash.toHexString().concat(event.logIndex.toHexString()))
  entity.rskAddress = event.params.rskAddress
  entity.amountWei = event.params.amountWei
  entity.feeWei = event.params.feeWei
  entity.btcTxHash = event.params.btcTxHash
  entity.btcTxVout = event.params.btcTxVout

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  const transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = BigInt.fromI32(transaction.timestamp)
  entity.emittedBy = event.address
  entity.save()
  createAndReturnTransaction(event)
  createAndReturnUser(event.params.rskAddress, event.block.timestamp)
  const bitcoinTransfer = new BitcoinTransfer(event.transaction.hash.toHexString().concat(event.logIndex.toHexString()))
  bitcoinTransfer.amountBTC = decimal.fromBigInt(event.params.amountWei, DEFAULT_DECIMALS)
  bitcoinTransfer.feeBTC = decimal.fromBigInt(event.params.feeWei, DEFAULT_DECIMALS)
  bitcoinTransfer.totalAmountBTC = bitcoinTransfer.amountBTC.plus(bitcoinTransfer.feeBTC)
  bitcoinTransfer.user = event.params.rskAddress.toHexString()
  bitcoinTransfer.status = 'MINED'
  bitcoinTransfer.direction = 'INCOMING'
  bitcoinTransfer.bitcoinTxHash = event.params.btcTxHash
  bitcoinTransfer.createdAtTimestamp = event.block.timestamp.toI32()
  bitcoinTransfer.createdAtBlockNumber = event.block.number.toI32()
  bitcoinTransfer.updatedAtTimestamp = event.block.timestamp.toI32()
  bitcoinTransfer.createdAtTx = event.transaction.hash.toHexString()
  bitcoinTransfer.updatedAtTimestamp = event.block.timestamp.toI32()
  bitcoinTransfer.updatedAtBlockNumber = event.block.number.toI32()
  bitcoinTransfer.updatedAtTx = event.transaction.hash.toHexString()
  bitcoinTransfer.save()
}
