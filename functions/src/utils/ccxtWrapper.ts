import * as ccxt from 'ccxt'
import { AssetInfo, BinanceOrderParams, TpAndSl, Side } from '../types/utils/ccxtWrapper'
import { BinanceOrderResponse } from '../types/response/orderResponse'

export default class CcxtWrapper {
    private cex: ccxt.Exchange

    constructor(apiKey: string, secret: string, exchangeName?: string) {
        switch (exchangeName) {
            case 'binance':
                this.cex = new ccxt.binance({
                    apiKey: apiKey,
                    secret: secret,
                    enableRateLimit: true,
                    options: {
                        defaultType: 'future'
                    }
                })
                break
            default:
                this.cex = new ccxt.binance({
                    apiKey: apiKey,
                    secret: secret,
                    enableRateLimit: true,
                    options: {
                        defaultType: 'future'
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
        const orderResult = await this.cex.createOrder(symbol, 'LIMIT', side, amount, limitPrice)
        return orderResult
    }

    public async stopOrder(newOrderResponse: BinanceOrderResponse, prices: TpAndSl): Promise<ccxt.Order> {
        const orderParams: BinanceOrderParams = {
            stopPrice: prices.stopLossPrice,
            reduceOnly: true
        }
        const orderResult = await this.cex.createOrder(
            newOrderResponse.symbol,
            'STOP_MARKET',
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
            'TAKE_PROFIT',
            prices.side,
            newOrderResponse.amount,
            prices.takeProfitPrice,
            orderParams
        )
        return orderResult
    }

    // TPとSP価格産出
    public createTpSlOrderPrices(orderInfo: BinanceOrderResponse, takeProfit: number, stopLoss: number): TpAndSl {
        const side = this.isLong(orderInfo.side) ? 'sell' : 'buy' // 現在ポジションと逆にして利確注文に使う。ポジションがlongならsell、shortならbuy。
        const stopLossPrice = orderInfo.price * stopLoss
        const takeProfitPrice = orderInfo.price * takeProfit
        return { side, stopLossPrice, takeProfitPrice }
    }

    public isBTC(symbol: string): boolean {
        return Boolean(symbol.match('BTC'))
    }

    public isLong(side: Side): boolean {
        if (side === 'sell') {
            return false
        }
        return true
    }
}
