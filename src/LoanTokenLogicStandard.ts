import { Burn as BurnEvent, FlashBorrow as FlashBorrowEvent, Mint as MintEvent } from '../generated/templates/LoanTokenLogicStandard/LoanTokenLogicStandard'
import { Burn, FlashBorrow, Mint } from '../generated/schema'
// import { dataSource, log } from '@graphprotocol/graph-ts'
import { loadTransaction } from './utils/Transaction'
import { createAndReturnUser } from './utils/User'

export function handleBurn(event: BurnEvent): void {
  // let context = dataSource.context()
  // let underlyingAsset = context.getString('underlyingAsset')
  let entity = new Burn(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  let user = createAndReturnUser(event.params.burner)
  entity.user = user.id
  entity.tokenAmount = event.params.tokenAmount
  entity.assetAmount = event.params.assetAmount
  entity.loanToken = event.address.toHexString()
  entity.price = event.params.price
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleFlashBorrow(event: FlashBorrowEvent): void {
  // let context = dataSource.context()
  let entity = new FlashBorrow(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  let user = createAndReturnUser(event.params.borrower)
  entity.user = user.id
  entity.target = event.params.target
  entity.loanToken = event.params.loanToken.toHexString()
  entity.loanAmount = event.params.loanAmount
  entity.loanToken = event.address.toHexString()
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleMint(event: MintEvent): void {
  // let context = dataSource.context()
  // let underlyingAsset = context.get('underlyingAsset')
  let entity = new Mint(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  let user = createAndReturnUser(event.params.minter)
  entity.user = user.id
  entity.tokenAmount = event.params.tokenAmount
  entity.assetAmount = event.params.assetAmount
  entity.loanToken = event.address.toHexString()
  entity.price = event.params.price
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}
