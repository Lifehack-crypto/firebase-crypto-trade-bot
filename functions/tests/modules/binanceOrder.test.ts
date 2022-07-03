import { Request, Response } from 'firebase-functions'
import * as BinanceOrder from '../../src/modules/binanceOrder'
import binanceOrder from '../../src/modules/binanceOrder'
import CcxtWrapper from '../../src/utils/ccxtWrapper'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'
import { Side, TpAndSl } from '../../src/types/utils/ccxtWrapper'
jest.mock('../../src/utils/ccxtWrapper')
jest.mock('@google-cloud/secret-manager')
const getAvailableBalanceSpyOn = jest.spyOn(CcxtWrapper.prototype, 'getAvailableBalance')
const newOrderSpyOn = jest.spyOn(CcxtWrapper.prototype, 'newOrder')
const stopOrderSpyOn = jest.spyOn(CcxtWrapper.prototype, 'stopOrder')
const takeProfitOrderSpyOn = jest.spyOn(CcxtWrapper.prototype, 'takeProfitOrder')
const createTpSlOrderPrices = jest.spyOn(CcxtWrapper.prototype, 'createTpSlOrderPrices')
const accessSecretVersionSpyOn = jest.spyOn(SecretManagerServiceClient.prototype, 'accessSecretVersion')
const getOrdersSpyOn = jest.spyOn(CcxtWrapper.prototype, 'getOrders')
const cancelOrdersSpyOn = jest.spyOn(CcxtWrapper.prototype, 'cancelOrders')

/* eslint @typescript-eslint/no-explicit-any: 0 */
describe('binanceOrder', () => {
    const availableBalance = 100
    const res = {
        send: jest.fn().mockImplementation((msg: string) => {
            return msg
        }),
        status: jest.fn(() => {
            return {
                send: jest.fn().mockImplementation((msg: string) => {
                    return msg
                })
            }
        })
    } as unknown as Response
    const accessSecretKey = [{
        name: BinanceOrder.NAME_TAG_BINANCE_KEY,
        payload: {
            data: Buffer.from('test_key')
        },
    },
    {},
    {}
    ]
    const accessSecret = [{
        name: BinanceOrder.NAME_TAG_BINANCE_SECRET,
        payload: {
            data: Buffer.from('test_secret')
        }
    },
    {},
    {}
    ]

    beforeEach(() => {
        createTpSlOrderPrices.mockImplementation(
            (orderInfo: any, takeProfit: number, stopLoss: number): TpAndSl => {
                const side = orderInfo.side === 'buy' ? 'sell' : 'buy'
                const stopLossPrice = orderInfo.price * stopLoss
                const takeProfitPrice = orderInfo.price * takeProfit
                return { side, stopLossPrice, takeProfitPrice }
            }
        )
    })

    afterEach(() => {
        getAvailableBalanceSpyOn.mockRestore()
        newOrderSpyOn.mockRestore()
        stopOrderSpyOn.mockRestore()
        takeProfitOrderSpyOn.mockRestore()
        createTpSlOrderPrices.mockRestore()
        accessSecretVersionSpyOn.mockRestore()
        getOrdersSpyOn.mockRestore()
        cancelOrdersSpyOn.mockRestore()
    })

    test('BTC future ロング', async () => {
        const req = {
            body: {
                botName: 'test bot',
                ticker: 'BTCUSDTPERP',
                symbol: 'BTCUSDT',
                type: 'future',
                marginCoin: 'USDT',
                strategy: {
                    order: {
                        price: '45000',
                        action: 'buy',
                        contracts: '1',
                        id: 'long entry id',
                        comment: 'entry'
                    },
                    marketPosition: 'long',
                    market_position_size: '0.01',
                    positionSize: '-0.01'
                }
            }
        } as Request
        getAvailableBalanceSpyOn.mockResolvedValue(availableBalance)
        newOrderSpyOn.mockImplementation(
            async (symbol: string, side: Side, amount: number, limitPrice: number): Promise<any> => {
                return {
                    symbol,
                    side,
                    amount,
                    price: limitPrice
                }
            }
        )
        const currentPrice = Number(req.body.strategy.order.price)
        const expectLimitPrice = currentPrice * BinanceOrder.BTC_LONG_LIMIT_WIDTH
        const expectAmount = (availableBalance / currentPrice) * BinanceOrder.BTC_LEVERAGE
        const newOrderResponse = {
            symbol: req.body.symbol,
            side: req.body.strategy.order.action,
            amount: expectAmount,
            price: expectLimitPrice
        }
        const expectPrices = {
            side: 'sell',
            stopLossPrice: expectLimitPrice * BinanceOrder.BTC_LONG_SL_WIDTH,
            takeProfitPrice: expectLimitPrice * BinanceOrder.BTC_LONG_TP_WIDTH
        }

        accessSecretVersionSpyOn.mockImplementationOnce(async () => {
            return accessSecretKey
        }).mockImplementationOnce(async () => {
            return accessSecret
        })

        const result = await binanceOrder(req, res)
        expect(getAvailableBalanceSpyOn).toHaveBeenCalledWith(req.body.marginCoin)
        expect(newOrderSpyOn).toHaveBeenCalledWith(
            req.body.symbol,
            req.body.strategy.order.action,
            expectAmount,
            expectLimitPrice
        )
        expect(stopOrderSpyOn).toHaveBeenCalledWith(newOrderResponse, expectPrices)
        expect(takeProfitOrderSpyOn).toHaveBeenCalledWith(newOrderResponse, expectPrices)
        expect(result).toBe('order success')
    })

    test('BTC delivery ロング', async () => {
        const req = {
            body: {
                botName: 'test bot',
                ticker: 'BTCPERP',
                symbol: 'BTCUSD_PERP',
                type: 'delivery',
                marginCoin: 'BTC',
                strategy: {
                    order: {
                        price: '45000',
                        action: 'buy',
                        contracts: '1',
                        id: 'long entry id',
                        comment: 'entry'
                    },
                    marketPosition: 'long',
                    market_position_size: '0.01',
                    positionSize: '-0.01'
                }
            }
        } as Request
        getAvailableBalanceSpyOn.mockResolvedValue(availableBalance)
        newOrderSpyOn.mockImplementation(
            async (symbol: string, side: Side, amount: number, limitPrice: number): Promise<any> => {
                return {
                    symbol,
                    side,
                    amount,
                    price: limitPrice
                }
            }
        )
        const currentPrice = Number(req.body.strategy.order.price)
        const expectLimitPrice = currentPrice * BinanceOrder.BTC_LONG_LIMIT_WIDTH
        let minimumUnit = BinanceOrder.BTC_USD_MINIMUM_AMOUNT / currentPrice
        minimumUnit = Math.floor(minimumUnit * 100000) / 100000
        const expectAmount = Math.floor(availableBalance / minimumUnit) * BinanceOrder.BTC_LEVERAGE
        const newOrderResponse = {
            symbol: req.body.symbol,
            side: req.body.strategy.order.action,
            amount: expectAmount,
            price: expectLimitPrice
        }
        const expectPrices = {
            side: 'sell',
            stopLossPrice: expectLimitPrice * BinanceOrder.BTC_LONG_SL_WIDTH,
            takeProfitPrice: expectLimitPrice * BinanceOrder.BTC_LONG_TP_WIDTH
        }

        accessSecretVersionSpyOn.mockImplementationOnce(async () => {
            return accessSecretKey
        }).mockImplementationOnce(async () => {
            return accessSecret
        })

        const result = await binanceOrder(req, res)
        expect(getAvailableBalanceSpyOn).toHaveBeenCalledWith(req.body.marginCoin)
        expect(newOrderSpyOn).toHaveBeenCalledWith(
            req.body.symbol,
            req.body.strategy.order.action,
            expectAmount,
            expectLimitPrice
        )
        expect(stopOrderSpyOn).toHaveBeenCalledWith(newOrderResponse, expectPrices)
        expect(takeProfitOrderSpyOn).toHaveBeenCalledWith(newOrderResponse, expectPrices)
        expect(result).toBe('order success')
    })

    test('BTC future ショート', async () => {
        const req = {
            body: {
                botName: 'test bot',
                ticker: 'BTCUSDTPERP',
                symbol: 'BTCUSDT',
                type: 'future',
                marginCoin: 'USDT',
                strategy: {
                    order: {
                        price: '45000',
                        action: 'sell',
                        contracts: '1',
                        id: 'sell entry id',
                        comment: 'entry'
                    },
                    marketPosition: 'short',
                    market_position_size: '0.01',
                    positionSize: '-0.01'
                }
            }
        } as Request
        getAvailableBalanceSpyOn.mockResolvedValue(availableBalance)
        newOrderSpyOn.mockImplementation(
            async (symbol: string, side: Side, amount: number, limitPrice: number): Promise<any> => {
                return {
                    symbol,
                    side,
                    amount,
                    price: limitPrice
                }
            }
        )
        const currentPrice = Number(req.body.strategy.order.price)
        const expectLimitPrice = currentPrice * BinanceOrder.BTC_SHORT_LIMIT_WIDTH
        const expectAmount = (availableBalance / currentPrice) * BinanceOrder.BTC_LEVERAGE
        const newOrderResponse = {
            symbol: req.body.symbol,
            side: req.body.strategy.order.action,
            amount: expectAmount,
            price: expectLimitPrice
        }
        const expectPrices = {
            side: 'buy',
            stopLossPrice: expectLimitPrice * BinanceOrder.BTC_SHORT_SL_WIDTH,
            takeProfitPrice: expectLimitPrice * BinanceOrder.BTC_SHORT_TP_WIDTH
        }
        accessSecretVersionSpyOn.mockImplementationOnce(async () => {
            return accessSecretKey
        }).mockImplementationOnce(async () => {
            return accessSecret
        })
        const result = await binanceOrder(req, res)
        expect(getAvailableBalanceSpyOn).toHaveBeenCalledWith(req.body.marginCoin)
        expect(newOrderSpyOn).toHaveBeenCalledWith(
            req.body.symbol,
            req.body.strategy.order.action,
            expectAmount,
            expectLimitPrice
        )
        expect(stopOrderSpyOn).toHaveBeenCalledWith(newOrderResponse, expectPrices)
        expect(takeProfitOrderSpyOn).toHaveBeenCalledWith(newOrderResponse, expectPrices)
        expect(result).toBe('order success')
    })

    test('BTC delivery ショート', async () => {
        const req = {
            body: {
                botName: 'test bot',
                ticker: 'BTCUSDTPERP',
                symbol: 'BTCUSDT',
                type: 'delivery',
                marginCoin: 'USDT',
                strategy: {
                    order: {
                        price: '45000',
                        action: 'sell',
                        contracts: '1',
                        id: 'sell entry id',
                        comment: 'entry'
                    },
                    marketPosition: 'short',
                    market_position_size: '0.01',
                    positionSize: '-0.01'
                }
            }
        } as Request
        getAvailableBalanceSpyOn.mockResolvedValue(availableBalance)
        newOrderSpyOn.mockImplementation(
            async (symbol: string, side: Side, amount: number, limitPrice: number): Promise<any> => {
                return {
                    symbol,
                    side,
                    amount,
                    price: limitPrice
                }
            }
        )
        const currentPrice = Number(req.body.strategy.order.price)
        const expectLimitPrice = currentPrice * BinanceOrder.BTC_SHORT_LIMIT_WIDTH
        let minimumUnit = BinanceOrder.BTC_USD_MINIMUM_AMOUNT / currentPrice
        minimumUnit = Math.floor(minimumUnit * 100000) / 100000
        const expectAmount = Math.floor(availableBalance / minimumUnit) * BinanceOrder.BTC_LEVERAGE
        const newOrderResponse = {
            symbol: req.body.symbol,
            side: req.body.strategy.order.action,
            amount: expectAmount,
            price: expectLimitPrice
        }
        const expectPrices = {
            side: 'buy',
            stopLossPrice: expectLimitPrice * BinanceOrder.BTC_SHORT_SL_WIDTH,
            takeProfitPrice: expectLimitPrice * BinanceOrder.BTC_SHORT_TP_WIDTH
        }
        accessSecretVersionSpyOn.mockImplementationOnce(async () => {
            return accessSecretKey
        }).mockImplementationOnce(async () => {
            return accessSecret
        })
        const result = await binanceOrder(req, res)
        expect(getAvailableBalanceSpyOn).toHaveBeenCalledWith(req.body.marginCoin)
        expect(newOrderSpyOn).toHaveBeenCalledWith(
            req.body.symbol,
            req.body.strategy.order.action,
            expectAmount,
            expectLimitPrice
        )
        expect(stopOrderSpyOn).toHaveBeenCalledWith(newOrderResponse, expectPrices)
        expect(takeProfitOrderSpyOn).toHaveBeenCalledWith(newOrderResponse, expectPrices)
        expect(result).toBe('order success')
    })

    test('ALT ロング', async () => {
        const req = {
            body: {
                botName: 'test bot',
                ticker: 'XRPUSDTPERP',
                symbol: 'XRPUSDT',
                type: 'future',
                marginCoin: 'USDT',
                strategy: {
                    order: {
                        price: '1.5',
                        action: 'buy',
                        contracts: '1',
                        id: 'long entry id',
                        comment: 'entry'
                    },
                    marketPosition: 'long',
                    market_position_size: '0.01',
                    positionSize: '-0.01'
                }
            }
        } as Request
        getAvailableBalanceSpyOn.mockResolvedValue(availableBalance)
        newOrderSpyOn.mockImplementation(
            async (symbol: string, side: Side, amount: number, limitPrice: number): Promise<any> => {
                return {
                    symbol,
                    side,
                    amount,
                    price: limitPrice
                }
            }
        )
        const currentPrice = Number(req.body.strategy.order.price)
        const expectLimitPrice = currentPrice * BinanceOrder.ALT_LONG_LIMIT_WIDTH
        const expectAmount = (availableBalance / currentPrice) * BinanceOrder.ALT_LEVERAGE
        const newOrderResponse = {
            symbol: req.body.symbol,
            side: req.body.strategy.order.action,
            amount: expectAmount,
            price: expectLimitPrice
        }
        const expectPrices = {
            side: 'sell',
            stopLossPrice: expectLimitPrice * BinanceOrder.ALT_LONG_SL_WIDTH,
            takeProfitPrice: expectLimitPrice * BinanceOrder.ALT_LONG_TP_WIDTH
        }
        accessSecretVersionSpyOn.mockImplementationOnce(async () => {
            return accessSecretKey
        }).mockImplementationOnce(async () => {
            return accessSecret
        })
        const result = await binanceOrder(req, res)
        expect(getAvailableBalanceSpyOn).toHaveBeenCalledWith(req.body.marginCoin)
        expect(newOrderSpyOn).toHaveBeenCalledWith(
            req.body.symbol,
            req.body.strategy.order.action,
            expectAmount,
            expectLimitPrice
        )
        expect(stopOrderSpyOn).toHaveBeenCalledWith(newOrderResponse, expectPrices)
        expect(takeProfitOrderSpyOn).toHaveBeenCalledWith(newOrderResponse, expectPrices)
        expect(result).toBe('order success')
    })

    test('ALT ショート', async () => {
        const req = {
            body: {
                botName: 'test bot',
                ticker: 'XRPUSDTPERP',
                symbol: 'XRPUSDT',
                type: 'future',
                marginCoin: 'USDT',
                strategy: {
                    order: {
                        price: '1.5',
                        action: 'sell',
                        contracts: '1',
                        id: 'sell entry id',
                        comment: 'entry'
                    },
                    marketPosition: 'short',
                    market_position_size: '0.01',
                    positionSize: '-0.01'
                }
            }
        } as Request
        getAvailableBalanceSpyOn.mockResolvedValue(availableBalance)
        newOrderSpyOn.mockImplementation(
            async (symbol: string, side: Side, amount: number, limitPrice: number): Promise<any> => {
                return {
                    symbol,
                    side,
                    amount,
                    price: limitPrice
                }
            }
        )
        const currentPrice = Number(req.body.strategy.order.price)
        const expectLimitPrice = currentPrice * BinanceOrder.ALT_SHORT_LIMIT_WIDTH
        const expectAmount = (availableBalance / currentPrice) * BinanceOrder.ALT_LEVERAGE
        const newOrderResponse = {
            symbol: req.body.symbol,
            side: req.body.strategy.order.action,
            amount: expectAmount,
            price: expectLimitPrice
        }
        const expectPrices = {
            side: 'buy',
            stopLossPrice: expectLimitPrice * BinanceOrder.ALT_SHORT_SL_WIDTH,
            takeProfitPrice: expectLimitPrice * BinanceOrder.ALT_SHORT_TP_WIDTH
        }
        accessSecretVersionSpyOn.mockImplementationOnce(async () => {
            return accessSecretKey
        }).mockImplementationOnce(async () => {
            return accessSecret
        })
        const result = await binanceOrder(req, res)
        expect(newOrderSpyOn).toHaveBeenCalledWith(
            req.body.symbol,
            req.body.strategy.order.action,
            expectAmount,
            expectLimitPrice
        )
        expect(stopOrderSpyOn).toHaveBeenCalledWith(newOrderResponse, expectPrices)
        expect(takeProfitOrderSpyOn).toHaveBeenCalledWith(newOrderResponse, expectPrices)
        expect(result).toBe('order success')
    })

    test('does not have request.body.strategy ', async () => {
        const req = {
            body: {
                botName: 'test bot',
                ticker: 'XRPUSDTPERP',
                symbol: 'XRPUSDT',
                type: "future",
                marginCoin: 'USDT',
                strategy: null
            }
        } as Request
        const result = await binanceOrder(req, res)
        expect(result).toBe('not entry request')
    })

    test('request.body.strategy.order.comment === exit', async () => {
        const req = {
            body: {
                botName: 'test bot',
                ticker: 'XRPUSDTPERP',
                symbol: 'XRPUSDT',
                type: "future",
                marginCoin: 'USDT',
                strategy: {
                    order: {
                        price: '1.5',
                        action: 'sell',
                        contracts: '1',
                        id: 'sell entry id',
                        comment: 'exit'
                    },
                    marketPosition: 'short',
                    market_position_size: '0.01',
                    positionSize: '-0.01'
                }
            }
        } as Request
        const orders = [
            {
                id: 'order_id_1',
                symbol: 'XRPUSDT'
            },
            {
                id: 'order_id_2',
                symbol: 'XRPUSDT'
            }
        ]

        accessSecretVersionSpyOn.mockImplementationOnce(async () => {
            return accessSecretKey
        }).mockImplementationOnce(async () => {
            return accessSecret
        })
        getOrdersSpyOn.mockImplementationOnce(async (): Promise<any> => {
            return orders
        })
        const result = await binanceOrder(req, res)
        expect(getOrdersSpyOn).toHaveBeenCalledWith(req.body.symbol)
        expect(cancelOrdersSpyOn).toHaveBeenCalledWith(orders)
        expect(result).toBe('open orders canceled')
    })

    test('オーダーキャンセル失敗', async () => {
        const req = {
            body: {
                botName: 'test bot',
                ticker: 'XRPUSDTPERP',
                symbol: 'XRPUSDT',
                type: "future",
                marginCoin: 'USDT',
                strategy: {
                    order: {
                        price: '1.5',
                        action: 'sell',
                        contracts: '1',
                        id: 'sell entry id',
                        comment: 'exit'
                    },
                    marketPosition: 'short',
                    market_position_size: '0.01',
                    positionSize: '-0.01'
                }
            }
        } as Request
        const orders = [
            {
                id: 'order_id_1',
                symbol: 'XRPUSDT'
            },
            {
                id: 'order_id_2',
                symbol: 'XRPUSDT'
            }
        ]

        accessSecretVersionSpyOn.mockImplementationOnce(async () => {
            return accessSecretKey
        }).mockImplementationOnce(async () => {
            return accessSecret
        })
        getOrdersSpyOn.mockImplementationOnce(async (): Promise<any> => {
            return orders
        })
        cancelOrdersSpyOn.mockImplementationOnce(async () => {
            throw new Error('cancelOrders error')
        })
        const result = await binanceOrder(req, res)
        expect(getOrdersSpyOn).toHaveBeenCalledWith(req.body.symbol)
        expect(cancelOrdersSpyOn).toHaveBeenCalledWith(orders)
        expect(result).toBe('cancel orders error')
    })

    test('body.marginCoin(証拠金)がアルトコイン', async () => {
        const req = {
            body: {
                botName: 'test bot',
                ticker: 'XRPPERP',
                symbol: 'XRPUSD_PERP',
                type: "delivery",
                marginCoin: 'XRP',
                strategy: {
                    order: {
                        price: '1.5',
                        action: 'sell',
                        contracts: '1',
                        id: 'sell entry id',
                        comment: 'entry'
                    },
                    marketPosition: 'short',
                    market_position_size: '0.01',
                    positionSize: '-0.01'
                }
            }
        } as Request
        const result = await binanceOrder(req, res)
        expect(result).toBe('Bad request. Altcoin cannot be used for margin')
    })

    test('API key取得失敗', async () => {
        const req = {
            body: {
                botName: 'test bot',
                ticker: 'XRPUSDTPERP',
                symbol: 'XRPUSDT',
                type: "future",
                marginCoin: 'USDT',
                strategy: {
                    order: {
                        price: '1.5',
                        action: 'sell',
                        contracts: '1',
                        id: 'sell entry id',
                        comment: 'entry'
                    },
                    marketPosition: 'short',
                    market_position_size: '0.01',
                    positionSize: '-0.01'
                }
            }
        } as Request
        accessSecretVersionSpyOn.mockImplementationOnce(async () => {
            throw new Error('access secret version error')
        })
        const result = await binanceOrder(req, res)
        expect(result).toBe('get accessSecretVersion error')
    })

    test('availableBalance取得失敗', async () => {
        const req = {
            body: {
                botName: 'test bot',
                ticker: 'XRPUSDTPERP',
                symbol: 'XRPUSDT',
                type: "future",
                marginCoin: 'USDT',
                strategy: {
                    order: {
                        price: '1.5',
                        action: 'sell',
                        contracts: '1',
                        id: 'sell entry id',
                        comment: 'entry'
                    },
                    marketPosition: 'short',
                    market_position_size: '0.01',
                    positionSize: '-0.01'
                }
            }
        } as Request
        getAvailableBalanceSpyOn.mockImplementation(() => {
            throw new Error('error')
        })
        newOrderSpyOn.mockImplementation(
            async (symbol: string, side: Side, amount: number, limitPrice: number): Promise<any> => {
                return {
                    symbol,
                    side,
                    amount,
                    price: limitPrice
                }
            }
        )
        accessSecretVersionSpyOn.mockImplementationOnce(async () => {
            return accessSecretKey
        }).mockImplementationOnce(async () => {
            return accessSecret
        })
        const result = await binanceOrder(req, res)
        expect(result).toBe('getAvailableBalance error')
    })

    test('利用可能な証拠金がない', async () => {
        const req = {
            body: {
                botName: 'test bot',
                ticker: 'XRPUSDTPERP',
                symbol: 'XRPUSDT',
                type: "future",
                marginCoin: 'USDT',
                strategy: {
                    order: {
                        price: '1.5',
                        action: 'sell',
                        contracts: '1',
                        id: 'sell entry id',
                        comment: 'entry'
                    },
                    marketPosition: 'short',
                    market_position_size: '0.01',
                    positionSize: '-0.01'
                }
            }
        } as Request
        getAvailableBalanceSpyOn.mockResolvedValue(0)
        accessSecretVersionSpyOn.mockImplementationOnce(async () => {
            return accessSecretKey
        }).mockImplementationOnce(async () => {
            return accessSecret
        })
        const result = await binanceOrder(req, res)
        expect(result).toBe('no available balance')
    })

    test('注文失敗', async () => {
        const req = {
            body: {
                botName: 'test bot',
                ticker: 'XRPUSDTPERP',
                symbol: 'XRPUSDT',
                type: "future",
                marginCoin: 'USDT',
                strategy: {
                    order: {
                        price: '1.5',
                        action: 'sell',
                        contracts: '1',
                        id: 'sell entry id',
                        comment: 'entry'
                    },
                    marketPosition: 'short',
                    market_position_size: '0.01',
                    positionSize: '-0.01'
                }
            }
        } as Request
        getAvailableBalanceSpyOn.mockResolvedValue(availableBalance)
        newOrderSpyOn.mockImplementation(async (): Promise<any> => {
            throw new Error('error')
        })
        accessSecretVersionSpyOn.mockImplementationOnce(async () => {
            return accessSecretKey
        }).mockImplementationOnce(async () => {
            return accessSecret
        })
        const currentPrice = Number(req.body.strategy.order.price)
        const expectLimitPrice = currentPrice * BinanceOrder.ALT_SHORT_LIMIT_WIDTH
        const expectAmount = (availableBalance / currentPrice) * BinanceOrder.ALT_LEVERAGE
        const result = await binanceOrder(req, res)
        expect(newOrderSpyOn).toHaveBeenCalledWith(
            req.body.symbol,
            req.body.strategy.order.action,
            expectAmount,
            expectLimitPrice
        )
        expect(result).toBe('order error')
    })
})
