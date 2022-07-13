import { binance, Balances } from 'ccxt'
import BaseExchangeApi from './baseExchangeApi'
import { AssetInfo, BinanceOrderParams, TpAndSl, Side, OrderType, ExchangeType } from '../types/api/baseExchangeApi'
import { BinanceOrderResponse } from '../types/response/orderResponse'

export default class BinanceExchangeApi extends BaseExchangeApi {
    constructor(apiKey: string, secret: string, type: ExchangeType) {
        super(
            new binance({
                apiKey: apiKey,
                secret: secret,
                enableRateLimit: true,
                options: {
                    // COIN M先物はdelivery
                    // USDT S先物はfuture
                    defaultType: type
                }
            })
        )
    }

    public async getAvailableBalance(currency: string): Promise<number> {
        const balances: Balances = await this.exchange.fetchBalance()
        const balance: string = balances.info.assets.filter((data: AssetInfo) => data.asset === currency)[0]
            .availableBalance
        return Number(balance)
    }

    public async newOrder(
        symbol: string,
        side: Side,
        amount: number,
        limitPrice: number
    ): Promise<BinanceOrderResponse> {
        const orderResult = (await this.exchange.createOrder(
            symbol,
            OrderType.LIMIT,
            side,
            amount,
            limitPrice
        )) as BinanceOrderResponse
        return orderResult
    }

    public async stopOrder(newOrderResponse: BinanceOrderResponse, prices: TpAndSl): Promise<BinanceOrderResponse> {
        const orderParams: BinanceOrderParams = {
            stopPrice: prices.stopLossPrice,
            reduceOnly: true
        }
        const orderResult = (await this.exchange.createOrder(
            newOrderResponse.symbol,
            OrderType.STOP_MARKET,
            prices.side,
            newOrderResponse.amount,
            prices.stopLossPrice,
            orderParams
        )) as BinanceOrderResponse
        return orderResult
    }

    public async takeProfitOrder(
        newOrderResponse: BinanceOrderResponse,
        prices: TpAndSl
    ): Promise<BinanceOrderResponse> {
        const orderParams: BinanceOrderParams = {
            stopPrice: prices.takeProfitPrice,
            reduceOnly: true
        }
        const orderResult = (await this.exchange.createOrder(
            newOrderResponse.symbol,
            OrderType.TAKE_PROFIT,
            prices.side,
            newOrderResponse.amount,
            prices.takeProfitPrice,
            orderParams
        )) as BinanceOrderResponse
        return orderResult
    }

    public async getOrders(symbol: string): Promise<BinanceOrderResponse[]> {
        const orders: BinanceOrderResponse[] = (await this.exchange.fetchOpenOrders(symbol)) as BinanceOrderResponse[]
        return orders
    }

    public async cancelOrders(orders: BinanceOrderResponse[]): Promise<void> {
        await Promise.all(
            orders.map(async (order) => {
                await this.exchange.cancelOrder(order.id, order.symbol)
            })
        )
    }
}
