import * as express from 'express'
import * as functions from 'firebase-functions'
import * as dotenv from 'dotenv'
import { IpFilter, IpDeniedError } from 'express-ipfilter'
import binanceOrder from './modules/binanceOrder'
// interface
import { HttpsFunction, Response } from 'firebase-functions'

dotenv.config()
const app: express.Express = express()
const allowListIps: string[] = process.env.ALLOW_IPS!.split(',')
const clientIp = (req: express.Request): string => {
    return req.headers['x-forwarded-for'] ? (req.headers['x-forwarded-for'] as string).split(',')[0] : ''
}
app.use(
    IpFilter(allowListIps, {
        detectIp: clientIp,
        mode: 'allow'
    })
)

app.use(
    (err: IpDeniedError, req: express.Request, res: express.Response, next: express.NextFunction): Response | void => {
        if (err instanceof IpDeniedError) {
            return res.status(401).send('Not allowed IP address')
        }
        next()
    }
)

app.use(express.json())
app.post('/order', binanceOrder)
export const binance: HttpsFunction = functions
    .runWith({
        memory: '1GB',
        minInstances: 1,
        maxInstances: 5
    })
    .https.onRequest(app)
