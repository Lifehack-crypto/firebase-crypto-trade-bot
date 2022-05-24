import { Side } from '../types/utils/ccxtWrapper'

export default class CryptoUtils {
    static isLong(side: Side): boolean {
        if (side === 'sell') {
            return false
        }
        return true
    }

    static isBTC(symbol: string): boolean {
        return Boolean(symbol.match('BTC'))
    }

    static isUSDT(symbol: string): boolean {
        return Boolean(symbol.match('USDT'))
    }
}
