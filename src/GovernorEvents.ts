import { BigInt, dataSource } from '@graphprotocol/graph-ts'
import {
  ProposalCanceled as ProposalCanceledEvent,
  ProposalCreated as ProposalCreatedEvent,
  ProposalExecuted as ProposalExecutedEvent,
  ProposalQueued as ProposalQueuedEvent,
  VoteCast as VoteCastEvent,
} from '../generated/GovernorAlphaEvents/GovernorAlphaEvents'
import { VoteCast, Proposal } from '../generated/schema'

import { loadTransaction } from './utils/Transaction'

export function handleProposalCanceled(event: ProposalCanceledEvent): void {
  let transaction = loadTransaction(event)
  let proposalEntity = Proposal.load(dataSource.address().toHexString() + '-' + event.params.id.toString())
  if (proposalEntity != null) {
    proposalEntity.canceled = transaction.id
    proposalEntity.save()
  }
}

export function handleProposalCreated(event: ProposalCreatedEvent): void {
  let transaction = loadTransaction(event)
  /** Create Proposal event */
  let proposalEntity = new Proposal(dataSource.address().toHexString() + '-' + event.params.id.toString())
  proposalEntity.created = event.transaction.hash.toHex()
  proposalEntity.votesFor = BigInt.zero()
  proposalEntity.votesAgainst = BigInt.zero()
  proposalEntity.countVotersFor = BigInt.zero()
  proposalEntity.countVotersAgainst = BigInt.zero()
  proposalEntity.proposalId = event.params.id
  proposalEntity.proposer = event.params.proposer
  proposalEntity.targets = event.params.targets.map<string>((item) => item.toHexString())
  proposalEntity.values = event.params.values
  proposalEntity.signatures = event.params.signatures
  proposalEntity.startBlock = event.params.startBlock
  proposalEntity.endBlock = event.params.endBlock
  proposalEntity.description = event.params.description
  proposalEntity.timestamp = transaction.timestamp
  proposalEntity.emittedBy = event.address
  proposalEntity.save()
}

export function handleProposalExecuted(event: ProposalExecutedEvent): void {
  let transaction = loadTransaction(event)

  /** Load and update proposal event */
  let proposalEntity = Proposal.load(dataSource.address().toHexString() + '-' + event.params.id.toString())
  if (proposalEntity != null) {
    proposalEntity.executed = transaction.id
    proposalEntity.save()
  }
}

export function handleProposalQueued(event: ProposalQueuedEvent): void {
  let transaction = loadTransaction(event)

  /** Load and update proposal event */
  let proposalEntity = Proposal.load(dataSource.address().toHexString() + '-' + event.params.id.toString())
  if (proposalEntity != null) {
    proposalEntity.queued = transaction.id
    proposalEntity.save()
  }
}

export function handleVoteCast(event: VoteCastEvent): void {
  let entity = new VoteCast(event.transaction.hash.toHex() + '-' + event.logIndex.toString())

  entity.voter = event.params.voter.toHexString()
  entity.proposalId = event.params.proposalId
  entity.support = event.params.support
  entity.votes = event.params.votes
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  /** Load and update proposal event */
  let proposalEntity = Proposal.load(dataSource.address().toHexString() + '-' + event.params.proposalId.toString())
  if (proposalEntity != null) {
    if (event.params.support == true) {
      proposalEntity.votesFor = proposalEntity.votesFor.plus(event.params.votes)
      proposalEntity.countVotersFor = proposalEntity.countVotersFor.plus(BigInt.fromI32(1))
    } else if (event.params.support == false) {
      proposalEntity.votesAgainst = proposalEntity.votesAgainst.plus(event.params.votes)
      proposalEntity.countVotersAgainst = proposalEntity.countVotersAgainst.plus(BigInt.fromI32(1))
    }
    proposalEntity.save()
  }
}
