import { BigDecimal, BigInt, Address } from '@graphprotocol/graph-ts'
import { ProtocolStats, UserTotals } from '../../generated/schema'
import { USDTAddress } from '../contracts/contracts'
import { stablecoins } from '../contracts/contracts'

export function createAndReturnProtocolStats(): ProtocolStats {
  let protocolStatsEntity = ProtocolStats.load('0')
  if (protocolStatsEntity == null) {
    protocolStatsEntity = new ProtocolStats('0')
    protocolStatsEntity.totalUsers = BigInt.zero()
    protocolStatsEntity.totalMarginTradeVolumeUsd = BigDecimal.zero()
    protocolStatsEntity.totalCloseWithSwapVolumeUsd = BigDecimal.zero()
    protocolStatsEntity.totalDepositCollateralVolumeUsd = BigDecimal.zero()
    protocolStatsEntity.totalLiquidateVolumeUsd = BigDecimal.zero()
    protocolStatsEntity.totalAmmVolumeUsd = BigDecimal.zero()
    protocolStatsEntity.totalAmmLpFeesUsd = BigDecimal.zero()
    protocolStatsEntity.totalAmmStakerFeesUsd = BigDecimal.zero()
    protocolStatsEntity.totalTradingFeesUsd = BigDecimal.zero()
    protocolStatsEntity.totalLendingFeesUsd = BigDecimal.zero()
    protocolStatsEntity.totalBorrowingFeesUsd = BigDecimal.zero()
    protocolStatsEntity.totalLendVolumeUsd = BigDecimal.zero()
    protocolStatsEntity.totalUnlendVolumeUsd = BigDecimal.zero()
    protocolStatsEntity.totalBorrowVolumeUsd = BigDecimal.zero()
    protocolStatsEntity.totalCloseWithDepositVolumeUsd = BigDecimal.zero()
    protocolStatsEntity.totalVoluntarilyStakedSov = BigInt.zero()
    protocolStatsEntity.totalStakedByVestingSov = BigInt.zero()
    protocolStatsEntity.btcUsdPrice = BigDecimal.zero()
    // TODO: this is hardcoded mainnet value, should be dynamic for testnet/mainnet somehow
    protocolStatsEntity.usdStablecoin = '0xe700691da7b9851f2f35f8b8182c69c53ccad9db'
    protocolStatsEntity.tokens = []
    protocolStatsEntity.save()
  }
  return protocolStatsEntity
}

export function createAndReturnUserTotals(user: Address): UserTotals {
  let userTotals = UserTotals.load(user.toHexString())
  if (userTotals == null) {
    userTotals = new UserTotals(user.toHexString())
    userTotals.user = user.toHexString()
    userTotals.totalMarginTradeVolumeUsd = BigDecimal.zero()
    userTotals.totalCloseWithSwapVolumeUsd = BigDecimal.zero()
    userTotals.totalDepositCollateralVolumeUsd = BigDecimal.zero()
    userTotals.totalLiquidateVolumeUsd = BigDecimal.zero()
    userTotals.totalAmmVolumeUsd = BigDecimal.zero()
    userTotals.totalAmmLpFeesUsd = BigDecimal.zero()
    userTotals.totalAmmStakerFeesUsd = BigDecimal.zero()
    userTotals.totalTradingFeesUsd = BigDecimal.zero()
    userTotals.totalLendingFeesUsd = BigDecimal.zero()
    userTotals.totalBorrowingFeesUsd = BigDecimal.zero()
    userTotals.totalLendVolumeUsd = BigDecimal.zero()
    userTotals.totalUnlendVolumeUsd = BigDecimal.zero()
    userTotals.totalBorrowVolumeUsd = BigDecimal.zero()
    userTotals.totalCloseWithDepositVolumeUsd = BigDecimal.zero()
    userTotals.save()
  }
  return userTotals
}
