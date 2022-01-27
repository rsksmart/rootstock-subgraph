import { BigInt } from '@graphprotocol/graph-ts'
import {
  LiquidityPoolV1Converter,
  PriceDataUpdate,
  LiquidityAdded,
  LiquidityRemoved,
  Activation,
  Conversion,
  TokenRateUpdate,
  ConversionFeeUpdate,
  OwnerUpdate,
} from '../generated/templates/LiquidityPoolV1Converter/LiquidityPoolV1Converter'
// import { ExampleEntity } from '../generated/schema'

export function handlePriceDataUpdate(event: PriceDataUpdate): void {
  // // Entities can be loaded from the store using a string ID; this ID
  // // needs to be unique across all entities of the same type
  // let entity = ExampleEntity.load(event.transaction.from.toHex())
  // // Entities only exist after they have been saved to the store;
  // // `null` checks allow to create entities on demand
  // if (!entity) {
  //   entity = new ExampleEntity(event.transaction.from.toHex())
  //   // Entity fields can be set using simple assignments
  //   entity.count = BigInt.fromI32(0)
  // }
  // // BigInt and BigDecimal math are supported
  // entity.count = entity.count + BigInt.fromI32(1)
  // // Entity fields can be set based on event parameters
  // entity._connectorToken = event.params._connectorToken
  // entity._tokenSupply = event.params._tokenSupply
  // // Entities can be written to the store with `.save()`
  // entity.save()
  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.
  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.reserveRatio(...)
  // - contract.connectors(...)
  // - contract.hasETHReserve(...)
  // - contract.connectorTokens(...)
  // - contract.reserveWeight(...)
  // - contract.getReturn(...)
  // - contract.isActive(...)
  // - contract.onlyOwnerCanUpdateRegistry(...)
  // - contract.token1Decimal(...)
  // - contract.version(...)
  // - contract.conversionFee(...)
  // - contract.prevRegistry(...)
  // - contract.connectorTokenCount(...)
  // - contract.registry(...)
  // - contract.oracle(...)
  // - contract.owner(...)
  // - contract.DENOMINATOR(...)
  // - contract.maxConversionFee(...)
  // - contract.reserveTokenCount(...)
  // - contract.token0Decimal(...)
  // - contract.conversionsEnabled(...)
  // - contract.conversionWhitelist(...)
  // - contract.reserveTokens(...)
  // - contract.isV28OrHigher(...)
  // - contract.anchor(...)
  // - contract.newOwner(...)
  // - contract.reserves(...)
  // - contract.getConnectorBalance(...)
  // - contract.reserveBalance(...)
  // - contract.token(...)
  // - contract.converterType(...)
  // - contract.targetAmountAndFee(...)
  // - contract.getExpectedOutAmount(...)
  // - contract.decimalLength(...)
  // - contract.roundDiv(...)
  // - contract.geometricMean(...)
}

export function handleLiquidityAdded(event: LiquidityAdded): void {}

export function handleLiquidityRemoved(event: LiquidityRemoved): void {}

export function handleActivation(event: Activation): void {}

export function handleConversion(event: Conversion): void {}

export function handleTokenRateUpdate(event: TokenRateUpdate): void {}

export function handleConversionFeeUpdate(event: ConversionFeeUpdate): void {}

export function handleOwnerUpdate(event: OwnerUpdate): void {}
