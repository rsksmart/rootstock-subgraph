import {
  PriceDataUpdate as PriceDataUpdateEvent,
  LiquidityAdded as LiquidityAddedEvent,
  LiquidityRemoved as LiquidityRemovedEvent,
  Activation as ActivationEvent,
  Conversion as ConversionEventV1,
  TokenRateUpdate as TokenRateUpdateEvent,
  ConversionFeeUpdate as ConversionFeeUpdateEvent,
  WithdrawFees as WithdrawFeesEvent,
  OwnerUpdate as OwnerUpdateEvent,
  LiquidityPoolV1Converter as LiquidityPoolV1Contract,
} from '../generated/templates/LiquidityPoolV1Converter/LiquidityPoolV1Converter'
import {
  Conversion as ConversionEventV2,
  LiquidityPoolV2Converter as LiquidityPoolV2Contract,
} from '../generated/templates/LiquidityPoolV2Converter/LiquidityPoolV2Converter'
import {
  Conversion as ConversionEventV1WithProtocol,
  LiquidityPoolV1ConverterProtocolFee as LiquidityPoolV1ConverterProtocolFeeContract,
} from '../generated/templates/LiquidityPoolV1ConverterProtocolFee/LiquidityPoolV1ConverterProtocolFee'
import {
  PriceDataUpdate,
  UserLiquidityHistory,
  LiquidityHistoryItem,
  Activation,
  Conversion,
  TokenRateUpdate,
  ConversionFeeUpdate,
  WithdrawFees,
  LiquidityPool,
  LiquidityPoolToken,
  SmartToken,
} from '../generated/schema'
import { ConversionEventForSwap, createAndReturnSwap, updatePricing } from './utils/Swap'
import { createAndReturnToken } from './utils/Token'
import { loadTransaction } from './utils/Transaction'
import { BigInt, BigDecimal, dataSource, log, store } from '@graphprotocol/graph-ts'
import { createAndReturnSmartToken } from './utils/SmartToken'
import { createAndReturnPoolToken } from './utils/PoolToken'
import { createAndReturnUser } from './utils/User'
import { updateVolumes } from './utils/Volumes'
import { decimal } from '@protofire/subgraph-toolkit'
import { liquidityPoolV1ChangeBlock } from './contracts/contracts'
import { updateCandleSticks } from './utils/Candlesticks'

export function handlePriceDataUpdate(event: PriceDataUpdateEvent): void {
  let entity = new PriceDataUpdate(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._connectorToken = event.params._connectorToken
  entity._tokenSupply = event.params._tokenSupply
  entity._connectorBalance = event.params._connectorBalance
  entity._connectorWeight = event.params._connectorWeight
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

class LiquidityHistoryItemParams {
  id: string
  user: string
  userLiquidityHistory: string
  type: string
  provider: string
  reserveToken: string
  amount: BigInt
  newBalance: BigInt
  newSupply: BigInt
  transaction: string
  timestamp: BigInt
  emittedBy: string
  liquidityPool: string
}

function createLiquidityHistoryItem(params: LiquidityHistoryItemParams): void {
  let liquidityHistoryItem = new LiquidityHistoryItem(params.id)
  liquidityHistoryItem.user = params.user
  liquidityHistoryItem.userLiquidityHistory = params.userLiquidityHistory
  liquidityHistoryItem.type = params.type
  liquidityHistoryItem.provider = params.provider
  liquidityHistoryItem.reserveToken = params.reserveToken
  liquidityHistoryItem.amount = params.amount
  liquidityHistoryItem.newBalance = params.newBalance
  liquidityHistoryItem.newSupply = params.newSupply
  liquidityHistoryItem.transaction = params.transaction
  liquidityHistoryItem.timestamp = params.timestamp
  liquidityHistoryItem.emittedBy = params.emittedBy
  liquidityHistoryItem.liquidityPool = params.liquidityPool
  liquidityHistoryItem.save()
}

function updateUserLiquidityHistory(
  liquidityPool: LiquidityPool,
  userLiquidityHistory: UserLiquidityHistory,
  token: string,
  amountAdded: BigInt,
  amountRemoved: BigInt,
): void {
  /** This would be more efficient with another if/else statement for type, but less readable? */
  if (liquidityPool.token0 == token) {
    userLiquidityHistory.totalAsset0LiquidityAdded = userLiquidityHistory.totalAsset0LiquidityAdded.plus(amountAdded)
    userLiquidityHistory.totalAsset0LiquidityRemoved = userLiquidityHistory.totalAsset0LiquidityRemoved.plus(amountRemoved)
  } else if (liquidityPool.token1 == token) {
    userLiquidityHistory.totalAsset1LiquidityAdded = userLiquidityHistory.totalAsset1LiquidityAdded.plus(amountAdded)
    userLiquidityHistory.totalAsset1LiquidityRemoved = userLiquidityHistory.totalAsset1LiquidityRemoved.plus(amountRemoved)
  }
  userLiquidityHistory.save()
}

export function handleLiquidityAdded(event: LiquidityAddedEvent): void {
  createAndReturnUser(event.transaction.from)
  let liquidityPool = LiquidityPool.load(event.address.toHexString())
  let liquidityPoolToken = LiquidityPoolToken.load(event.address.toHexString() + event.params._reserveToken.toHexString())
  let userLiquidityHistoryId = ''
  if (liquidityPool != null && liquidityPoolToken != null) {
    userLiquidityHistoryId = event.transaction.from.toHexString() + liquidityPoolToken.poolToken
    let userLiquidityHistory = UserLiquidityHistory.load(userLiquidityHistoryId)
    if (userLiquidityHistory == null) {
      userLiquidityHistory = new UserLiquidityHistory(userLiquidityHistoryId)
      userLiquidityHistory.user = event.transaction.from.toHexString()
      userLiquidityHistory.poolToken = liquidityPoolToken.poolToken
      userLiquidityHistory.totalAsset0LiquidityAdded = BigInt.zero()
      userLiquidityHistory.totalAsset0LiquidityRemoved = BigInt.zero()
      userLiquidityHistory.totalAsset1LiquidityAdded = BigInt.zero()
      userLiquidityHistory.totalAsset1LiquidityRemoved = BigInt.zero()
    }

    if (userLiquidityHistory != null) {
      updateUserLiquidityHistory(liquidityPool, userLiquidityHistory, event.params._reserveToken.toHexString(), event.params._amount, BigInt.zero())
    }
  }

  loadTransaction(event)
  createLiquidityHistoryItem({
    id: event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
    user: event.transaction.from.toHexString(),
    userLiquidityHistory: userLiquidityHistoryId,
    type: 'Added',
    provider: event.params._provider.toHexString(),
    reserveToken: event.params._reserveToken.toHexString(),
    amount: event.params._amount,
    newBalance: event.params._newBalance,
    newSupply: event.params._newSupply,
    transaction: event.transaction.hash.toHexString(),
    timestamp: event.block.timestamp,
    emittedBy: event.address.toHexString(),
    liquidityPool: event.address.toHexString(),
  })
}

export function handleLiquidityRemoved(event: LiquidityRemovedEvent): void {
  createAndReturnUser(event.transaction.from)
  let liquidityPool = LiquidityPool.load(event.address.toHexString())
  let liquidityPoolToken = LiquidityPoolToken.load(event.address.toHexString() + event.params._reserveToken.toHexString())
  let userLiquidityHistoryId = ''
  if (liquidityPool != null && liquidityPoolToken != null) {
    userLiquidityHistoryId = event.transaction.from.toHexString() + liquidityPoolToken.poolToken
    let userLiquidityHistory = UserLiquidityHistory.load(userLiquidityHistoryId)
    if (userLiquidityHistory != null) {
      if (userLiquidityHistory != null) {
        updateUserLiquidityHistory(liquidityPool, userLiquidityHistory, event.params._reserveToken.toHexString(), BigInt.zero(), event.params._amount)
      }
    }
  }

  loadTransaction(event)
  createLiquidityHistoryItem({
    id: event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
    user: event.transaction.from.toHexString(),
    userLiquidityHistory: userLiquidityHistoryId,
    type: 'Removed',
    provider: event.params._provider.toHexString(),
    reserveToken: event.params._reserveToken.toHexString(),
    amount: event.params._amount,
    newBalance: event.params._newBalance,
    newSupply: event.params._newSupply,
    transaction: event.transaction.hash.toHexString(),
    timestamp: event.block.timestamp,
    emittedBy: event.address.toHexString(),
    liquidityPool: event.address.toHexString(),
  })
}

/** This event is triggered when a pool is activated or deactivated */
export function handleActivation(event: ActivationEvent): void {
  let entity = new Activation(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._type = event.params._type
  entity._anchor = event.params._anchor
  entity._activated = event.params._activated
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  let liquidityPool = LiquidityPool.load(dataSource.address().toHex())

  if (liquidityPool != null) {
    liquidityPool.activated = event.params._activated

    if (event.params._activated == true) {
      let smartToken = createAndReturnSmartToken(event.params._anchor)
      liquidityPool.smartToken = smartToken.smartToken.id
    } else {
      /** This either means the liquidity pool is not yet activated, or that the liquidity pool has been deactivated */
      liquidityPool.smartToken = null
      liquidityPool.currentConverterRegistry = null
    }

    if (event.params._type == 1) {
      /** The liquidityPoolV1ChangeBlock is where the abi changes to include the protocolFee */
      if (event.block.number < BigInt.fromI32(liquidityPoolV1ChangeBlock)) {
        const contract = LiquidityPoolV1Contract.bind(event.address)
        let reserveTokenCountResult = contract.try_reserveTokenCount()
        if (!reserveTokenCountResult.reverted) {
          for (let i = 0; i < reserveTokenCountResult.value; i++) {
            let reserveTokenResult = contract.try_reserveTokens(BigInt.fromI32(i))
            if (!reserveTokenResult.reverted) {
              createAndReturnToken(reserveTokenResult.value, event.address, event.params._anchor)
              createAndReturnPoolToken(event.params._anchor, event.address, reserveTokenResult.value)
            }
            if (i == 0) {
              liquidityPool.token0 = reserveTokenResult.value.toHexString()
            } else if (i == 1) {
              liquidityPool.token1 = reserveTokenResult.value.toHexString()
            }
          }
        }
      } else {
        const contract = LiquidityPoolV1ConverterProtocolFeeContract.bind(event.address)
        let reserveTokenCountResult = contract.try_reserveTokenCount()
        if (!reserveTokenCountResult.reverted) {
          for (let i = 0; i < reserveTokenCountResult.value; i++) {
            let reserveTokenResult = contract.try_reserveTokens(BigInt.fromI32(i))
            if (!reserveTokenResult.reverted) {
              createAndReturnToken(reserveTokenResult.value, event.address, event.params._anchor)
              createAndReturnPoolToken(event.params._anchor, event.address, reserveTokenResult.value)
            }
            if (i == 0) {
              liquidityPool.token0 = reserveTokenResult.value.toHexString()
            } else if (i == 1) {
              liquidityPool.token1 = reserveTokenResult.value.toHexString()
            }
          }
        }
      }
    } else if (event.params._type == 2) {
      const contract = LiquidityPoolV2Contract.bind(event.address)
      let reserveTokenCountResult = contract.try_reserveTokenCount()
      if (!reserveTokenCountResult.reverted) {
        for (let i = 0; i < reserveTokenCountResult.value; i++) {
          let reserveTokenResult = contract.try_reserveTokens(BigInt.fromI32(i))
          if (!reserveTokenResult.reverted) {
            createAndReturnToken(reserveTokenResult.value, event.address, event.params._anchor)
            let poolTokenResult = contract.try_poolToken(reserveTokenResult.value)
            if (!poolTokenResult.reverted) {
              createAndReturnPoolToken(poolTokenResult.value, event.address, reserveTokenResult.value)
            }
          }
          if (i == 0) {
            liquidityPool.token0 = reserveTokenResult.value.toHexString()
          } else if (i == 1) {
            liquidityPool.token1 = reserveTokenResult.value.toHexString()
          }
        }
      }
    }

    liquidityPool.save()
  }
}

export function handleConversionV1(event: ConversionEventV1): void {
  let entity = new Conversion(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._fromToken = event.params._fromToken.toHexString()
  entity._toToken = event.params._toToken.toHexString()
  entity._trader = event.params._trader
  entity._amount = event.params._amount
  entity._return = event.params._return
  entity._conversionFee = event.params._conversionFee
  entity._protocolFee = BigInt.zero()
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.swapTransaction = event.transaction.hash.toHex()
  entity.save()

  let parsedEvent: ConversionEventForSwap = {
    transactionHash: event.transaction.hash,
    fromToken: event.params._fromToken,
    toToken: event.params._toToken,
    fromAmount: decimal.fromBigInt(event.params._amount, 18),
    toAmount: decimal.fromBigInt(event.params._return, 18),
    timestamp: event.block.timestamp,
    user: event.transaction.from,
    trader: event.params._trader,
    lpFee: BigDecimal.zero(),
    protocolFee: BigDecimal.zero(),
  }

  createAndReturnSwap(parsedEvent)
  updatePricing(parsedEvent)
  updateVolumes(parsedEvent, dataSource.address())
  updateCandleSticks(parsedEvent)
}

export function handleConversionV2(event: ConversionEventV2): void {
  let entity = new Conversion(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._fromToken = event.params._fromToken.toHexString()
  entity._toToken = event.params._toToken.toHexString()
  entity._trader = event.params._trader
  entity._amount = event.params._amount
  entity._return = event.params._return
  entity._conversionFee = event.params._conversionFee
  entity._protocolFee = BigInt.zero()
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.swapTransaction = event.transaction.hash.toHex()
  entity.save()

  let parsedEvent: ConversionEventForSwap = {
    transactionHash: event.transaction.hash,
    fromToken: event.params._fromToken,
    toToken: event.params._toToken,
    fromAmount: decimal.fromBigInt(event.params._amount, 18),
    toAmount: decimal.fromBigInt(event.params._return, 18),
    timestamp: event.block.timestamp,
    user: event.transaction.from,
    trader: event.params._trader,
    lpFee: decimal.fromBigInt(event.params._conversionFee, 18),
    protocolFee: BigDecimal.zero(),
  }

  createAndReturnSwap(parsedEvent)
  updatePricing(parsedEvent)
  updateVolumes(parsedEvent, dataSource.address())
  updateCandleSticks(parsedEvent)
}

export function handleConversionV1_2(event: ConversionEventV1WithProtocol): void {
  let entity = new Conversion(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._fromToken = event.params._fromToken.toHexString()
  entity._toToken = event.params._toToken.toHexString()
  entity._trader = event.params._trader
  entity._amount = event.params._amount
  entity._return = event.params._return
  entity._conversionFee = event.params._conversionFee
  entity._protocolFee = event.params._protocolFee
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  let parsedEvent: ConversionEventForSwap = {
    transactionHash: event.transaction.hash,
    fromToken: event.params._fromToken,
    toToken: event.params._toToken,
    fromAmount: decimal.fromBigInt(event.params._amount, 18),
    toAmount: decimal.fromBigInt(event.params._return, 18),
    timestamp: event.block.timestamp,
    user: event.transaction.from,
    trader: event.params._trader,
    lpFee: decimal.fromBigInt(event.params._conversionFee, 18),
    protocolFee: decimal.fromBigInt(event.params._protocolFee, 18),
  }

  createAndReturnSwap(parsedEvent)
  updatePricing(parsedEvent)
  updateVolumes(parsedEvent, dataSource.address())
  updateCandleSticks(parsedEvent)
}

export function handleTokenRateUpdate(event: TokenRateUpdateEvent): void {
  let entity = new TokenRateUpdate(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._token1 = event.params._token1
  entity._token2 = event.params._token2
  entity._rateN = event.params._rateN
  entity._rateD = event.params._rateD
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleConversionFeeUpdate(event: ConversionFeeUpdateEvent): void {
  let entity = new ConversionFeeUpdate(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._prevFee = event.params._prevFee
  entity._newFee = event.params._newFee
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleWithdrawFees(event: WithdrawFeesEvent): void {
  let entity = new WithdrawFees(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.sender = event.params.sender
  entity.receiver = event.params.receiver
  entity.token = event.params.token
  entity.protocolFeeAmount = event.params.protocolFeeAmount
  entity.wRBTCConverted = event.params.wRBTCConverted
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleOwnerUpdate(event: OwnerUpdateEvent): void {}
