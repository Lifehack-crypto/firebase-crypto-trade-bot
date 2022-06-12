import * as ccxt from 'ccxt'
import CryptoUtils from './cryptoUtils'
import {
    AssetInfo,
    BinanceOrderParams,
    TpAndSl,
    Side,
    ExchangeName,
    OrderType,
    ExchangeType
} from '../types/utils/ccxtWrapper'
import { BinanceOrderResponse } from '../types/response/orderResponse'

export default class CcxtWrapper {
    private cex: ccxt.Exchange

    constructor(apiKey: string, secret: string, type: ExchangeType, exchangeName?: string) {
        switch (exchangeName) {
            case ExchangeName.BINANCE:
                this.cex = new ccxt.binance({
                    apiKey: apiKey,
                    secret: secret,
                    enableRateLimit: true,
                    options: {
                        defaultType: type
                        // COIN M先物はdelivery
                        // USDT S先物はfuture
                    }
                })
                break
            default:
                this.cex = new ccxt.binance({
                    apiKey: apiKey,
                    secret: secret,
                    enableRateLimit: true,
                    options: {
                        defaultType: ExchangeType.FUTURE
                    }
                })
                break
        }
    }

    public async getAvailableBalance(currency: string): Promise<number> {
        const balances: ccxt.Balances = await this.cex.fetchBalance()
        const balance: string = balances.info.assets.filter((data: AssetInfo) => data.asset === currency)[0]
            .availableBalance
        return Number(balance)
    }

    public async newOrder(symbol: string, side: Side, amount: number, limitPrice: number): Promise<ccxt.Order> {
        const orderResult = await this.cex.createOrder(symbol, OrderType.LIMIT, side, amount, limitPrice)
        return orderResult
    }

    public async stopOrder(newOrderResponse: BinanceOrderResponse, prices: TpAndSl): Promise<ccxt.Order> {
        const orderParams: BinanceOrderParams = {
            stopPrice: prices.stopLossPrice,
            reduceOnly: true
        }
        const orderResult = await this.cex.createOrder(
            newOrderResponse.symbol,
            OrderType.STOP_MARKET,
            prices.side,
            newOrderResponse.amount,
            prices.stopLossPrice,
            orderParams
        )
        return orderResult
    }

    public async takeProfitOrder(newOrderResponse: BinanceOrderResponse, prices: TpAndSl): Promise<ccxt.Order> {
        const orderParams: BinanceOrderParams = {
            stopPrice: prices.takeProfitPrice,
            reduceOnly: true
        }
        const orderResult = await this.cex.createOrder(
            newOrderResponse.symbol,
            OrderType.TAKE_PROFIT,
            prices.side,
            newOrderResponse.amount,
            prices.takeProfitPrice,
            orderParams
        )
        return orderResult
    }

    // TPとSP価格産出
    public createTpSlOrderPrices(orderInfo: BinanceOrderResponse, takeProfit: number, stopLoss: number): TpAndSl {
        const side = CryptoUtils.isLong(orderInfo.side) ? 'sell' : 'buy' // 現在ポジションと逆にして利確注文に使う。ポジションがlongならsell、shortならbuy。
        const stopLossPrice = orderInfo.price * stopLoss
        const takeProfitPrice = orderInfo.price * takeProfit
        return { side, stopLossPrice, takeProfitPrice }
    }
}
