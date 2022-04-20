import * as supertest from 'supertest'
import * as cloudFunctions from '../src/index'

const request = supertest(cloudFunctions.binance)
describe('index', () => {
    beforeEach(() => {
        jest.mock('firebase-admin', () => ({
            initializeApp: jest.fn()
        }))
    })

    test('IpDeniedError', async () => {
        const response = await request.post('/order')
        expect(response.statusCode).toBe(401)
        expect(response.text).toBe('Not allowed IP address')
    })

    test('Allowed IP. Successful request', async () => {
        const response = await request.post('/order').set('x-forwarded-for', `${process.env.ALLOW_IPS}`)
        expect(response.statusCode).toBe(200)
    })
})
