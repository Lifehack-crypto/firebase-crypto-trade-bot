import { Request, Response } from 'firebase-functions'

export type BinanceOrderFunction = (request: Request, response: Response) => Promise<Response>
export type AccessSecret = {
    data: string
    name: string
}
