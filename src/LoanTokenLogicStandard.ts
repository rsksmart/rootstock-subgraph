import { Burn as BurnEvent, FlashBorrow as FlashBorrowEvent, Mint as MintEvent } from '../generated/templates/LoanTokenLogicStandard/LoanTokenLogicStandard'
import { UserLendingHistory, LendingHistoryItem, LendingPool } from '../generated/schema'
import { createAndReturnTransaction } from './utils/Transaction'
import { createAndReturnUser } from './utils/User'
import { Address, BigInt, dataSource } from '@graphprotocol/graph-ts'
import { createAndReturnProtocolStats, createAndReturnUserTotals } from './utils/ProtocolStats'
import { convertToUsd } from './utils/Prices'
import { LendingHistoryType } from './utils/types'

export function handleBurn(event: BurnEvent): void {
  let context = dataSource.context()
  let underlyingAsset = context.getString('underlyingAsset')
  createAndReturnUser(event.params.burner)
  const userAddress = event.params.burner.toHexString()
  createAndReturnTransaction(event)

  let userHistoryEntity = UserLendingHistory.load(userAddress + dataSource.address().toHexString())
  if (userHistoryEntity != null) {
    userHistoryEntity.totalUnlendVolume = userHistoryEntity.totalUnlendVolume.plus(event.params.assetAmount)
    userHistoryEntity.save()
  }

  let lendingHistoryItem = new LendingHistoryItem(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  lendingHistoryItem.userLendingHistory = userAddress + dataSource.address().toHexString()
  lendingHistoryItem.lender = userAddress
  lendingHistoryItem.type = LendingHistoryType.UnLend
  lendingHistoryItem.transaction = event.transaction.hash.toHexString()
  lendingHistoryItem.emittedBy = dataSource.address().toHexString()
  lendingHistoryItem.lendingPool = dataSource.address().toHexString()
  if (underlyingAsset != null) {
    lendingHistoryItem.asset = underlyingAsset
  }
  lendingHistoryItem.amount = event.params.assetAmount
  lendingHistoryItem.loanTokenAmount = event.params.tokenAmount
  lendingHistoryItem.save()

  let lendingPoolEntity = LendingPool.load(event.address.toHexString())
  if (lendingPoolEntity != null) {
    lendingPoolEntity.poolTokenBalance = lendingPoolEntity.poolTokenBalance.minus(event.params.tokenAmount)
    lendingPoolEntity.assetBalance = lendingPoolEntity.assetBalance.minus(event.params.assetAmount)
    lendingPoolEntity.save()
  }

  let protocolStatsEntity = createAndReturnProtocolStats()
  let userTotalsEntity = createAndReturnUserTotals(event.params.burner)
  let usdVolume = convertToUsd(Address.fromString(underlyingAsset), event.params.assetAmount)
  protocolStatsEntity.totalUnlendVolumeUsd = protocolStatsEntity.totalUnlendVolumeUsd.plus(usdVolume)
  userTotalsEntity.totalUnlendVolumeUsd = userTotalsEntity.totalUnlendVolumeUsd.plus(usdVolume)
  protocolStatsEntity.save()
  userTotalsEntity.save()
}

export function handleFlashBorrow(event: FlashBorrowEvent): void {}

export function handleMint(event: MintEvent): void {
  let context = dataSource.context()
  let underlyingAsset = context.getString('underlyingAsset')
  createAndReturnUser(event.params.minter)
  const userAddress = event.params.minter.toHexString()
  createAndReturnTransaction(event)

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
  lendingHistoryItem.type = LendingHistoryType.Lend
  lendingHistoryItem.transaction = event.transaction.hash.toHexString()
  lendingHistoryItem.emittedBy = dataSource.address().toHexString()
  lendingHistoryItem.lendingPool = dataSource.address().toHexString()
  if (underlyingAsset != null) {
    lendingHistoryItem.asset = underlyingAsset
  }
  lendingHistoryItem.amount = event.params.assetAmount
  lendingHistoryItem.loanTokenAmount = event.params.tokenAmount
  lendingHistoryItem.save()

  let lendingPoolEntity = LendingPool.load(event.address.toHexString())
  if (lendingPoolEntity != null) {
    lendingPoolEntity.poolTokenBalance = lendingPoolEntity.poolTokenBalance.plus(event.params.tokenAmount)
    lendingPoolEntity.assetBalance = lendingPoolEntity.assetBalance.plus(event.params.assetAmount)
    lendingPoolEntity.totalAssetLent = lendingPoolEntity.totalAssetLent.plus(event.params.assetAmount)
    lendingPoolEntity.save()
  }

  let protocolStatsEntity = createAndReturnProtocolStats()
  let userTotalsEntity = createAndReturnUserTotals(event.params.minter)
  let usdVolume = convertToUsd(Address.fromString(underlyingAsset), event.params.assetAmount)
  protocolStatsEntity.totalLendVolumeUsd = protocolStatsEntity.totalLendVolumeUsd.plus(usdVolume)
  userTotalsEntity.totalLendVolumeUsd = userTotalsEntity.totalLendVolumeUsd.plus(usdVolume)
  protocolStatsEntity.save()
  userTotalsEntity.save()
}
