import { Address, BigInt, dataSource, ethereum } from '@graphprotocol/graph-ts'
import {
  GovernorAlphaEvents,
  ProposalCanceled as ProposalCanceledEvent,
  ProposalCreated as ProposalCreatedEvent,
  ProposalExecuted as ProposalExecutedEvent,
  ProposalQueued as ProposalQueuedEvent,
  VoteCast as VoteCastEvent,
} from '../generated/GovernorAlphaEvents/GovernorAlphaEvents'
import { VoteCast, Proposal, GovernorContract, ProposalStateChange } from '../generated/schema'

import { createAndReturnTransaction } from './utils/Transaction'
import { ProposalState } from './utils/types'
import { ZERO_ADDRESS } from '@protofire/subgraph-toolkit'

function createAndReturnGovernorContract(address: Address): GovernorContract {
  let governor = GovernorContract.load(address.toHexString())
  if (governor == null) {
    governor = new GovernorContract(address.toHexString())
    const contract = GovernorAlphaEvents.bind(address)

    const proposalMaxOperations = contract.try_proposalMaxOperations()
    if (!proposalMaxOperations.reverted) {
      governor.proposalMaxOperations = proposalMaxOperations.value.toI32()
    } else {
      governor.proposalMaxOperations = 0
    }

    const votingDelay = contract.try_votingDelay()
    if (!votingDelay.reverted) {
      governor.votingDelay = votingDelay.value.toI32()
    } else {
      governor.votingDelay = 0
    }

    const votingPeriod = contract.try_votingPeriod()
    if (!votingPeriod.reverted) {
      governor.votingPeriod = votingPeriod.value.toI32()
    } else {
      governor.votingPeriod = 0
    }

    const quorumPercentageVotes = contract.try_quorumPercentageVotes()
    if (!quorumPercentageVotes.reverted) {
      governor.quorumPercentageVotes = quorumPercentageVotes.value.toI32()
    } else {
      governor.quorumPercentageVotes = 0
    }

    const majorityPercentageVotes = contract.try_majorityPercentageVotes()
    if (!majorityPercentageVotes.reverted) {
      governor.majorityPercentageVotes = majorityPercentageVotes.value.toI32()
    } else {
      governor.majorityPercentageVotes = 0
    }

    const timelock = contract.try_timelock()
    if (!timelock.reverted) {
      governor.timelock = timelock.value
    } else {
      governor.timelock = Address.fromString(ZERO_ADDRESS)
    }

    const staking = contract.try_staking()
    if (!staking.reverted) {
      governor.staking = staking.value
    } else {
      governor.staking = Address.fromString(ZERO_ADDRESS)
    }
    const guardian = contract.try_guardian()
    if (!guardian.reverted) {
      governor.guardian = guardian.value
    } else {
      governor.guardian = Address.fromString(ZERO_ADDRESS)
    }
    governor.save()
  }
  return governor
}

function logProposalState(proposal: Proposal, state: string, event: ethereum.Event): void {
  const change = new ProposalStateChange(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  change.proposal = proposal.id
  change.state = state
  change.timestamp = event.block.timestamp.toI32()
  change.emittedBy = event.address
  change.transaction = event.transaction.hash.toHex()
  change.save()
}

export function handleProposalCanceled(event: ProposalCanceledEvent): void {
  const transaction = createAndReturnTransaction(event)
  const proposalEntity = Proposal.load(dataSource.address().toHexString() + '-' + event.params.id.toString())
  if (proposalEntity != null) {
    proposalEntity.canceled = transaction.id
    proposalEntity.save()

    logProposalState(proposalEntity, ProposalState.Canceled, event)
  }
}

export function handleProposalCreated(event: ProposalCreatedEvent): void {
  const governor = createAndReturnGovernorContract(event.address)
  const transaction = createAndReturnTransaction(event)
  /** Create Proposal event */
  const proposalEntity = new Proposal(dataSource.address().toHexString() + '-' + event.params.id.toString())
  proposalEntity.created = event.transaction.hash.toHex()
  proposalEntity.votesFor = BigInt.zero()
  proposalEntity.votesAgainst = BigInt.zero()
  proposalEntity.countVotersFor = 0
  proposalEntity.countVotersAgainst = 0
  proposalEntity.proposalId = event.params.id.toI32()
  proposalEntity.proposer = event.params.proposer
  proposalEntity.targets = event.params.targets.map<string>((item) => item.toHexString())
  proposalEntity.values = event.params.values
  proposalEntity.signatures = event.params.signatures
  proposalEntity.calldatas = event.params.calldatas.map<string>((item) => item.toHexString())
  proposalEntity.startBlock = event.params.startBlock.toI32()
  proposalEntity.endBlock = event.params.endBlock.toI32()
  proposalEntity.description = event.params.description
  proposalEntity.timestamp = transaction.timestamp
  proposalEntity.emittedBy = governor.id

  const contract = GovernorAlphaEvents.bind(event.address)
  const proposal = contract.try_proposals(event.params.id)
  if (!proposal.reverted) {
    proposalEntity.quorum = proposal.value.getQuorum()
    proposalEntity.majorityPercentage = proposal.value.getMajorityPercentage()
  } else {
    proposalEntity.quorum = BigInt.zero()
    proposalEntity.majorityPercentage = BigInt.zero()
  }

  proposalEntity.eta = 0

  proposalEntity.save()

  logProposalState(proposalEntity, ProposalState.Created, event)
}

export function handleProposalExecuted(event: ProposalExecutedEvent): void {
  const transaction = createAndReturnTransaction(event)

  /** Load and update proposal event */
  const proposalEntity = Proposal.load(dataSource.address().toHexString() + '-' + event.params.id.toString())
  if (proposalEntity != null) {
    proposalEntity.executed = transaction.id
    proposalEntity.save()

    logProposalState(proposalEntity, ProposalState.Executed, event)
  }
}

export function handleProposalQueued(event: ProposalQueuedEvent): void {
  const transaction = createAndReturnTransaction(event)

  /** Load and update proposal event */
  const proposalEntity = Proposal.load(dataSource.address().toHexString() + '-' + event.params.id.toString())
  if (proposalEntity != null) {
    proposalEntity.queued = transaction.id
    proposalEntity.eta = event.params.eta.toI32()
    proposalEntity.save()

    logProposalState(proposalEntity, ProposalState.Queued, event)
  }
}

export function handleVoteCast(event: VoteCastEvent): void {
  const entity = new VoteCast(event.transaction.hash.toHex() + '-' + event.logIndex.toString())

  entity.voter = event.params.voter.toHexString()
  entity.proposalId = event.params.proposalId.toI32()
  entity.proposal = event.address.toHexString() + '-' + event.params.proposalId.toI32().toString()
  entity.support = event.params.support
  entity.votes = event.params.votes
  const transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  /** Load and update proposal event */
  const proposalEntity = Proposal.load(dataSource.address().toHexString() + '-' + event.params.proposalId.toString())
  if (proposalEntity != null) {
    if (event.params.support == true) {
      proposalEntity.votesFor = proposalEntity.votesFor.plus(event.params.votes)
      proposalEntity.countVotersFor++
    } else if (event.params.support == false) {
      proposalEntity.votesAgainst = proposalEntity.votesAgainst.plus(event.params.votes)
      proposalEntity.countVotersAgainst++
    }

    if (proposalEntity.quorum == BigInt.zero() || proposalEntity.majorityPercentage == BigInt.zero()) {
      const contract = GovernorAlphaEvents.bind(Address.fromString(proposalEntity.emittedBy))
      const proposal = contract.try_proposals(event.params.proposalId)
      if (!proposal.reverted) {
        proposalEntity.quorum = proposal.value.getQuorum()
        proposalEntity.majorityPercentage = proposal.value.getMajorityPercentage()
      } else {
        proposalEntity.quorum = BigInt.zero()
        proposalEntity.majorityPercentage = BigInt.zero()
      }
    }

    proposalEntity.save()
  }
}
