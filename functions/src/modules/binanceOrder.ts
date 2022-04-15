// import * as functions from 'firebase-functions'
import * as express from 'express'
import { BinanceOrderFunction } from '../types/binanceOrder'

const binanceOrder: BinanceOrderFunction = async (
    request: express.Request,
    response: express.Response
): Promise<void> => {
    // const logger = functions.logger
    // const body = request.body
    // logger.log('request.body', body)
    // logger.log('order', body.strategy.order)
    // logger.log('ticker type', typeof body.ticker)
    // logger.log('action type', typeof body.strategy.order.action)
    // logger.log('contracts type', typeof body.strategy.order.contracts)
    // logger.log('position_size type', typeof body.strategy.position_size)
    // logger.log('price type', typeof body.strategy.order.price)
    response.send('Hello from Firebase!')
}

export default binanceOrder
