import { Order, Params } from 'ccxt'

export type AssetInfo = {
    asset: string
    walletBalance: string
    unrealizedProfit: string
    marginBalance: string
    maintMargin: string
    initialMargin: string
    positionInitialMargin: string
    openOrderInitialMargin: string
    maxWithdrawAmount: string
    crossWalletBalance: string
    crossUnPnl: string
    availableBalance: string
    marginAvailable: boolean
    updateTime: string
}

export type OrderParams = {
    symbol: string
    type: Order['type']
    side: Order['side']
    amount: number
    price?: number
    params?: Params
}

// createOrderのparamsオプション
export type BinanceOrderParams = {
    reduceOnly?: boolean // trueならreduceOnly注文
    postOnly?: boolean // trueならpostOnly注文
    type?: 'delivery' | 'future' | 'margin' | 'spot'
    defaultType?: 'delivery' | 'future' | 'margin' | 'spot'
    stopPrice?: number
    priceProtect?: boolean
    quantity?: number
    positionSide?: string
    activatePrice?: number
}

/**
 * STOP = stop指値注文
 * STOP_MARKET = stop成行注文
 * TAKE_PROFIT = takeprofit指値注文
 * TAKE_PROFIT_MARKET = takeprofit成行注文
 **/
export type BinanceOrderTypes = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_MARKET' | 'TAKE_PROFIT' | 'TAKE_PROFIT_MARKET'

export type Side = 'sell' | 'buy'

export type TpAndSl = {
    side: Side
    stopLossPrice: number
    takeProfitPrice: number
}

export type LimitOrderInfo = {
    symbol: string
    side: Side
    limitPrice: number
    amount: number
}
