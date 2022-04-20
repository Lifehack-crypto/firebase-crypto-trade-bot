export type TradingviewRequest = {
    botName: string // botの名前
    symbol: string // 手動設定したティッカー (tradingviewのティッカーが使えない時用)
    ticker: string // tradingviewのティッカー
    strategy: Strategy
}

export type Strategy = {
    order: StrategyOrder
    marketPosition: 'short' | 'long' // 現在ポジション
    market_position_size: string // 現在ポジション数
    positionSize: string
}

export type StrategyOrder = {
    price: string // 注文価格
    action: 'sell' | 'buy'
    contracts: string // 注文数量
    id: string // entry, exit関数のorder id
    comment: string // tradingviewのentry, exit関数で入力したコメント
}
