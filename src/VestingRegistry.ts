import { TeamVestingCreated as TeamVestingCreatedEvent, VestingCreated as VestingCreatedEvent } from '../generated/VestingRegistry1/VestingRegistry'
import { VestingCreated as VestingCreatedProxyEvent, TeamVestingCreated as TeamVestingCreatedProxyEvent } from '../generated/VestingRegistryProxy/VestingProxy'
import { VestingContract } from '../generated/schema'
import { VestingContract as VestingContractTemplate } from '../generated/templates'
import { VestingContract as VestingLogic } from '../generated/templates/VestingContract/VestingContract'
import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { createAndReturnTransaction } from './utils/Transaction'
import { vestingRegistry1, vestingRegistry2, vestingRegistry3, vestingRegistryFish } from './contracts/contracts'
import { createAndReturnUser } from './utils/User'
import { VestingContractType } from './utils/types'

import { DEFAULT_DECIMALS, decimal } from '@protofire/subgraph-toolkit'

export function handleTeamVestingCreated(event: TeamVestingCreatedEvent): void {
  /** Some contracts are created twice. So, we need to first check if the contract already exists */
  const existingContract = VestingContract.load(event.params.vesting.toHexString())
  if (existingContract == null) {
    VestingContractTemplate.create(Address.fromString(event.params.vesting.toHexString()))
    log.info('Team VestingContract created: {}', [event.params.vesting.toHexString()])
    const entity = new VestingContract(event.params.vesting.toHexString())
    const user = createAndReturnUser(event.params.tokenOwner, event.block.timestamp)
    entity.user = user.id
    entity.cliff = event.params.cliff.toI32()
    entity.duration = event.params.duration.toI32()
    entity.startingBalance = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
    entity.currentBalance = BigDecimal.zero()
    const transaction = createAndReturnTransaction(event)
    entity.createdAtTransaction = transaction.id
    entity.createdAtTimestamp = transaction.timestamp
    entity.emittedBy = event.address
    entity.type = event.address.toHexString() == vestingRegistryFish ? VestingContractType.FishTeam : VestingContractType.Team

    const contract = VestingLogic.bind(event.params.vesting)
    const token = contract.try_SOV()
    const staking = contract.try_staking()

    if (!token.reverted) {
      entity.token = token.value
    }

    if (!staking.reverted) {
      entity.staking = staking.value
    }

    entity.save()
  }
}

/** This event has a different event signature than TeamVestingCreated, but for our purposes the logic is the same.
 * TODO: Dry up this code
 */
export function handleTeamVestingCreatedProxy(event: TeamVestingCreatedProxyEvent): void {
  const existingContract = VestingContract.load(event.params.vesting.toHexString())
  if (existingContract == null) {
    VestingContractTemplate.create(Address.fromString(event.params.vesting.toHexString()))
    log.info('Team VestingContract_proxy created: {}', [event.params.vesting.toHexString()])
    const entity = new VestingContract(event.params.vesting.toHexString())
    const user = createAndReturnUser(event.params.tokenOwner, event.block.timestamp)
    entity.user = user.id
    entity.cliff = event.params.cliff.toI32()
    entity.duration = event.params.duration.toI32()
    entity.startingBalance = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
    entity.currentBalance = BigDecimal.zero()
    const transaction = createAndReturnTransaction(event)
    entity.createdAtTransaction = transaction.id
    entity.createdAtTimestamp = transaction.timestamp
    entity.emittedBy = event.address
    entity.type = VestingContractType.Team

    const contract = VestingLogic.bind(event.params.vesting)
    const token = contract.try_SOV()
    const staking = contract.try_staking()

    if (!token.reverted) {
      entity.token = token.value
    }

    if (!staking.reverted) {
      entity.staking = staking.value
    }

    entity.save()
  }
}

export function handleVestingCreated(event: VestingCreatedEvent): void {
  const existingContract = VestingContract.load(event.params.vesting.toHexString())
  if (existingContract == null) {
    VestingContractTemplate.create(Address.fromString(event.params.vesting.toHexString()))
    log.info('VestingContract created: {}', [event.params.vesting.toHexString()])
    const entity = new VestingContract(event.params.vesting.toHexString())
    const user = createAndReturnUser(event.params.tokenOwner, event.block.timestamp)
    entity.user = user.id
    entity.cliff = event.params.cliff.toI32()
    entity.duration = event.params.duration.toI32()
    entity.startingBalance = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
    entity.currentBalance = BigDecimal.zero()
    const transaction = createAndReturnTransaction(event)
    entity.createdAtTransaction = transaction.id
    entity.createdAtTimestamp = transaction.timestamp
    entity.emittedBy = event.address
    entity.type = getVestingContractType(event.address.toHexString(), event.params.cliff, event.params.duration)

    const contract = VestingLogic.bind(event.params.vesting)
    const token = contract.try_SOV()
    const staking = contract.try_staking()

    if (!token.reverted) {
      entity.token = token.value
    }

    if (!staking.reverted) {
      entity.staking = staking.value
    }

    entity.save()
  }
}

export function handleVestingCreatedProxy(event: VestingCreatedProxyEvent): void {
  const existingContract = VestingContract.load(event.params.vesting.toHexString())
  if (existingContract == null) {
    VestingContractTemplate.create(Address.fromString(event.params.vesting.toHexString()))
    log.info('VestingContract created: {}', [event.params.vesting.toHexString()])
    const entity = new VestingContract(event.params.vesting.toHexString())
    const user = createAndReturnUser(event.params.tokenOwner, event.block.timestamp)
    entity.user = user.id
    entity.cliff = event.params.cliff.toI32()
    entity.duration = event.params.duration.toI32()
    entity.startingBalance = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
    entity.currentBalance = BigDecimal.zero()
    const transaction = createAndReturnTransaction(event)
    entity.createdAtTransaction = transaction.id
    entity.createdAtTimestamp = transaction.timestamp
    entity.emittedBy = event.address
    entity.type = VestingContractType.Rewards

    const contract = VestingLogic.bind(event.params.vesting)
    const token = contract.try_SOV()
    const staking = contract.try_staking()

    if (!token.reverted) {
      entity.token = token.value
    }

    if (!staking.reverted) {
      entity.staking = staking.value
    }

    entity.save()
  }
}

function getVestingContractType(address: string, cliff: BigInt, duration: BigInt): string {
  /** To determine if a vesting contract from vesting registries 1 and 2 is from Origins or from a Strategic investment round, check if the cliff is equal to the duration
   * We could maybe also check the timestamp as added redundancy, but this adds testnet/mainnet complexity that I want to avoid
   */
  const originsOrStrategic = (cliff: BigInt, duration: BigInt): string => {
    if (cliff == duration) {
      return VestingContractType.Origins
    } else {
      return VestingContractType.Strategic
    }
  }

  if (address == vestingRegistry3.toLowerCase()) return VestingContractType.Rewards
  if (address == vestingRegistryFish.toLowerCase()) return VestingContractType.Fish
  if (address == vestingRegistry1.toLowerCase() || address == vestingRegistry2.toLowerCase()) return originsOrStrategic(cliff, duration)

  /** Rewards is the default type. We could consider having type Undefined or Other */
  return VestingContractType.Rewards
}
