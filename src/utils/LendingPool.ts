import { SetLoanPool } from '../../generated/ISovryn/ISovryn'
import { LendingPool } from '../../generated/schema'
import { BigDecimal } from '@graphprotocol/graph-ts'

export function createAndReturnLendingPool(event: SetLoanPool): LendingPool {
  let lendingPoolEntity = LendingPool.load(event.params.loanPool.toHexString())
  if (lendingPoolEntity == null) {
    lendingPoolEntity = new LendingPool(event.params.loanPool.toHexString())
    lendingPoolEntity.underlyingAsset = event.params.underlying.toHexString()
    lendingPoolEntity.poolTokenBalance = BigDecimal.zero()
    lendingPoolEntity.assetBalance = BigDecimal.zero()
    lendingPoolEntity.totalAssetLent = BigDecimal.zero()
    lendingPoolEntity.save()
  }
  return lendingPoolEntity
}
