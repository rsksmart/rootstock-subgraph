import { Burn as BurnEvent, FlashBorrow as FlashBorrowEvent, Mint as MintEvent } from '../generated/templates/LoanTokenLogicStandard/LoanTokenLogicStandard'
import { Burn, FlashBorrow, Mint, UserLendingHistory, LendingHistoryItem } from '../generated/schema'
import { loadTransaction } from './utils/Transaction'
import { createAndReturnUser } from './utils/User'
import { Address, BigInt, dataSource } from '@graphprotocol/graph-ts'
import { createAndReturnProtocolStats, createAndReturnUserTotals } from './utils/ProtocolStats'
import { convertToUsd } from './utils/Prices'

export function handleBurn(event: BurnEvent): void {
  let context = dataSource.context()
  let underlyingAsset = context.getString('underlyingAsset')
  let entity = new Burn(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  createAndReturnUser(event.params.burner)
  const userAddress = event.params.burner.toHexString()
  entity.user = userAddress
  entity.tokenAmount = event.params.tokenAmount
  entity.assetAmount = event.params.assetAmount
  entity.loanToken = event.address.toHexString()
  entity.price = event.params.price
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  let userHistoryEntity = UserLendingHistory.load(userAddress + dataSource.address().toHexString())
  if (userHistoryEntity != null) {
    userHistoryEntity.totalUnlendVolume = userHistoryEntity.totalUnlendVolume.plus(event.params.assetAmount)
    userHistoryEntity.save()
  }

  let lendingHistoryItem = new LendingHistoryItem(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  lendingHistoryItem.userLendingHistory = userAddress + dataSource.address().toHexString()
  lendingHistoryItem.lender = userAddress
  lendingHistoryItem.type = 'UnLend'
  lendingHistoryItem.transaction = event.transaction.hash.toHexString()
  lendingHistoryItem.emittedBy = dataSource.address().toHexString()
  lendingHistoryItem.lendingPool = dataSource.address().toHexString()
  if (underlyingAsset != null) {
    lendingHistoryItem.asset = underlyingAsset
  }
  lendingHistoryItem.amount = entity.assetAmount
  lendingHistoryItem.loanTokenAmount = entity.tokenAmount
  lendingHistoryItem.save()

  let protocolStatsEntity = createAndReturnProtocolStats()
  let userTotalsEntity = createAndReturnUserTotals(event.params.burner)
  let usdVolume = convertToUsd(Address.fromString(underlyingAsset), event.params.assetAmount)
  protocolStatsEntity.totalUnlendVolumeUsd = protocolStatsEntity.totalUnlendVolumeUsd.plus(usdVolume)
  userTotalsEntity.totalUnlendVolumeUsd = userTotalsEntity.totalUnlendVolumeUsd.plus(usdVolume)
  protocolStatsEntity.save()
  userTotalsEntity.save()
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
  let context = dataSource.context()
  let underlyingAsset = context.getString('underlyingAsset')
  let entity = new Mint(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  createAndReturnUser(event.params.minter)
  const userAddress = event.params.minter.toHexString()
  entity.user = event.params.minter.toHexString()
  entity.tokenAmount = event.params.tokenAmount
  entity.assetAmount = event.params.assetAmount
  entity.loanToken = event.address.toHexString()
  entity.price = event.params.price
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  let userHistoryEntity = UserLendingHistory.load(userAddress + dataSource.address().toHexString())
  if (userHistoryEntity != null) {
    userHistoryEntity.totalLendVolume = userHistoryEntity.totalLendVolume.plus(event.params.assetAmount)
    userHistoryEntity.save()
  } else {
    userHistoryEntity = new UserLendingHistory(userAddress + dataSource.address().toHexString())
    userHistoryEntity.user = userAddress
    userHistoryEntity.lendingPool = dataSource.address().toHexString()
    userHistoryEntity.totalLendVolume = event.params.assetAmount
    userHistoryEntity.totalUnlendVolume = BigInt.zero()
    userHistoryEntity.save()
  }

  let lendingHistoryItem = new LendingHistoryItem(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  lendingHistoryItem.userLendingHistory = userAddress + dataSource.address().toHexString()
  lendingHistoryItem.lender = userAddress
  lendingHistoryItem.type = 'Lend'
  lendingHistoryItem.transaction = event.transaction.hash.toHexString()
  lendingHistoryItem.emittedBy = dataSource.address().toHexString()
  lendingHistoryItem.lendingPool = dataSource.address().toHexString()
  if (underlyingAsset != null) {
    lendingHistoryItem.asset = underlyingAsset
  }
  lendingHistoryItem.amount = entity.assetAmount
  lendingHistoryItem.loanTokenAmount = entity.tokenAmount
  lendingHistoryItem.save()

  let protocolStatsEntity = createAndReturnProtocolStats()
  let userTotalsEntity = createAndReturnUserTotals(event.params.minter)
  let usdVolume = convertToUsd(Address.fromString(underlyingAsset), event.params.assetAmount)
  protocolStatsEntity.totalLendVolumeUsd = protocolStatsEntity.totalLendVolumeUsd.plus(usdVolume)
  userTotalsEntity.totalLendVolumeUsd = userTotalsEntity.totalLendVolumeUsd.plus(usdVolume)
  protocolStatsEntity.save()
  userTotalsEntity.save()
}
