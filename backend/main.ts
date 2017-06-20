import Cluster from 'cluster'
import Http from 'http'
import Express from 'express'
import Morgan from 'morgan'
import BodyParser from 'body-parser'
import Url from 'url'
import Redis from 'redis'
import Dotenv from 'dotenv'
import Useragent from 'express-useragent'
import Axios from 'axios'
import PathToRegexp from 'path-to-regexp'
import { ErrorMessage } from '../interface'

Dotenv.config()

const ERRMSG_INVALID_PARAM = 'Invalid Parameter'
const ERRMSG_INVALID_ID = 'Invalid ID'
const ERRMSG_DUPLICATED_ID = 'Duplicated ID'
const ID_FORMAT = '\\w{4,}'
const REGEX_ROUTE_UPLOAD = `/api/id/:id(${ID_FORMAT})/upload`
const REGEX_ROUTE_DIRECT_DOWNLOAD = `/:id(${ID_FORMAT})/:filename?`
const REGEX_ROUTE_DIRECT_UPLOAD = PathToRegexp(`/:id(${ID_FORMAT})/:filename?`)
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
const db = Redis.createClient(config.db_port, config.db_host)
const app = Express()
app.use(Morgan('combined'))
app.use(BodyParser.json())
app.use(Useragent.express())

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

interface UploadBody {
    size?: number
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
            let res = await Axios.post(`${storage_server}/new`, JSON.stringify({ size }))
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

async function route_direct_upload(req: Http.IncomingMessage, res: Http.ServerResponse): Promise<boolean> {
    if (req.method !== 'POST' && req.method !== 'PUT') {
        return false
    }
    if (req.url === undefined) {
        return false
    }
    let req_path = Url.parse(req.url).pathname
    if (req_path === undefined) {
        return false
    }
    let matches = REGEX_ROUTE_DIRECT_UPLOAD.exec(req_path)
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

app.post(REGEX_ROUTE_UPLOAD, async (req, res) => {
    let id: string = req.params['id']
    let upload_param: UploadBody = req.body
    if (upload_param.size === undefined) {
        res.status(400).json({ msg: ErrorMessage.INVALID_PARAM })
        return
    }
    if (validate_id(id) === false) {
        res.status(400).json({ msg: ErrorMessage.INVALID_ID })
        return
    }
    let session = await Session.new(id, upload_param.size)
    if (session === 'EOTH') {
        res.status(500).send()
        return
    }
    if (session === 'EDUP') {
        res.status(400).json({ msg: ErrorMessage.DUPLICATED_ID })
        return
    }
    res.json({
        storage_server: session.storage_server,
        flow_id: session.flow_id,
        flow_token: session.flow_token,
    })
})

app.get(REGEX_ROUTE_DIRECT_DOWNLOAD, async (req, res) => {
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

let server = Http.createServer()
server.on('checkContinue', async (req: any, res: any) => {
    if (await route_direct_upload(req, res) === false) {
        (<Http.ServerResponse>res).writeContinue()
        app(req, res)
    }
})
server.on('request', async (req: any, res: any) => {
    if (await route_direct_upload(req, res) === false) {
        app(req, res)
    }
})
if (Cluster.isMaster) {
    for (let i = 0; i < config.num_worker; i++) {
        Cluster.fork()
    }
    console.log(`Droplet listening on ${config.listen_host}:${config.listen_port}`)
} else {
    server.listen(config.listen_port, config.listen_host)
}
