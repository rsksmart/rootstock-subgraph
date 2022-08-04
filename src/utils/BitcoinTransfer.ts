import { BigDecimal, Bytes, BigInt } from '@graphprotocol/graph-ts'
import { decimal } from '@protofire/subgraph-toolkit'
import { NewBitcoinTransfer as NewBitcoinTransferEvent } from '../../generated/FastBTCBridge/FastBTCBridge'
import { BitcoinTransfer } from '../../generated/schema'
import { createAndReturnTransaction } from './Transaction'
import { createAndReturnUser } from './User'

const BTC_DECIMAL = 8

export class BitcoinTransferStatus {
  static NOT_APPLICABLE: string = 'NOT_APPLICABLE'
  static NEW: string = 'NEW'
  static SENDING: string = 'SENDING'
  static MINED: string = 'MINED'
  static REFUNDED: string = 'REFUNDED'
  static RECLAIMED: string = 'RECLAIMED'
  static getStatus(value: i32): string {
    const arr = ['NOT_APPLICABLE', 'NEW', 'SENDING', 'MINED', 'REFUNDED', 'RECLAIMED']
    return arr[value]
  }
}

export const createBitcoinTransfer = (event: NewBitcoinTransferEvent): BitcoinTransfer => {
  createAndReturnTransaction(event)
  let bitcoinTransfer = BitcoinTransfer.load(event.params.transferId.toHex())
  if (bitcoinTransfer == null) {
    bitcoinTransfer = new BitcoinTransfer(event.params.transferId.toHex())
    bitcoinTransfer.btcAddress = event.params.btcAddress
    bitcoinTransfer.nonce = event.params.nonce.toI32()
    bitcoinTransfer.amountBTC = satoshiToBTC(event.params.amountSatoshi)
    bitcoinTransfer.feeBTC = satoshiToBTC(event.params.feeSatoshi)
    bitcoinTransfer.totalAmountBTC = satoshiToBTC(event.params.amountSatoshi.plus(event.params.feeSatoshi))
    createAndReturnUser(event.params.rskAddress, event.block.timestamp)
    bitcoinTransfer.user = event.params.rskAddress.toHex()
    bitcoinTransfer.status = BitcoinTransferStatus.getStatus(1)
    bitcoinTransfer.createdAtTimestamp = event.block.timestamp.toI32()
    bitcoinTransfer.createdAtBlockNumber = event.block.number.toI32()
    bitcoinTransfer.createdAtTx = event.transaction.hash.toHex()
    bitcoinTransfer.updatedAtTimestamp = event.block.timestamp.toI32()
    bitcoinTransfer.updatedAtBlockNumber = event.block.number.toI32()
    bitcoinTransfer.updatedAtTx = event.transaction.hash.toHex()
  }
  bitcoinTransfer.save()
  return bitcoinTransfer
}

export const loadBitcoinTransfer = (transferId: Bytes): BitcoinTransfer => {
  let bitcoinTransfer = BitcoinTransfer.load(transferId.toHex())
  if (bitcoinTransfer == null) {
    bitcoinTransfer = new BitcoinTransfer(transferId.toHex())
  }
  return bitcoinTransfer
}

export function satoshiToBTC(satoshi: BigInt): BigDecimal {
  return decimal.fromBigInt(satoshi, BTC_DECIMAL)
}
