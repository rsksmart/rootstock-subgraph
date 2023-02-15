import { NewBitcoinTransferIncoming as NewBitcoinTransferIncomingEvent } from '../generated/ManagedWallet/ManagedWallet'
import { createAndReturnTransaction } from './utils/Transaction'
import { decimal, DEFAULT_DECIMALS, ZERO_ADDRESS } from '@protofire/subgraph-toolkit'
import { createAndReturnUser } from './utils/User'
import { createAndReturnBitcoinTransfer } from './utils/BitcoinTransfer'

export function handleNewBitcoinTransferIncoming(event: NewBitcoinTransferIncomingEvent): void {
  createAndReturnTransaction(event)
  createAndReturnUser(event.params.rskAddress, event.block.timestamp)
  const amountDecimals = decimal.fromBigInt(event.params.amountWei, DEFAULT_DECIMALS)
  const feeDecimals = decimal.fromBigInt(event.params.feeWei, DEFAULT_DECIMALS)
  createAndReturnBitcoinTransfer({
    event: event,
    transferId: event.transaction.hash.toHexString().concat(event.logIndex.toHexString()),
    btcAddress: ZERO_ADDRESS,
    direction: 'INCOMING',
    status: 'MINED',
    amountBTC: amountDecimals,
    feeBTC: feeDecimals,
    totalAmountBTC: amountDecimals.plus(feeDecimals),
    user: event.params.rskAddress.toHexString(),
    bitcoinTxHash: event.params.btcTxHash.toHexString(),
  })
}
