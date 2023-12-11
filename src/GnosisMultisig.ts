import { Bytes, ethereum, BigInt, Address, dataSource, store } from '@graphprotocol/graph-ts'
import { MultisigConfirmation, MultisigContract, MultisigTransaction } from '../generated/schema'
import {
  Confirmation,
  Execution,
  ExecutionFailure,
  Multisig,
  OwnerAddition,
  OwnerRemoval,
  RequirementChange,
  Revocation,
  Submission,
} from '../generated/MultisigGuardian/Multisig'
import { createAndReturnTransaction } from './utils/Transaction'
import { createAndReturnUser } from './utils/User'

function createAndReturnMultisigContract(event: ethereum.Event): MultisigContract {
  let multisig = MultisigContract.load(event.address.toHexString())
  if (multisig == null) {
    multisig = new MultisigContract(event.address.toHexString())
    multisig.timestamp = event.block.timestamp.toI32()
    multisig.transaction = createAndReturnTransaction(event).id
    multisig.owners = []
    multisig.required = 0

    const contract = Multisig.bind(event.address)

    const ownerResult = contract.try_getOwners()
    if (!ownerResult.reverted) {
      const membersArray = multisig.owners
      for (let i = 0; i < ownerResult.value.length; i++) {
        const user = createAndReturnUser(ownerResult.value[i], event.block.timestamp).id
        membersArray.push(user)
      }
      multisig.owners = membersArray
    }

    const requiredResult = contract.try_required()
    if (!requiredResult.reverted) {
      multisig.required = requiredResult.value.toI32()
    }

    multisig.save()
  }
  return multisig
}

function createAndReturnMultisigTransaction(contract: Bytes, txId: BigInt): MultisigTransaction {
  const id = contract.toHexString() + '-' + txId.toString()
  let multisigTransaction = MultisigTransaction.load(id)
  if (multisigTransaction == null) {
    multisigTransaction = new MultisigTransaction(id)
    multisigTransaction.multisigContract = contract.toHexString()
    multisigTransaction.transactionId = txId.toI32()
    multisigTransaction.destination = Address.zero()
    multisigTransaction.value = BigInt.zero()
    multisigTransaction.data = Bytes.empty()

    const multisig = Multisig.bind(Address.fromBytes(contract))
    const transactionData = multisig.try_transactions(txId)
    if (!transactionData.reverted) {
      multisigTransaction.destination = transactionData.value.getDestination()
      multisigTransaction.value = transactionData.value.getValue()
      multisigTransaction.data = transactionData.value.getData()
    }
  }
  return multisigTransaction
}

function createAndReturnMultisigConfirmation(event: Confirmation): MultisigConfirmation {
  const id = event.address.toHexString() + '-' + event.params.transactionId.toString() + '-' + event.params.sender.toHexString()
  let multisigConfirmation = MultisigConfirmation.load(id)
  if (multisigConfirmation == null) {
    multisigConfirmation = new MultisigConfirmation(id)
    multisigConfirmation.signer = createAndReturnUser(event.params.sender, event.block.timestamp).id
    multisigConfirmation.multisigTransaction = dataSource.address().toHexString() + '-' + event.params.transactionId.toString()
    multisigConfirmation.timestamp = event.block.timestamp.toI32()
    multisigConfirmation.transaction = createAndReturnTransaction(event).id
    multisigConfirmation.save()
  }
  return multisigConfirmation
}

export function handleSubmission(event: Submission): void {
  const contract = createAndReturnMultisigContract(event)
  const tx = createAndReturnMultisigTransaction(Address.fromString(contract.id), event.params.transactionId)
  tx.status = 'SUBMITTED'
  tx.submitter = createAndReturnUser(event.transaction.from, event.block.timestamp).id
  tx.timestamp = event.block.timestamp.toI32()
  tx.transaction = createAndReturnTransaction(event).id
  tx.save()
}

export function handleConfirmation(event: Confirmation): void {
  createAndReturnMultisigConfirmation(event).id
}

export function handleRevocation(event: Revocation): void {
  store.remove('MultisigConfirmation', event.address.toHexString() + '-' + event.params.transactionId.toString() + '-' + event.params.sender.toHexString())
}

export function handleExecution(event: Execution): void {
  const contract = createAndReturnMultisigContract(event)
  const tx = createAndReturnMultisigTransaction(Address.fromString(contract.id), event.params.transactionId)
  tx.status = 'EXECUTED'
  tx.save()
}

export function handleExecutionFailure(event: ExecutionFailure): void {
  const contract = createAndReturnMultisigContract(event)
  const tx = createAndReturnMultisigTransaction(Address.fromString(contract.id), event.params.transactionId)
  tx.status = 'FAILED'
  tx.save()
}

export function handleOwnerAddition(event: OwnerAddition): void {
  const contract = createAndReturnMultisigContract(event)
  const owners = contract.owners
  owners.push(createAndReturnUser(event.params.owner, event.block.timestamp).id)
  contract.owners = owners
  contract.save()
}

export function handleOwnerRemoval(event: OwnerRemoval): void {
  const contract = createAndReturnMultisigContract(event)
  const owners = contract.owners
  const index = owners.indexOf(createAndReturnUser(event.params.owner, event.block.timestamp).id)
  if (index > -1) {
    owners.splice(index, 1)
  }
  contract.owners = owners
}

export function handleRequirementChange(event: RequirementChange): void {
  const contract = createAndReturnMultisigContract(event)
  contract.required = event.params.required.toI32()
  contract.save()
}
