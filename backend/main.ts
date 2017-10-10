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
import BlueBird from 'bluebird'
import { ErrorMessage } from '../interface'

Dotenv.config()

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
    let db_port = <string | undefined>process.env['DB_PORT']
    let storage_server = <string | undefined>process.env['STORAGE_SERVER']
    let num_worker = <string | undefined>process.env['NUM_WORKER']
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
            db_port: parseInt(db_port),
            storage_server,
            num_worker: parseInt(num_worker)
        }
    }
}

interface AsyncRedisClient extends Redis.RedisClient {
    hsetnxAsync(...args: any[]): Promise<number>
    hincrbyAsync(...args: any[]): Promise<number>
    hmsetAsync(...args: any[]): Promise<string>
    expireAsync(...args: any[]): Promise<number>
}

const config = load_config()
const db = BlueBird.promisifyAll(Redis.createClient(config.db_port, config.db_host)) as AsyncRedisClient
const app = Express()
app.use(Morgan('combined'))
app.use(BodyParser.json())
app.use(Useragent.express())

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

    static async new(id: string, size: number): Promise<Session | 'EDUP' | 'EOTH'> {
        try {
            let storage_server = config.storage_server
            if (await db.hsetnxAsync(`SESSION@${id}`, 'storage_server', storage_server) !== 1) {
                return 'EDUP'
            }
            let res = await Axios.post(`${storage_server}/new`, JSON.stringify({ size, preserve_mode: true }))
            if (res.status !== 200) {
                return 'EOTH'
            }
            let data: NewResponse = res.data
            if (await db.hmsetAsync(`SESSION@${id}`, {
                size: size,
                flow_id: data.id,
                flow_token: data.token
            }) !== 'OK') {
                return 'EOTH'
            }
            if (await db.expireAsync(`SESSION@${id}`, 300) !== 1) {
                return 'EOTH'
            }
            return new Session(id, size, storage_server, data.id, data.token)
        } catch(err) {
            return 'EOTH'
        }
    }

    static async get(id: string): Promise<Session | null> {
        try {
            let data: any[] = await (<any>db.multi().hmget(`SESSION@${id}`, ['size', 'storage_server', 'flow_id', 'flow_token']).del(`SESSION@${id}`)).execAsync()
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

async function create_session(id: string, size: number): Promise<Session | [number, ErrorMessage]> {
    if (validate_id(id) === false) {
        return [400, ErrorMessage.INVALID_ID]
    }
    if (size <= 0) {
        return [400, ErrorMessage.INVALID_PARAM]
    }
    let session = await Session.new(id, size)
    if (session === 'EOTH') {
        return [500, ErrorMessage.INTERNAL]
    } else if (session === 'EDUP') {
        return [400, ErrorMessage.DUPLICATED_ID]
    }
    return session
}

async function route_direct_upload(req: Http.IncomingMessage, res: Http.ServerResponse): Promise<boolean> {
    if ((req.method !== 'POST' && req.method !== 'PUT') || req.url === undefined) {
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
    let content_length = req.headers['content-length']
    if (typeof content_length !== 'string') {
        res.statusCode = 400
        res.end(ErrorMessage.INVALID_PARAM)
        return true;
    }
    let session = await create_session(matches[1], parseInt(content_length))
    if (!(session instanceof Session)) {
        let [code, message] = session
        res.statusCode = code
        res.end(message)
        return true
    }
    res.writeHead(307, { location: `${session.storage_server}/flow/${session.flow_id}/push?token=${session.flow_token}` })
    res.end()
    return true
}

app.post(REGEX_ROUTE_UPLOAD, async (req: any, res: any) => {
    let id: string = req.params['id']
    let upload_param: UploadBody = req.body
    if (upload_param.size === undefined) {
        res.status(400).json({ msg: ErrorMessage.INVALID_PARAM })
        return
    }
    let session = await create_session(id, upload_param.size)
    if (!(session instanceof Session)) {
        let [code, message] = session
        res.status(code).json({ msg: message })
        return
    }
    res.json({
        storage_server: session.storage_server,
        flow_id: session.flow_id,
        flow_token: session.flow_token,
    })
})

app.get(REGEX_ROUTE_DIRECT_DOWNLOAD, async (req:any , res: any) => {
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
    let session = await Session.get(id)
    if (session === null) {
        res.status(404).send()
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
