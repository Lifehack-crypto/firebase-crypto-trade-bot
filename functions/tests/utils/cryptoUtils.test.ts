import CryptoUtils from '../../src/utils/cryptoUtils'

describe('CryptoUtils', () => {
    describe('isBTC', () => {
        test('symbol = BTC', () => {
            expect(CryptoUtils.isBTC('BTCUSDT')).toBeTruthy()
        })

        test('symbol = XRP', () => {
            expect(CryptoUtils.isBTC('XRPSDT')).toBeFalsy()
        })
    })
    
    describe('isLong', () => {
        test('side = sell', () => {
            expect(CryptoUtils.isLong('sell')).toBeFalsy()
        })

        test('side = buy', () => {
            expect(CryptoUtils.isLong('buy')).toBeTruthy()
        })
    })

    describe('isLong', () => {
        test('symbol = ETH', () => {
            expect(CryptoUtils.isUSDT('ETH')).toBeFalsy()
        })

        test('symbol = USDT', () => {
            expect(CryptoUtils.isUSDT('USDT')).toBeTruthy()
        })
    })
})