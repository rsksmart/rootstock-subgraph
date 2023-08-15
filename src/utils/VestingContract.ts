import { Address, BigDecimal, BigInt, ethereum, log } from '@graphprotocol/graph-ts'
import { VestingContract } from '../../generated/schema'
import { VestingContract as VestingContractTemplate } from '../../generated/templates'
import { VestingContract as VestingLogic } from '../../generated/templates/VestingContract/VestingContract'

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
    VestingContractTemplate.create(Address.fromString(params.vestingAddress))
    log.info('VestingContract created: {}', [params.vestingAddress])
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

    const contract = VestingLogic.bind(Address.fromString(params.vestingAddress))
    const token = contract.try_SOV()
    const staking = contract.try_staking()

    if (!token.reverted) {
      vestingContract.token = token.value
    }

    if (!staking.reverted) {
      vestingContract.staking = staking.value
    }

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
