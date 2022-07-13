import { Exchange, Order } from 'ccxt'
import CryptoUtils from '../utils/cryptoUtils'
import { TpAndSl, Side } from '../types/api/baseExchangeApi'
import { BinanceOrderResponse } from '../types/response/orderResponse'

export default abstract class BaseExchangeApi {
    protected exchange: Exchange

    constructor(exchange: Exchange) {
        this.exchange = exchange
    }

    // 利用可能な証拠金を取得
    abstract getAvailableBalance(currency: string): Promise<number>

    // 新規注文
    abstract newOrder(
        symbol: string,
        side: Side,
        amount: number,
        limitPrice: number
    ): Promise<Order | BinanceOrderResponse>

    // stop loss注文
    abstract stopOrder(
        newOrderResponse: Order | BinanceOrderResponse,
        prices: TpAndSl
    ): Promise<Order | BinanceOrderResponse>

    // take profit注文
    abstract takeProfitOrder(
        newOrderResponse: Order | BinanceOrderResponse,
        prices: TpAndSl
    ): Promise<Order | BinanceOrderResponse>

    // ティッカー名が一致する全ての注文取得
    abstract getOrders(symbol: string): Promise<Order[] | BinanceOrderResponse[]>

    // 注文キャンセル
    abstract cancelOrders(orders: Order[] | BinanceOrderResponse[]): Promise<void>

    // TPとSL価格産出
    public createTpSlOrderPrices(
        orderInfo: Order | BinanceOrderResponse,
        takeProfit: number,
        stopLoss: number
    ): TpAndSl {
        const side = CryptoUtils.isLong(orderInfo.side) ? 'sell' : 'buy' // 現在ポジションと逆にして利確注文に使う。ポジションがlongならsell、shortならbuy。
        const stopLossPrice = orderInfo.price * stopLoss
        const takeProfitPrice = orderInfo.price * takeProfit
        return { side, stopLossPrice, takeProfitPrice }
    }
}
