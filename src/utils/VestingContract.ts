import { BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { VestingContract } from '../../generated/schema'

class VestingContractParams {
  vestingAddress: string
  user: string
  cliff: BigInt
  duration: BigInt
  balance: BigDecimal
  type: string
  event: ethereum.Event
}

export function createAndReturnVestingContract(params: VestingContractParams): VestingContract {
  let vestingContract = VestingContract.load(params.vestingAddress)
  if (vestingContract == null) {
    vestingContract = new VestingContract(params.vestingAddress)
    vestingContract.user = params.user
    vestingContract.createdAtTimestamp = params.event.block.timestamp.toI32()
    vestingContract.cliff = params.cliff.toI32()
    vestingContract.duration = params.duration.toI32()
    vestingContract.startingBalance = params.balance
    vestingContract.currentBalance = params.balance
    vestingContract.type = params.type
    vestingContract.emittedBy = params.event.address
    vestingContract.createdAtTransaction = params.event.transaction.hash.toHexString()
    vestingContract.save()
  }
  return vestingContract
}

export function incrementVestingContractBalance(vestingContract: VestingContract, amountToAdd: BigDecimal): void {
  vestingContract.currentBalance = vestingContract.currentBalance.plus(amountToAdd)
  vestingContract.save()
}

export function decrementVestingContractBalance(vestingAddress: string, amountToMinus: BigDecimal): void {
  const vestingContract = VestingContract.load(vestingAddress)
  if (vestingContract != null) {
    vestingContract.currentBalance = vestingContract.currentBalance.minus(amountToMinus)
    vestingContract.save()
  }
}
