import * as cluster from 'cluster'
import * as http from 'http'
import * as express from 'express'
import * as morgan from 'morgan'
import * as url from 'url'
import * as redis from 'redis'
import * as dotenv from 'dotenv'
import * as useragent from 'express-useragent'
import axios from 'axios'
import Hashids from 'hashids'

dotenv.config()

const ERRMSG_INVALID_ID = '\r\n\r\nInvalid ID\r\n\r\n'
const ERRMSG_DUPLICATED_ID = '\r\n\r\nDuplicated ID\r\n\r\n'
const REGEX_ROUTE_GENID = new RegExp('^/d/gid$')
const REGEX_ROUTE_UPLOAD = new RegExp('^/d/(\w{4,})(/[^/]*)?$')
const REGEX_BOT_WHITELIST = new RegExp('(curl|wget)')

interface Config {
    listen_host: string
    listen_port: number
    db_host: string
    db_port: number
    storage_server: string
    num_worker: number
}

function load_config(): Config {
    let listen_host = <string | undefined>process.env['LISTEN_HOST']
    let listen_port = <number | undefined>process.env['LISTEN_PORT']
    let db_host = <string | undefined>process.env['DB_HOST']
    let db_port = parseInt(process.env['DB_PORT'])
    let storage_server = <string | undefined>process.env['STORAGE_SERVER']
    let num_worker = parseInt(process.env['NUM_WORKER'])
    if (
        listen_host === undefined || listen_port === undefined ||
        db_host === undefined || db_port === undefined ||
        storage_server === undefined || num_worker === undefined
    ) {
        console.error('Invalid dotenv configuration.')
        return process.exit(1)
    } else {
        return {
            listen_host,
            listen_port,
            db_host,
            db_port,
            storage_server,
            num_worker
        }
    }
}

const config = load_config()
const db = redis.createClient(config.db_port, config.db_host)
const hashids = new Hashids('', 4, 'abcdefghijklmnopqrstuvwxyz1234567890')
const app = express()
app.use(morgan('combined'))
app.use(useragent.express())

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
        if (await async_redis<number>(db.del.bind(db), `SESSION@${this.id}`) !== 1) {
            return 'EOTH'
        }
        return 'OK'
    }

    static async new(id: string, size: number): Promise<Session | 'EDUP' | 'EOTH'> {
        try {
            let storage_server = config.storage_server
            if (await async_redis<number>(db.hsetnx.bind(db), `SESSION@${id}`, 'storage_server', storage_server) !== 1) {
                return 'EDUP'
            }
            let res = await axios.post(`${storage_server}/new`, JSON.stringify({ size }))
            if (res.status !== 200) {
                return 'EOTH'
            }
            let data: NewResponse = res.data
            if (await async_redis<string>(db.hmset.bind(db), `SESSION@${id}`, {
                size: size,
                flow_id: data.id,
                flow_token: data.token
            }) !== 'OK') {
                return 'EOTH'
            }
            if (await async_redis<number>(db.expire.bind(db), `SESSION@${id}`, 300) !== 1) {
                return 'EOTH'
            }
            return new Session(id, size, storage_server, data.id, data.token)
        } catch(err) {
            return 'EOTH'
        }
    }

    static async load(id: string): Promise<Session | null> {
        try {
            let data = await async_redis<any[]>(db.hmget.bind(db), `SESSION@${id}`, ['size', 'storage_server', 'flow_id', 'flow_token'])
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
    if (req.method !== 'POST' && req.method !== 'PUT') {
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
    res.writeHead(307, { location: `${session.storage_server}/flow/${session.flow_id}/push?token=${session.flow_token}` })
    res.end()
    return true
}

app.post(REGEX_ROUTE_GENID, async (req, res) => {
    let counter = await async_redis<number>(db.incr.bind(db), 'GENID@COUNTER')
    let id = hashids.encode(counter)
    res.contentType('application/json')
    res.write(JSON.stringify({ id }))
    res.end()
})

app.get('/d/:id/:filename?', async (req, res) => {
    let ua = req.useragent
    if (ua !== undefined) {
        if (ua.isBot && REGEX_BOT_WHITELIST.exec(ua.source.toLowerCase()) === null) {
            res.status(418).send()
            return
        }
    }
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
    res.redirect(`${session.storage_server}/flow/${session.flow_id}/pull?filename=${filename}`)
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
if (cluster.isMaster) {
    for (let i = 0; i < config.num_worker; i++) {
        cluster.fork()
    }
    console.log(`Droplet listening on ${config.listen_host}:${config.listen_port}`)
} else {
    server.listen(config.listen_port, config.listen_host)
}
