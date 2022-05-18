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
import { UserLiquidityHistory, LiquidityHistoryItem, Conversion, LiquidityPool, LiquidityPoolToken, SmartToken } from '../generated/schema'
import { ConversionEventForSwap, createAndReturnSwap, updatePricing } from './utils/Swap'
import { createAndReturnToken, decimalize } from './utils/Token'
import { createAndReturnTransaction } from './utils/Transaction'
import { BigInt, BigDecimal, dataSource } from '@graphprotocol/graph-ts'
import { createAndReturnSmartToken } from './utils/SmartToken'
import { createAndReturnPoolToken } from './utils/PoolToken'
import { updateVolumes } from './utils/Volumes'
import { liquidityPoolV1ChangeBlock } from './contracts/contracts'
import { updateCandleSticks } from './utils/Candlesticks'
import { LiquidityHistoryType } from './utils/types'

export function handlePriceDataUpdate(event: PriceDataUpdateEvent): void {}

class LiquidityHistoryItemParams {
  id: string
  user: string
  userLiquidityHistory: string
  type: string
  provider: string
  reserveToken: string
  amount: BigDecimal
  newBalance: BigDecimal
  newSupply: BigDecimal
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
  liquidityHistoryItem.timestamp = params.timestamp.toI32()
  liquidityHistoryItem.emittedBy = params.emittedBy
  liquidityHistoryItem.liquidityPool = params.liquidityPool
  liquidityHistoryItem.save()
}

function updateUserLiquidityHistory(
  liquidityPool: LiquidityPool,
  userLiquidityHistory: UserLiquidityHistory,
  token: string,
  amountAdded: BigDecimal,
  amountRemoved: BigDecimal,
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
  createAndReturnTransaction(event)
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
      userLiquidityHistory.totalAsset0LiquidityAdded = BigDecimal.zero()
      userLiquidityHistory.totalAsset0LiquidityRemoved = BigDecimal.zero()
      userLiquidityHistory.totalAsset1LiquidityAdded = BigDecimal.zero()
      userLiquidityHistory.totalAsset1LiquidityRemoved = BigDecimal.zero()
    }

    if (userLiquidityHistory != null) {
      updateUserLiquidityHistory(
        liquidityPool,
        userLiquidityHistory,
        event.params._reserveToken.toHexString(),
        decimalize(event.params._amount, event.params._reserveToken),
        BigDecimal.zero(),
      )
    }
  }
  createLiquidityHistoryItem({
    id: event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
    user: event.transaction.from.toHexString(),
    userLiquidityHistory: userLiquidityHistoryId,
    type: LiquidityHistoryType.Added,
    provider: event.params._provider.toHexString(),
    reserveToken: event.params._reserveToken.toHexString(),
    /** TODO: The decimalize functions will load the same token entity 3 times - optimize */
    amount: decimalize(event.params._amount, event.params._reserveToken),
    newBalance: decimalize(event.params._newBalance, event.params._reserveToken),
    newSupply: decimalize(event.params._newSupply, event.params._reserveToken),
    transaction: event.transaction.hash.toHexString(),
    timestamp: event.block.timestamp,
    emittedBy: event.address.toHexString(),
    liquidityPool: event.address.toHexString(),
  })
}

export function handleLiquidityRemoved(event: LiquidityRemovedEvent): void {
  createAndReturnTransaction(event)
  let liquidityPool = LiquidityPool.load(event.address.toHexString())
  let liquidityPoolToken = LiquidityPoolToken.load(event.address.toHexString() + event.params._reserveToken.toHexString())
  let userLiquidityHistoryId = ''
  if (liquidityPool != null && liquidityPoolToken != null) {
    userLiquidityHistoryId = event.transaction.from.toHexString() + liquidityPoolToken.poolToken
    let userLiquidityHistory = UserLiquidityHistory.load(userLiquidityHistoryId)
    if (userLiquidityHistory != null) {
      if (userLiquidityHistory != null) {
        updateUserLiquidityHistory(
          liquidityPool,
          userLiquidityHistory,
          event.params._reserveToken.toHexString(),
          BigDecimal.zero(),
          decimalize(event.params._amount, event.params._reserveToken),
        )
      }
    }
  }

  createLiquidityHistoryItem({
    id: event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
    user: event.transaction.from.toHexString(),
    userLiquidityHistory: userLiquidityHistoryId,
    type: LiquidityHistoryType.Removed,
    provider: event.params._provider.toHexString(),
    reserveToken: event.params._reserveToken.toHexString(),
    amount: decimalize(event.params._amount, event.params._reserveToken),
    newBalance: decimalize(event.params._newBalance, event.params._reserveToken),
    newSupply: decimalize(event.params._newSupply, event.params._reserveToken),
    transaction: event.transaction.hash.toHexString(),
    timestamp: event.block.timestamp,
    emittedBy: event.address.toHexString(),
    liquidityPool: event.address.toHexString(),
  })
}

/** This event is triggered when a pool is activated or deactivated */
export function handleActivation(event: ActivationEvent): void {
  createAndReturnTransaction(event)
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
  const fromAmount = decimalize(event.params._amount, event.params._fromToken)
  const toAmount = decimalize(event.params._return, event.params._toToken)
  const conversionFee = decimalize(event.params._conversionFee, event.params._toToken)

  let entity = new Conversion(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._fromToken = event.params._fromToken.toHexString()
  entity._toToken = event.params._toToken.toHexString()
  entity._trader = event.params._trader
  entity._amount = fromAmount
  entity._return = toAmount
  entity._conversionFee = conversionFee
  entity._protocolFee = BigDecimal.zero()
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.swapTransaction = event.transaction.hash.toHex()
  entity.save()

  let parsedEvent: ConversionEventForSwap = {
    transactionHash: event.transaction.hash,
    fromToken: event.params._fromToken,
    toToken: event.params._toToken,
    fromAmount: fromAmount,
    toAmount: toAmount,
    timestamp: event.block.timestamp,
    user: event.transaction.from,
    trader: event.params._trader,
    lpFee: conversionFee,
    protocolFee: BigDecimal.zero(),
  }

  createAndReturnSwap(parsedEvent)
  updatePricing(parsedEvent)
  updateVolumes(parsedEvent, dataSource.address())
  updateCandleSticks(parsedEvent)
}

export function handleConversionV2(event: ConversionEventV2): void {
  const fromAmount = decimalize(event.params._amount, event.params._fromToken)
  const toAmount = decimalize(event.params._return, event.params._toToken)
  const conversionFee = decimalize(event.params._conversionFee, event.params._toToken)

  let entity = new Conversion(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._fromToken = event.params._fromToken.toHexString()
  entity._toToken = event.params._toToken.toHexString()
  entity._trader = event.params._trader
  entity._amount = fromAmount
  entity._return = toAmount
  entity._conversionFee = conversionFee
  entity._protocolFee = BigDecimal.zero()
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.swapTransaction = event.transaction.hash.toHex()
  entity.save()

  let parsedEvent: ConversionEventForSwap = {
    transactionHash: event.transaction.hash,
    fromToken: event.params._fromToken,
    toToken: event.params._toToken,
    fromAmount: fromAmount,
    toAmount: toAmount,
    timestamp: event.block.timestamp,
    user: event.transaction.from,
    trader: event.params._trader,
    lpFee: conversionFee,
    protocolFee: BigDecimal.zero(),
  }

  createAndReturnSwap(parsedEvent)
  updatePricing(parsedEvent)
  updateVolumes(parsedEvent, dataSource.address())
  updateCandleSticks(parsedEvent)
}

export function handleConversionV1_2(event: ConversionEventV1WithProtocol): void {
  const fromAmount = decimalize(event.params._amount, event.params._fromToken)
  const toAmount = decimalize(event.params._return, event.params._toToken)
  const conversionFee = decimalize(event.params._conversionFee, event.params._toToken)
  const protocolFee = decimalize(event.params._protocolFee, event.params._toToken)

  let entity = new Conversion(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._fromToken = event.params._fromToken.toHexString()
  entity._toToken = event.params._toToken.toHexString()
  entity._trader = event.params._trader
  entity._amount = fromAmount
  entity._return = toAmount
  entity._conversionFee = conversionFee
  entity._protocolFee = protocolFee
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  let parsedEvent: ConversionEventForSwap = {
    transactionHash: event.transaction.hash,
    fromToken: event.params._fromToken,
    toToken: event.params._toToken,
    fromAmount: fromAmount,
    toAmount: toAmount,
    timestamp: event.block.timestamp,
    user: event.transaction.from,
    trader: event.params._trader,
    lpFee: conversionFee,
    protocolFee: protocolFee,
  }

  createAndReturnSwap(parsedEvent)
  updatePricing(parsedEvent)
  updateVolumes(parsedEvent, dataSource.address())
  updateCandleSticks(parsedEvent)
}

export function handleTokenRateUpdate(event: TokenRateUpdateEvent): void {}

export function handleConversionFeeUpdate(event: ConversionFeeUpdateEvent): void {}

export function handleWithdrawFees(event: WithdrawFeesEvent): void {}

export function handleOwnerUpdate(event: OwnerUpdateEvent): void {}
