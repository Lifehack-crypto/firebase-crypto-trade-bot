// modules
import { logger, Request, Response } from 'firebase-functions'
import CcxtWrapper from '../utils/ccxtWrapper'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'
import CryptoUtils from '../utils/cryptoUtils'
// types
import { BinanceOrderFunction, AccessSecret } from '../types/modules/binanceOrder'
import { BinanceOrderResponse } from '../types/response/orderResponse'
import { ExchangeType, ExchangeName } from '../types/utils/ccxtWrapper'

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
export const BTC_LEVERAGE = 3.2 // BTC注文時のレバレッジ
export const ALT_LEVERAGE = 1.9 // ALT注文時のレバレッジ
export const NAME_TAG_BINANCE_KEY = 'binance_api_key'
export const NAME_TAG_BINANCE_SECRET = 'binance_secret'
export const BTC_USD_MINIMUM_AMOUNT = 100 // COIN-M 先物の注文最小値(USD値)

/* eslint @typescript-eslint/no-explicit-any: 0 */
const binanceOrder: BinanceOrderFunction = async (request: Request, response: Response): Promise<Response> => {
    const body = request.body
    if (!body.strategy || body.strategy.order.comment !== 'entry') {
        return response.send('not entry request')
    }

    if (!CryptoUtils.isBTC(body.symbol) && !CryptoUtils.isUSDT(body.marginCoin)) {
        return response.status(400).send('Bad request. Altcoin cannot be used for margin')
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
    const ccxt = new CcxtWrapper(apiKey!.data, apiSecret!.data, body.type, ExchangeName.BINANCE)
    let availableBalance = 0
    try {
        availableBalance = await ccxt.getAvailableBalance(body.marginCoin)
    } catch (error) {
        logger.warn(error)
        return response.status(500).send('getAvailableBalance error')
    }

    if (!availableBalance) {
        return response.send('no available balance')
    }

    const currentPrice = Number(body.strategy.order.price)
    const isLong = CryptoUtils.isLong(body.strategy.order.action)
    let stopLoss = 0
    let takeProfit = 0
    let amount: number = availableBalance
    let limitPrice: number = currentPrice
    if (CryptoUtils.isBTC(body.symbol)) {
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

        if (body.type === ExchangeType.FUTURE) {
            // USD-S-M先物
            amount = (availableBalance / currentPrice) * BTC_LEVERAGE
        } else {
            // COIN-M先物
            let minimumUnit = BTC_USD_MINIMUM_AMOUNT / currentPrice
            minimumUnit = Math.floor(minimumUnit * 100000) / 100000 // 小数点第5位未満を切り捨て
            amount = Math.floor(availableBalance / minimumUnit) * BTC_LEVERAGE
        }
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
