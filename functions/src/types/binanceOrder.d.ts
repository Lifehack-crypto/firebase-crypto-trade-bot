import { Request, Response } from 'express'

type BinanceOrderFunction = (request: Request, response: Response) => Promise<void>
