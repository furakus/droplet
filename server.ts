import * as http from 'http'
import * as express from 'express'
import * as url from 'url'
import * as redis from 'redis'
import axios from 'axios'
import * as dotenv from 'dotenv'

dotenv.config()

const ERRMSG_INVALID_ID = "\r\n\r\nInvalid ID\r\n\r\n"
const ERRMSG_DUPLICATED_ID = "\r\n\r\nDuplicated ID\r\n\r\n"
const REGEX_ROUTE_UPLOAD = new RegExp('^/d/([^/]+)(/[^/]*)?$')

const config = {
    db_host: <string>process.env['DB_HOST'],
    db_port: parseInt(process.env['DB_PORT']),
    storage_server: <string>process.env['STORAGE_SERVER']
}
const db = redis.createClient(config.db_port, config.db_host)
const app = express()

async function async_redis<T>(method: (...args: any[]) => boolean, ...args: any[]): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        method(...args, (err: Error, result: T) => {
            if (err !== null) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
}

interface NewResponse {
    id: string
    token: string
}

class Session {
    private constructor(
        public id: string,
        public size: number,
        public storage_server: string,
        public flow_id: string,
        public flow_token: string) {}

    async delete(): Promise<'OK' | 'EOTH'> {
        if (await async_redis<number>(db.del.bind(db), this.id) !== 1) {
            return 'EOTH'
        }
        return 'OK'
    }

    static async new(id: string, size: number): Promise<Session | 'EDUP' | 'EOTH'> {
        try {
            let storage_server = config.storage_server
            if (await async_redis<number>(db.hsetnx.bind(db), id, 'storage_server', storage_server) !== 1) {
                return 'EDUP'
            }
            let res = await axios.post(`${storage_server}/new`, JSON.stringify({ size }))
            if (res.status !== 200) {
                return 'EOTH'
            }
            let data: NewResponse = res.data
            if (await async_redis<string>(db.hmset.bind(db), id, {
                size: size,
                flow_id: data.id,
                flow_token: data.token
            }) !== 'OK') {
                return 'EOTH'
            }
            if (await async_redis<number>(db.expire.bind(db), id, 300) !== 1) {
                return 'EOTH'
            }
            return new Session(id, size, storage_server, data.id, data.token)
        } catch(err) {
            return 'EOTH'
        }
    }

    static async load(id: string): Promise<Session | null> {
        try {
            let data = await async_redis<any[]>(db.hmget.bind(db), id, ['size', 'storage_server', 'flow_id', 'flow_token'])
            let size: number | null = data[0]
            let storage_server: string | null = data[1]
            let flow_id: string | null = data[2]
            let flow_token: string | null = data[3]
            if (size === null || storage_server === null || flow_id === null || flow_token === null) {
                return null
            }
            return new Session(id, size, storage_server, flow_id, flow_token)
        } catch(err) {
            return null
        }
    }
}

function validate_id(id: string): boolean {
    if (id.length < 4 || id.length > 64) {
        return false
    }
    return true
}

async function route_upload(req: http.IncomingMessage, res: http.ServerResponse): Promise<boolean> {
    if (req.method !== 'POST') {
        return false
    }
    if (req.url === undefined) {
        return false
    }
    let req_path = url.parse(req.url).pathname
    if (req_path === undefined) {
        return false
    }
    let matches = REGEX_ROUTE_UPLOAD.exec(req_path)
    if (matches === null) {
        return false
    }
    // Routing matched
    let size: number = parseInt(req.headers['content-length'])
    if (size === 0) {
        res.statusCode = 400
        res.end()
        return true
    }
    let id = matches[1]
    if (validate_id(id) === false) {
        res.statusCode = 400
        res.end(ERRMSG_INVALID_ID)
        return true
    }
    let session = await Session.new(id, size)
    if (session === 'EOTH') {
        res.statusCode = 500
        res.end()
        return true
    }
    if (session === 'EDUP') {
        res.statusCode = 400
        res.end(ERRMSG_DUPLICATED_ID)
        return true
    }
    res.writeHead(307, { location: `${session.storage_server}/${session.flow_id}/push?token=${session.flow_token}` })
    res.end()
    return true
}

app.get('/d/:id/:filename?', async (req, res) => {
    let id: string = req.params['id']
    let filename: string | undefined = req.params['filename']
    if (validate_id(id) === false) {
        res.status(404).send()
        return
    }
    let session = await Session.load(id)
    if (session === null) {
        res.status(404).send()
        return
    }
    if (await session.delete() !== 'OK') {
        res.status(500).send()
        return
    }
    if (filename === undefined) {
        filename = id
    }
    res.redirect(`${session.storage_server}/${session.flow_id}/pull?filename=${filename}`)
})

let server = http.createServer()
server.on('checkContinue', async (req: any, res: any) => {
    if (await route_upload(req, res) === false) {
        (<http.ServerResponse>res).writeContinue()
        app(req, res)
    }
})
server.on('request', async (req: any, res: any) => {
    if (await route_upload(req, res) === false) {
        app(req, res)
    }
})
server.listen(8080)
