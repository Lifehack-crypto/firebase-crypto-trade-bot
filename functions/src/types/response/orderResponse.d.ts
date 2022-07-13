/* eslint @typescript-eslint/no-explicit-any: 0 */
export interface Fee {
    type: 'taker' | 'maker'
    currency: string
    rate: number
    cost: number
}

export interface Trade {
    amount: number // amount of base currency
    datetime: string // ISO8601 datetime with milliseconds;
    id: string // string trade id
    info: any // the original decoded JSON as is
    order?: string // string order id or undefined/None/null
    price: number // float price in quote currency
    timestamp: number // Unix timestamp in milliseconds
    type?: string // order type, 'market', 'limit', ... or undefined/None/null
    side: 'buy' | 'sell' // direction of the trade, 'buy' or 'sell'
    symbol: string // symbol in CCXT format
    takerOrMaker: 'taker' | 'maker' // string, 'taker' or 'maker'
    cost: number // total cost (including fees), `price * amount`
    fee: Fee
}

export type BinanceOrderResponse = {
    info: {
        orderId: string
        symbol: string
        status: string
        clientOrderId: string
        price: string
        avgPrice: string
        origQty: string
        executedQty: string
        cumQty: string
        cumQuote: string
        timeInForce: string
        type: string
        reduceOnly: boolean
        closePosition: boolean
        side: 'SELL' | 'BUY'
        positionSide: string
        stopPrice: string
        workingType: string
        priceProtect: boolean
        origType: string
        updateTime: string
    }
    id: string
    clientOrderId: string
    timestamp: number
    datetime: string
    symbol: string
    type: string
    timeInForce?: string
    postOnly?: boolean
    side: 'sell' | 'buy'
    price: number // 指値価格（参入価格）
    amount: number // 注文数量 （ステーブルコインではなくBTC,ETHなど取引通貨の数）
    cost: number
    filled: number
    remaining: number
    status: string
    trades?: Trade[] | []
    fees?: Fee[] | []
    severity?: string
    message?: string
    lastTradeTimestamp?: number
}
