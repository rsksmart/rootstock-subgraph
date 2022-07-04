import { BigDecimal } from '@graphprotocol/graph-ts'
import { BitcoinTransferStatus } from './BitcoinTransfer'
import { FastBTCBridgeStat, BitcoinTransfer, Transaction } from '../../generated/schema'

export const createFastBTCBridgeStat = (id: string, transaction: Transaction): FastBTCBridgeStat => {
  let fastBTCBridgeStat = FastBTCBridgeStat.load(id)
  if (fastBTCBridgeStat == null) {
    fastBTCBridgeStat = new FastBTCBridgeStat(id)
    fastBTCBridgeStat.user = id
    fastBTCBridgeStat.totalAmountBTCInitialized = BigDecimal.zero()
    fastBTCBridgeStat.totalAmountBTCSending = BigDecimal.zero()
    fastBTCBridgeStat.totalAmountBTCMined = BigDecimal.zero()
    fastBTCBridgeStat.totalFeesBTC = BigDecimal.zero()
    fastBTCBridgeStat.totalAmountBTCRefunded = BigDecimal.zero()
    fastBTCBridgeStat.createdAtTx = transaction.id
  }
  fastBTCBridgeStat.updatedAtTx = transaction.id
  fastBTCBridgeStat.save()
  return fastBTCBridgeStat
}

export function aggregateFastBTCBridgeStat(id: string, status: i32, bitcoinTransfer: BitcoinTransfer, transaction: Transaction): void {
  const fastBTCBridgeStat = createFastBTCBridgeStat(id, transaction)
  if (BitcoinTransferStatus.getStatus(status) == BitcoinTransferStatus.SENDING) {
    fastBTCBridgeStat.totalAmountBTCInitialized = fastBTCBridgeStat.totalAmountBTCInitialized.minus(bitcoinTransfer.totalAmountBTC)
    fastBTCBridgeStat.totalAmountBTCSending = fastBTCBridgeStat.totalAmountBTCSending.plus(bitcoinTransfer.totalAmountBTC)
  }

  if (BitcoinTransferStatus.getStatus(status) == BitcoinTransferStatus.MINED) {
    fastBTCBridgeStat.totalAmountBTCSending = fastBTCBridgeStat.totalAmountBTCSending.minus(bitcoinTransfer.totalAmountBTC)
    fastBTCBridgeStat.totalAmountBTCMined = fastBTCBridgeStat.totalAmountBTCMined.plus(bitcoinTransfer.totalAmountBTC)
    fastBTCBridgeStat.totalFeesBTC = fastBTCBridgeStat.totalFeesBTC.plus(bitcoinTransfer.feeBTC)
  }

  if (BitcoinTransferStatus.getStatus(status) == BitcoinTransferStatus.REFUNDED) {
    fastBTCBridgeStat.totalAmountBTCSending = fastBTCBridgeStat.totalAmountBTCSending.minus(bitcoinTransfer.totalAmountBTC)
    fastBTCBridgeStat.totalAmountBTCMined = fastBTCBridgeStat.totalAmountBTCRefunded.plus(bitcoinTransfer.totalAmountBTC)
  }

  fastBTCBridgeStat.updatedAtTx = transaction.id
  fastBTCBridgeStat.save()
}
