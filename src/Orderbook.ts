import { OrderCreated as OrderCreatedEvent } from '../generated/OrderbookTestnet/Orderbook'
import { OrderCreated } from '../generated/schema'
import { createAndReturnTransaction } from './utils/Transaction'
import { orderbookMainnet } from './contracts/contracts'

export function handleOrderCreated(event: OrderCreatedEvent): void {
  const entity = new OrderCreated(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.network = event.address.toHexString() === orderbookMainnet.toLowerCase() ? 'Mainnet' : 'Testnet'
  entity.hash = event.params.hash
  entity.order_maker = event.params.order.maker
  entity.order_fromToken = event.params.order.fromToken
  entity.order_toToken = event.params.order.toToken
  entity.order_amountIn = event.params.order.amountIn
  entity.order_amountOutMin = event.params.order.amountOutMin
  entity.order_recipient = event.params.order.recipient
  entity.order_deadline = event.params.order.deadline
  entity.order_created = event.params.order.created
  entity.limitPrice = event.params.limitPrice
  const transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}
