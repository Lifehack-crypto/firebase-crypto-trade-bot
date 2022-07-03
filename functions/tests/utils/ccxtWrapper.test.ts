import CcxtWrapper from '../../src/utils/ccxtWrapper'
import { TpAndSl, ExchangeType } from '../../src/types/utils/ccxtWrapper'
import { binance, Order } from 'ccxt'
import { BinanceOrderResponse } from '../../src/types/response/orderResponse'
jest.mock('ccxt')

describe('ccxtWrapper', () => {
    describe('Binance', () => {
        const exchangeName = 'binance'
        const testBalanceSymbol = 'USDT'
        const testOrderSymbol = 'BTC'
        const testSide = 'sell'
        const testAmount = 1000
        const fetchBalanceMock = jest.spyOn(binance.prototype, 'fetchBalance')
        const createOrderMock = jest.spyOn(binance.prototype, 'createOrder')
        const fetchOpenOrdersMock = jest.spyOn(binance.prototype, 'fetchOpenOrders')
        const cancelOrderMock = jest.spyOn(binance.prototype, 'cancelOrder')
        const apiKey = 'key'
        const secret = 'secret'
        afterEach(() => {
            fetchBalanceMock.mockRestore()
            createOrderMock.mockRestore()
            fetchOpenOrdersMock.mockRestore()
            cancelOrderMock.mockRestore()
        })

        test('getAvailableBalance', async () => {
            const balances = {
                info: {
                    free: 0,
                    used: 0,
                    total: 0,
                    assets: [
                        {
                            asset: 'BTC',
                            availableBalance: '1'
                        },
                        {
                            asset: testBalanceSymbol,
                            availableBalance: '1000'
                        }
                    ]
                },
            }
            fetchBalanceMock.mockResolvedValue(balances)
            const ccxtWrapper = new CcxtWrapper(apiKey, secret, ExchangeType.DELIVERY)
            const result = await ccxtWrapper.getAvailableBalance(testBalanceSymbol)
            expect(result).toBe(Number(balances.info.assets[1].availableBalance))
        })

        test('newOrder', async () => {
            const ccxtWrapper = new CcxtWrapper(apiKey, secret, ExchangeType.DELIVERY, exchangeName)
            const limitPrice = 10000
            const orderResult: Order = {
                "price": 10000,
                "status": "closed",
                "id": "51344892025",
                "fee": {
                    type: 'taker',
                    currency: 'USDT',
                    rate: 0,
                    cost: 0
                },
                "remaining": 0.028,
                "cost": 0,
                "info": {
                    "side": "SELL",
                    "closePosition": false,
                    "workingType": "CONTRACT_PRICE",
                    "executedQty": "0",
                    "positionSide": "BOTH",
                    "stopPrice": "0",
                    "status": "NEW",
                    "clientOrderId": "x-xcKtGhcu8f0f721ac9af4dbca8eeef",
                    "symbol": "BTCUSDT",
                    "price": "10000",
                    "cumQuote": "0",
                    "orderId": "51344892025",
                    "avgPrice": "0.00000",
                    "reduceOnly": false,
                    "origType": "LIMIT",
                    "type": "LIMIT",
                    "origQty": "0.028",
                    "timeInForce": "GTC",
                    "priceProtect": false,
                    "updateTime": "1650819352434",
                    "cumQty": "0"
                },
                "datetime": "2022-04-24T16:55:52.434Z",
                "clientOrderId": "x-xcKtGhcu8f0f721ac9af4dbca8eeef",
                "trades": [],
                "symbol": "BTC/USDT",
                "side": "sell",
                "filled": 0,
                "timestamp": 1650819352434,
                "type": "limit",
                "timeInForce": "GTC",
                "amount": 0.028,
                "lastTradeTimestamp": 1650819352434,
            }
            createOrderMock.mockResolvedValue(orderResult)
            const result = await ccxtWrapper.newOrder(testOrderSymbol, testSide, testAmount, limitPrice)
            expect(result).toEqual(orderResult)
        })

        test('stopOrder', async () => {
            const ccxtWrapper = new CcxtWrapper(apiKey, secret, ExchangeType.DELIVERY, exchangeName)
            const prices: TpAndSl = {
                side: 'buy',
                stopLossPrice: 10100,
                takeProfitPrice: 10200,

            }
            const orderResult: Order = {
                "price": 10000,
                "status": "closed",
                "id": "51344892025",
                "fee": {
                    type: 'taker',
                    currency: 'USDT',
                    rate: 0,
                    cost: 0
                },
                "remaining": 0.028,
                "cost": 0,
                "info": {
                    "side": "SELL",
                    "closePosition": false,
                    "workingType": "CONTRACT_PRICE",
                    "executedQty": "0",
                    "positionSide": "BOTH",
                    "stopPrice": "0",
                    "status": "NEW",
                    "clientOrderId": "x-xcKtGhcu8f0f721ac9af4dbca8eeef",
                    "symbol": "BTCUSDT",
                    "price": "10000",
                    "cumQuote": "0",
                    "orderId": "51344892025",
                    "avgPrice": "0.00000",
                    "reduceOnly": false,
                    "origType": "LIMIT",
                    "type": "LIMIT",
                    "origQty": "0.028",
                    "timeInForce": "GTC",
                    "priceProtect": false,
                    "updateTime": "1650819352434",
                    "cumQty": "0"
                },
                "datetime": "2022-04-24T16:55:52.434Z",
                "clientOrderId": "x-xcKtGhcu8f0f721ac9af4dbca8eeef",
                "trades": [],
                "symbol": "BTC/USDT",
                "side": "sell",
                "filled": 0,
                "timestamp": 1650819352434,
                "type": "limit",
                "timeInForce": "GTC",
                "amount": 0.028,
                "lastTradeTimestamp": 1650819352434,
            }
            createOrderMock.mockResolvedValue(orderResult)
            const result = await ccxtWrapper.stopOrder(orderResult, prices)
            expect(result).toEqual(orderResult)
        })

        test('takeProfitOrder', async () => {
            const ccxtWrapper = new CcxtWrapper(apiKey, secret, ExchangeType.DELIVERY, exchangeName)
            const prices: TpAndSl = {
                side: 'buy',
                stopLossPrice: 10100,
                takeProfitPrice: 10200,

            }
            const orderResult: Order = {
                "price": 10000,
                "status": "closed",
                "id": "51344892025",
                "fee": {
                    type: 'taker',
                    currency: 'USDT',
                    rate: 0,
                    cost: 0
                },
                "remaining": 0.028,
                "cost": 0,
                "info": {
                    "side": "SELL",
                    "closePosition": false,
                    "workingType": "CONTRACT_PRICE",
                    "executedQty": "0",
                    "positionSide": "BOTH",
                    "stopPrice": "0",
                    "status": "NEW",
                    "clientOrderId": "x-xcKtGhcu8f0f721ac9af4dbca8eeef",
                    "symbol": "BTCUSDT",
                    "price": "10000",
                    "cumQuote": "0",
                    "orderId": "51344892025",
                    "avgPrice": "0.00000",
                    "reduceOnly": false,
                    "origType": "LIMIT",
                    "type": "LIMIT",
                    "origQty": "0.028",
                    "timeInForce": "GTC",
                    "priceProtect": false,
                    "updateTime": "1650819352434",
                    "cumQty": "0"
                },
                "datetime": "2022-04-24T16:55:52.434Z",
                "clientOrderId": "x-xcKtGhcu8f0f721ac9af4dbca8eeef",
                "trades": [],
                "symbol": "BTC/USDT",
                "side": "sell",
                "filled": 0,
                "timestamp": 1650819352434,
                "type": "limit",
                "timeInForce": "GTC",
                "amount": 0.028,
                "lastTradeTimestamp": 1650819352434,
            }
            createOrderMock.mockResolvedValue(orderResult)
            const result = await ccxtWrapper.takeProfitOrder(orderResult, prices)
            expect(result).toEqual(orderResult)
        })

        describe('createTpSlOrderPrices', () => {
            test('side = buy', () => {
                const orderResult: Order = {
                    "price": 10000,
                    "status": "closed",
                    "id": "51344892025",
                    "fee": {
                        type: 'taker',
                        currency: 'USDT',
                        rate: 0,
                        cost: 0
                    },
                    "remaining": 0.028,
                    "cost": 0,
                    "info": {
                        "side": "BUY",
                        "closePosition": false,
                        "workingType": "CONTRACT_PRICE",
                        "executedQty": "0",
                        "positionSide": "BOTH",
                        "stopPrice": "0",
                        "status": "NEW",
                        "clientOrderId": "x-xcKtGhcu8f0f721ac9af4dbca8eeef",
                        "symbol": "BTCUSDT",
                        "price": "10000",
                        "cumQuote": "0",
                        "orderId": "51344892025",
                        "avgPrice": "0.00000",
                        "reduceOnly": false,
                        "origType": "LIMIT",
                        "type": "LIMIT",
                        "origQty": "0.028",
                        "timeInForce": "GTC",
                        "priceProtect": false,
                        "updateTime": "1650819352434",
                        "cumQty": "0"
                    },
                    "datetime": "2022-04-24T16:55:52.434Z",
                    "clientOrderId": "x-xcKtGhcu8f0f721ac9af4dbca8eeef",
                    "trades": [],
                    "symbol": "BTC/USDT",
                    "side": "buy",
                    "filled": 0,
                    "timestamp": 1650819352434,
                    "type": "limit",
                    "timeInForce": "GTC",
                    "amount": 0.028,
                    "lastTradeTimestamp": 1650819352434,
                }
                const ccxtWrapper = new CcxtWrapper(apiKey, secret, ExchangeType.DELIVERY, exchangeName)
                const takeProfit = 0.98
                const stopLoss = 1.02
                const result = ccxtWrapper.createTpSlOrderPrices(orderResult, takeProfit, stopLoss)
                expect(result).toHaveProperty('side', 'sell')
                expect(result).toHaveProperty('stopLossPrice', (orderResult.price * stopLoss))
                expect(result).toHaveProperty('takeProfitPrice', (orderResult.price * takeProfit))
            })

            test('side = sell', () => {
                const orderResult: Order = {
                    "price": 10000,
                    "status": "closed",
                    "id": "51344892025",
                    "fee": {
                        type: 'taker',
                        currency: 'USDT',
                        rate: 0,
                        cost: 0
                    },
                    "remaining": 0.028,
                    "cost": 0,
                    "info": {
                        "side": "SELL",
                        "closePosition": false,
                        "workingType": "CONTRACT_PRICE",
                        "executedQty": "0",
                        "positionSide": "BOTH",
                        "stopPrice": "0",
                        "status": "NEW",
                        "clientOrderId": "x-xcKtGhcu8f0f721ac9af4dbca8eeef",
                        "symbol": "BTCUSDT",
                        "price": "10000",
                        "cumQuote": "0",
                        "orderId": "51344892025",
                        "avgPrice": "0.00000",
                        "reduceOnly": false,
                        "origType": "LIMIT",
                        "type": "LIMIT",
                        "origQty": "0.028",
                        "timeInForce": "GTC",
                        "priceProtect": false,
                        "updateTime": "1650819352434",
                        "cumQty": "0"
                    },
                    "datetime": "2022-04-24T16:55:52.434Z",
                    "clientOrderId": "x-xcKtGhcu8f0f721ac9af4dbca8eeef",
                    "trades": [],
                    "symbol": "BTC/USDT",
                    "side": "sell",
                    "filled": 0,
                    "timestamp": 1650819352434,
                    "type": "limit",
                    "timeInForce": "GTC",
                    "amount": 0.028,
                    "lastTradeTimestamp": 1650819352434,
                }
                const ccxtWrapper = new CcxtWrapper(apiKey, secret, ExchangeType.DELIVERY, exchangeName)
                const takeProfit = 0.98
                const stopLoss = 1.02
                const result = ccxtWrapper.createTpSlOrderPrices(orderResult, takeProfit, stopLoss)
                expect(result).toHaveProperty('side', 'buy')
                expect(result).toHaveProperty('stopLossPrice', (orderResult.price * stopLoss))
                expect(result).toHaveProperty('takeProfitPrice', (orderResult.price * takeProfit))
            })
        })

        test('getOrders', async () => {
            const orders = [
                {
                    "info": {
                        "orderId": "51344892025",
                        "symbol": "BTCUSDT",
                        "status": "NEW",
                        "clientOrderId": "x-xcKtGhcu8f0f721ac9af4dbca8eeef",
                        "price": "10000",
                        "avgPrice": "0.00000",
                        "origQty": "0.028",
                        "executedQty": "0",
                        "cumQty": "0",
                        "cumQuote": "0",
                        "timeInForce": "GTC",
                        "type": "LIMIT",
                        "reduceOnly": false,
                        "closePosition": false,
                        "side": "SELL",
                        "positionSide": "BOTH",
                        "stopPrice": "0",
                        "workingType": "CONTRACT_PRICE",
                        "priceProtect": false,
                        "origType": "LIMIT",
                        "updateTime": "1650819352434",
                    },
                    "id": "51344892025",
                    "clientOrderId": "x-xcKtGhcu8f0f721ac9af4dbca8eeef",
                    "timestamp": 1650819352434,
                    "datetime": "2022-04-24T16:55:52.434Z",
                    "symbol": "BTC/USDT",
                    "type": "limit",
                    "timeInForce": "GTC",
                    "side": "sell",
                    "price": 10000,
                    "amount": 0.028,
                    "cost": 0,
                    "filled": 0,
                    "remaining": 0.028,
                    "status": "closed",
                    "fee": {
                        type: 'taker',
                        currency: 'USDT',
                        rate: 0,
                        cost: 0
                    },
                    "lastTradeTimestamp": 1650819352434,
                }
            ]

            fetchOpenOrdersMock.mockImplementationOnce(async (): Promise<any> => {
                return orders
            })
            const ccxtWrapper = new CcxtWrapper(apiKey, secret, ExchangeType.DELIVERY, exchangeName)
            const symbol = 'BTCUSDT'
            const result = await ccxtWrapper.getOrders(symbol)
            expect(fetchOpenOrdersMock).toHaveBeenCalledWith(symbol)
            expect(result).toEqual(orders)
        })

        test('cancelOrders', async () => {
            const orders: BinanceOrderResponse[] = [
                {
                    info: {
                        orderId: "51344892025",
                        symbol: "BTCUSDT",
                        status: "NEW",
                        clientOrderId: "x-xcKtGhcu8f0f721ac9af4dbca8eeef",
                        price: "10000",
                        avgPrice: "0.00000",
                        origQty: "0.028",
                        executedQty: "0",
                        cumQty: "0",
                        cumQuote: "0",
                        timeInForce: "GTC",
                        type: "LIMIT",
                        reduceOnly: false,
                        closePosition: false,
                        side: "SELL",
                        positionSide: "BOTH",
                        stopPrice: "0",
                        workingType: "CONTRACT_PRICE",
                        priceProtect: false,
                        origType: "LIMIT",
                        updateTime: "1650819352434",
                    },
                    id: "51344892025",
                    clientOrderId: "x-xcKtGhcu8f0f721ac9af4dbca8eeef",
                    timestamp: 1650819352434,
                    datetime: "2022-04-24T16:55:52.434Z",
                    symbol: "BTC/USDT",
                    type: "limit",
                    timeInForce: "GTC",
                    side: "sell" as 'sell' | 'buy',
                    price: 10000,
                    amount: 0.028,
                    cost: 0,
                    filled: 0,
                    remaining: 0.028,
                    status: 'open',
                    fee: {
                        type: 'taker',
                        currency: 'USDT',
                        rate: 0,
                        cost: 0
                    },
                    trades: [],
                    lastTradeTimestamp: 1650819352434,
                }
            ]

            const ccxtWrapper = new CcxtWrapper(apiKey, secret, ExchangeType.DELIVERY, exchangeName)
            const result = await ccxtWrapper.cancelOrders(orders)
            expect(cancelOrderMock).toHaveBeenCalledWith(orders[0].id, orders[0].symbol)
            expect(result).toBeUndefined()
        })
    })
})