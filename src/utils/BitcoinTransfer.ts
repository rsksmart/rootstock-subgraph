import { BigDecimal, Bytes, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { decimal, ZERO_ADDRESS } from '@protofire/subgraph-toolkit'
import { BitcoinTransfer } from '../../generated/schema'

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

class BitcoinTransferParams {
  event: ethereum.Event
  transferId: string
  btcAddress: string
  direction: string
  amountBTC: BigDecimal
  feeBTC: BigDecimal
  totalAmountBTC: BigDecimal
  user: string
  status: string
  nonce: i32
  bitcoinTxHash: string
}

export const createAndReturnBitcoinTransfer = (params: BitcoinTransferParams): BitcoinTransfer => {
  let bitcoinTransfer = BitcoinTransfer.load(params.transferId)
  if (bitcoinTransfer == null) {
    bitcoinTransfer = new BitcoinTransfer(params.transferId)
    bitcoinTransfer.direction = params.direction
    bitcoinTransfer.amountBTC = params.amountBTC
    bitcoinTransfer.feeBTC = params.feeBTC
    bitcoinTransfer.totalAmountBTC = bitcoinTransfer.amountBTC.plus(bitcoinTransfer.feeBTC)
    bitcoinTransfer.user = params.user
    bitcoinTransfer.status = params.status
    bitcoinTransfer.createdAtTimestamp = params.event.block.timestamp.toI32()
    bitcoinTransfer.createdAtBlockNumber = params.event.block.number.toI32()
    bitcoinTransfer.createdAtTx = params.event.transaction.hash.toHexString()
    bitcoinTransfer.updatedAtTimestamp = params.event.block.timestamp.toI32()
    bitcoinTransfer.updatedAtBlockNumber = params.event.block.number.toI32()
    bitcoinTransfer.updatedAtTx = params.event.transaction.hash.toHexString()

    if (params.btcAddress != ZERO_ADDRESS) {
      bitcoinTransfer.btcAddress = params.btcAddress
    }
    if (params.bitcoinTxHash != ZERO_ADDRESS) {
      /** Remove the 0x prefix from btc transcation hash */
      const txHashWithoutPrefix = params.bitcoinTxHash.slice(0, 2) == '0x' ? params.bitcoinTxHash.slice(2, params.bitcoinTxHash.length) : params.bitcoinTxHash
      bitcoinTransfer.bitcoinTxHash = txHashWithoutPrefix
    }

    if (params.nonce >= 0) {
      bitcoinTransfer.nonce = params.nonce
    }

    bitcoinTransfer.save()
  }
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
