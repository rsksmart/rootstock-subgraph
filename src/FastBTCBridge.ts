import {
  BitcoinTransferBatchSending as BitcoinTransferBatchSendingEvent,
  BitcoinTransferStatusUpdated as BitcoinTransferStatusUpdatedEvent,
  NewBitcoinTransfer as NewBitcoinTransferEvent,
} from '../generated/FastBTCBridge/FastBTCBridge'
import { BitcoinTransferBatchSending } from '../generated/schema'
import { aggregateFastBTCBridgeStat, createFastBTCBridgeStat } from './utils/FastBTCBridgeStats'
import { BitcoinTransferStatus, createAndReturnBitcoinTransfer, loadBitcoinTransfer, satoshiToBTC } from './utils/BitcoinTransfer'

import { createAndReturnTransaction } from './utils/Transaction'
import { createAndReturnUser } from './utils/User'
import { ZERO_ADDRESS } from '@protofire/subgraph-toolkit'

export function handleBitcoinTransferBatchSending(event: BitcoinTransferBatchSendingEvent): void {
  const entity = new BitcoinTransferBatchSending(event.transaction.hash.toHex())
  entity.bitcoinTxHash = event.params.bitcoinTxHash
  entity.transferBatchSize = event.params.transferBatchSize
  const transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleBitcoinTransferStatusUpdated(event: BitcoinTransferStatusUpdatedEvent): void {
  const transaction = createAndReturnTransaction(event)

  const bitcoinTransferBatchSending = BitcoinTransferBatchSending.load(event.transaction.hash.toHex())

  const bitcoinTransfer = loadBitcoinTransfer(event.params.transferId)
  bitcoinTransfer.status = BitcoinTransferStatus.getStatus(event.params.newStatus)
  const txHash = bitcoinTransferBatchSending != null ? bitcoinTransferBatchSending.bitcoinTxHash.toHexString() : bitcoinTransfer.bitcoinTxHash
  /** Remove the 0x prefix from btc transcation hash */
  const txHashWithoutPrefix = txHash !== null && txHash.slice(0, 2) === '0x' ? txHash.slice(2, txHash.length - 1) : txHash
  bitcoinTransfer.bitcoinTxHash = txHashWithoutPrefix
  bitcoinTransfer.updatedAtBlockNumber = event.block.number.toI32()
  bitcoinTransfer.updatedAtTimestamp = event.block.timestamp.toI32()
  bitcoinTransfer.updatedAtTx = event.transaction.hash.toHex()
  bitcoinTransfer.save()

  aggregateFastBTCBridgeStat('0', event.params.newStatus, bitcoinTransfer, transaction)
  aggregateFastBTCBridgeStat(bitcoinTransfer.user, event.params.newStatus, bitcoinTransfer, transaction)
}

export function handleNewBitcoinTransfer(event: NewBitcoinTransferEvent): void {
  const transaction = createAndReturnTransaction(event)
  createAndReturnUser(event.params.rskAddress, event.block.timestamp)
  const bitcoinTransfer = createAndReturnBitcoinTransfer({
    event: event,
    transferId: event.params.transferId.toHexString(),
    btcAddress: event.params.btcAddress,
    direction: 'OUTGOING',
    amountBTC: satoshiToBTC(event.params.amountSatoshi),
    feeBTC: satoshiToBTC(event.params.feeSatoshi),
    totalAmountBTC: satoshiToBTC(event.params.amountSatoshi.plus(event.params.feeSatoshi)),
    user: event.params.rskAddress.toHexString(),
    status: BitcoinTransferStatus.getStatus(1),
    bitcoinTxHash: ZERO_ADDRESS,
    nonce: event.params.nonce.toI32(),
  })

  const FastBTCBridgeStat = createFastBTCBridgeStat('0', transaction)
  FastBTCBridgeStat.totalAmountBTCInitialized = FastBTCBridgeStat.totalAmountBTCInitialized.plus(bitcoinTransfer.totalAmountBTC)
  FastBTCBridgeStat.updatedAtTx = transaction.id
  FastBTCBridgeStat.save()

  const FastBTCBridgeTraderStat = createFastBTCBridgeStat(event.params.rskAddress.toHex(), transaction)
  FastBTCBridgeTraderStat.totalAmountBTCInitialized = FastBTCBridgeTraderStat.totalAmountBTCInitialized.plus(bitcoinTransfer.totalAmountBTC)
  FastBTCBridgeTraderStat.updatedAtTx = transaction.id
  FastBTCBridgeTraderStat.save()
}
