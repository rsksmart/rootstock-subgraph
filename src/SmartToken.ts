import { BigInt } from '@graphprotocol/graph-ts'
import { SmartToken, Issuance, Destruction, Transfer, Approval, OwnerUpdate } from '../generated/templates/SmartToken/SmartToken'

export function handleIssuance(event: Issuance): void {}

export function handleDestruction(event: Destruction): void {}

export function handleTransfer(event: Transfer): void {}

export function handleApproval(event: Approval): void {}

export function handleOwnerUpdate(event: OwnerUpdate): void {}
