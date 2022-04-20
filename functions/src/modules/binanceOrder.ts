import { logger, Request, Response } from 'firebase-functions'
import { BinanceOrderFunction, AccessSecret } from '../types/modules/binanceOrder'
import CcxtWrapper from '../utils/ccxtWrapper'
import { BinanceOrderResponse } from '../types/response/orderResponse'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'

export const BTC_SHORT_SL_WIDTH = 1.012 // BTC shortポジションの損切幅 比率
export const BTC_SHORT_TP_WIDTH = 0.98 // BTC shortポジションの利確幅 比率
export const BTC_LONG_SL_WIDTH = 0.98 // BTC longポジションの損切幅 比率
export const BTC_LONG_TP_WIDTH = 1.023 // BTC longポジションの利確幅 比率
export const ALT_SHORT_SL_WIDTH = 1.012 // ALT shortポジションの損切幅 比率
export const ALT_SHORT_TP_WIDTH = 0.9805 // ALT shortポジションの利確幅 比率
export const ALT_LONG_SL_WIDTH = 0.97 // ALT longポジションの損切幅 比率
export const ALT_LONG_TP_WIDTH = 1.045 // ALT longポジションの利確幅 比率
export const BTC_LONG_LIMIT_WIDTH = 0.9999 // ロング指値幅 比率
export const BTC_SHORT_LIMIT_WIDTH = 1.00006 // ショート指値幅 比率
export const ALT_LONG_LIMIT_WIDTH = 0.9996 // ロング指値幅 比率
export const ALT_SHORT_LIMIT_WIDTH = 1.0001 // ショート指値幅 比率
export const BALANCE_RATE = 0.8 // 使用する証拠金の比率
export const BTC_LEVERAGE = 4 // BTC注文時のレバレッジ
export const ALT_LEVERAGE = 2.7 // ALT注文時のレバレッジ
export const NAME_TAG_BINANCE_KEY = 'binance_api_key'
export const NAME_TAG_BINANCE_SECRET = 'binance_secret'

/* eslint @typescript-eslint/no-explicit-any: 0 */
const binanceOrder: BinanceOrderFunction = async (request: Request, response: Response): Promise<Response> => {
    const body = request.body
    if (!body.strategy || body.strategy.order.comment !== 'entry') {
        return response.send('not entry request')
    }

    const client = new SecretManagerServiceClient()
    const secretsNames = [NAME_TAG_BINANCE_KEY, NAME_TAG_BINANCE_SECRET]
    let secrets: AccessSecret[]
    try {
        secrets = await Promise.all(
            secretsNames.map(async (name): Promise<AccessSecret> => {
                const [version]: any = await client.accessSecretVersion({
                    name: `projects/${process.env.PROJECT_NUMBER}/secrets/${name}/versions/latest`
                })
                return {
                    data: version.payload.data.toString('utf8'),
                    name: name
                }
            })
        )
    } catch (error) {
        logger.warn(error)
        return response.status(500).send('get accessSecretVersion error')
    }

    const apiKey = secrets.find((secret) => secret.name === NAME_TAG_BINANCE_KEY)
    const apiSecret = secrets.find((secret) => secret.name === NAME_TAG_BINANCE_SECRET)
    const ccxt = new CcxtWrapper(apiKey!.data, apiSecret!.data, 'binance')
    let availableBalance = 0
    try {
        availableBalance = (await ccxt.getAvailableBalance('USDT')) * BALANCE_RATE
    } catch (error) {
        logger.warn(error)
        return response.status(500).send('getAvailableBalance error')
    }

    if (!availableBalance) {
        return response.send('no available balance')
    }

    const currentPrice = Number(body.strategy.order.price)
    const isLong = ccxt.isLong(body.strategy.order.action)
    let stopLoss = 0
    let takeProfit = 0
    let amount: number = availableBalance
    let limitPrice: number = currentPrice
    if (ccxt.isBTC(body.symbol)) {
        if (isLong) {
            // BTCロング
            stopLoss = BTC_LONG_SL_WIDTH
            takeProfit = BTC_LONG_TP_WIDTH
            limitPrice = limitPrice * BTC_LONG_LIMIT_WIDTH
        } else {
            // BTCショート
            stopLoss = BTC_SHORT_SL_WIDTH
            takeProfit = BTC_SHORT_TP_WIDTH
            limitPrice = limitPrice * BTC_SHORT_LIMIT_WIDTH
        }
        amount = (availableBalance / currentPrice) * BTC_LEVERAGE
    } else {
        if (isLong) {
            // ALTロング
            stopLoss = ALT_LONG_SL_WIDTH
            takeProfit = ALT_LONG_TP_WIDTH
            limitPrice = limitPrice * ALT_LONG_LIMIT_WIDTH
        } else {
            // ALTショート
            stopLoss = ALT_SHORT_SL_WIDTH
            takeProfit = ALT_SHORT_TP_WIDTH
            limitPrice = limitPrice * ALT_SHORT_LIMIT_WIDTH
        }
        amount = (availableBalance / currentPrice) * ALT_LEVERAGE
    }

    try {
        const newOrderResponse = (await ccxt.newOrder(
            body.symbol,
            body.strategy.order.action,
            amount,
            limitPrice
        )) as unknown as BinanceOrderResponse
        const prices = ccxt.createTpSlOrderPrices(newOrderResponse, takeProfit, stopLoss)
        await ccxt.stopOrder(newOrderResponse, prices)
        await ccxt.takeProfitOrder(newOrderResponse, prices)
    } catch (error) {
        logger.warn(error)
        return response.status(500).send('order error')
    }
    return response.send('order success')
}

export default binanceOrder
