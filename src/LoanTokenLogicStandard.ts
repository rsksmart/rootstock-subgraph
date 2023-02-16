import { Burn as BurnEvent, Mint as MintEvent } from '../generated/templates/LoanTokenLogicStandard/LoanTokenLogicStandard'
import { UserLendingHistory, LendingHistoryItem, LendingPool } from '../generated/schema'
import { createAndReturnTransaction } from './utils/Transaction'
import { Address, BigDecimal, dataSource } from '@graphprotocol/graph-ts'
import { createAndReturnProtocolStats, createAndReturnUserTotals } from './utils/ProtocolStats'
import { convertToUsd } from './utils/Prices'
import { LendingHistoryType } from './utils/types'
import { decimal, DEFAULT_DECIMALS } from '@protofire/subgraph-toolkit'
import { createAndReturnUser } from './utils/User'

export function handleBurn(event: BurnEvent): void {
  createAndReturnTransaction(event)
  createAndReturnUser(event.params.burner, event.block.timestamp)

  const context = dataSource.context()
  const underlyingAsset = context.getString('underlyingAsset')
  const userAddress = event.params.burner.toHexString()

  const assetAmount = decimal.fromBigInt(event.params.assetAmount, DEFAULT_DECIMALS)
  const tokenAmount = decimal.fromBigInt(event.params.tokenAmount, DEFAULT_DECIMALS)

  const userHistoryEntity = UserLendingHistory.load(userAddress + dataSource.address().toHexString())
  if (userHistoryEntity != null) {
    userHistoryEntity.totalUnlendVolume = userHistoryEntity.totalUnlendVolume.plus(assetAmount)
    userHistoryEntity.save()
  }

  const lendingHistoryItem = new LendingHistoryItem(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  lendingHistoryItem.userLendingHistory = userAddress + dataSource.address().toHexString()
  lendingHistoryItem.lender = userAddress
  lendingHistoryItem.type = LendingHistoryType.UnLend
  lendingHistoryItem.transaction = event.transaction.hash.toHexString()
  lendingHistoryItem.emittedBy = dataSource.address().toHexString()
  lendingHistoryItem.lendingPool = dataSource.address().toHexString()
  if (underlyingAsset != null) {
    lendingHistoryItem.asset = underlyingAsset
  }
  lendingHistoryItem.amount = assetAmount
  lendingHistoryItem.loanTokenAmount = tokenAmount
  lendingHistoryItem.timestamp = event.block.timestamp.toI32()
  lendingHistoryItem.save()

  const lendingPoolEntity = LendingPool.load(event.address.toHexString())
  if (lendingPoolEntity != null) {
    lendingPoolEntity.poolTokenBalance = lendingPoolEntity.poolTokenBalance.minus(tokenAmount)
    lendingPoolEntity.assetBalance = lendingPoolEntity.assetBalance.minus(assetAmount)
    lendingPoolEntity.save()
  }

  const protocolStatsEntity = createAndReturnProtocolStats()
  const userTotalsEntity = createAndReturnUserTotals(event.params.burner)
  const usdVolume = convertToUsd(Address.fromString(underlyingAsset), event.params.assetAmount)
  protocolStatsEntity.totalUnlendVolumeUsd = protocolStatsEntity.totalUnlendVolumeUsd.plus(usdVolume)
  userTotalsEntity.totalUnlendVolumeUsd = userTotalsEntity.totalUnlendVolumeUsd.plus(usdVolume)
  protocolStatsEntity.save()
  userTotalsEntity.save()
}

export function handleMint(event: MintEvent): void {
  createAndReturnTransaction(event)
  createAndReturnUser(event.params.minter, event.block.timestamp)

  const context = dataSource.context()
  const underlyingAsset = context.getString('underlyingAsset')
  const userAddress = event.params.minter.toHexString()
  const assetAmount = decimal.fromBigInt(event.params.assetAmount, DEFAULT_DECIMALS)
  const tokenAmount = decimal.fromBigInt(event.params.tokenAmount, DEFAULT_DECIMALS)

  let userHistoryEntity = UserLendingHistory.load(userAddress + dataSource.address().toHexString())
  if (userHistoryEntity != null) {
    userHistoryEntity.totalLendVolume = userHistoryEntity.totalLendVolume.plus(assetAmount)
    userHistoryEntity.save()
  } else {
    userHistoryEntity = new UserLendingHistory(userAddress + dataSource.address().toHexString())
    userHistoryEntity.user = userAddress
    userHistoryEntity.lendingPool = dataSource.address().toHexString()
    userHistoryEntity.totalLendVolume = assetAmount
    userHistoryEntity.totalUnlendVolume = BigDecimal.zero()
    userHistoryEntity.save()
  }

  const lendingHistoryItem = new LendingHistoryItem(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  lendingHistoryItem.userLendingHistory = userAddress + dataSource.address().toHexString()
  lendingHistoryItem.lender = userAddress
  lendingHistoryItem.type = LendingHistoryType.Lend
  lendingHistoryItem.transaction = event.transaction.hash.toHexString()
  lendingHistoryItem.emittedBy = dataSource.address().toHexString()
  lendingHistoryItem.lendingPool = dataSource.address().toHexString()
  if (underlyingAsset != null) {
    lendingHistoryItem.asset = underlyingAsset
  }
  lendingHistoryItem.amount = assetAmount
  lendingHistoryItem.loanTokenAmount = tokenAmount
  lendingHistoryItem.timestamp = event.block.timestamp.toI32()
  lendingHistoryItem.save()

  const lendingPoolEntity = LendingPool.load(event.address.toHexString())
  if (lendingPoolEntity != null) {
    lendingPoolEntity.poolTokenBalance = lendingPoolEntity.poolTokenBalance.plus(tokenAmount)
    lendingPoolEntity.assetBalance = lendingPoolEntity.assetBalance.plus(assetAmount)
    lendingPoolEntity.totalAssetLent = lendingPoolEntity.totalAssetLent.plus(assetAmount)
    lendingPoolEntity.save()
  }

  const protocolStatsEntity = createAndReturnProtocolStats()
  const userTotalsEntity = createAndReturnUserTotals(event.params.minter)
  const usdVolume = convertToUsd(Address.fromString(underlyingAsset), event.params.assetAmount)
  protocolStatsEntity.totalLendVolumeUsd = protocolStatsEntity.totalLendVolumeUsd.plus(usdVolume)
  userTotalsEntity.totalLendVolumeUsd = userTotalsEntity.totalLendVolumeUsd.plus(usdVolume)
  protocolStatsEntity.save()
  userTotalsEntity.save()
}
