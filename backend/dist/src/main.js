"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Cluster = require("cluster");
const Http = require("http");
const Express = require("express");
const Morgan = require("morgan");
const BodyParser = require("body-parser");
const Url = require("url");
const Redis = require("redis");
const Dotenv = require("dotenv");
const Useragent = require("express-useragent");
const axios_1 = require("axios");
const PathToRegexp = require("path-to-regexp");
const util_1 = require("util");
const interface_1 = require("../inc/interface");
const idgen_1 = require("./idgen");
Dotenv.config();
const ID_FORMAT = '\\w{4,}';
const REGEX_ROUTE_CREATE = `/api/create`;
// const REGEX_ROUTE_POLLEVENT = `/api/id/:id(${ID_FORMAT})/poll`
const REGEX_ROUTE_DIRECT_DOWNLOAD = `/:id(${ID_FORMAT})/:filename?`;
const REGEX_ROUTE_DIRECT_UPLOAD = PathToRegexp(`/:id(${ID_FORMAT})/:filename?`);
const REGEX_BOT_WHITELIST = new RegExp('(curl|wget)');
function load_config() {
    let listen_host = process.env['LISTEN_HOST'];
    let listen_port = process.env['LISTEN_PORT'];
    let db_host = process.env['DB_HOST'];
    let db_port = process.env['DB_PORT'];
    let storage_server = process.env['STORAGE_SERVER'];
    let num_worker = process.env['NUM_WORKER'];
    if (listen_host === undefined || listen_port === undefined ||
        db_host === undefined || db_port === undefined ||
        storage_server === undefined || num_worker === undefined) {
        console.error('Invalid dotenv configuration.');
        return process.exit(1);
    }
    else {
        return {
            listen_host,
            listen_port,
            db_host,
            db_port: parseInt(db_port),
            storage_server,
            num_worker: parseInt(num_worker)
        };
    }
}
const config = load_config();
const idgen = new idgen_1.default();
const client = Redis.createClient(config.db_port, config.db_host);
const db = {
    hsetnxAsync: util_1.promisify(client.hsetnx).bind(client),
    hgetAsync: util_1.promisify(client.hget).bind(client),
    hmsetAsync: util_1.promisify(client.hmset).bind(client),
    hmgetAsync: util_1.promisify(client.hmget).bind(client),
    expireAsync: util_1.promisify(client.expire).bind(client),
    renameAsync: util_1.promisify(client.rename).bind(client),
    delAsync: util_1.promisify(client.del).bind(client),
    publishAsync: util_1.promisify(client.publish).bind(client),
    subscribeAsync: util_1.promisify(client.subscribe).bind(client)
};
const app = Express();
app.use(Morgan('combined'));
app.use(BodyParser.json());
app.use(Useragent.express());
class Session {
    constructor(id, size, storage_server, flow_id, flow_token) {
        this.id = id;
        this.size = size;
        this.storage_server = storage_server;
        this.flow_id = flow_id;
        this.flow_token = flow_token;
    }
    static new(id, size) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let storage_server = config.storage_server;
                if ((yield db.hsetnxAsync(`SESSION@${id}`, 'storage_server', storage_server)) !== 1) {
                    return 'EDUP';
                }
                let res = yield axios_1.default.post(`${storage_server}/new`, JSON.stringify({ size, preserve_mode: true }));
                if (res.status !== 200) {
                    return 'EOTH';
                }
                let data = res.data;
                if ((yield db.hmsetAsync(`SESSION@${id}`, {
                    size: size,
                    flow_id: data.id,
                    flow_token: data.token
                })) !== 'OK') {
                    return 'EOTH';
                }
                if ((yield db.expireAsync(`SESSION@${id}`, 300)) !== 1) {
                    return 'EOTH';
                }
                return new Session(id, size, storage_server, data.id, data.token);
            }
            catch (_a) {
                return 'EOTH';
            }
        });
    }
    static get(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield db.renameAsync(`SESSION@${id}`, `SESSION_SZIED@${id}`);
                let data = yield db.hmgetAsync(`SESSION_SZIED@${id}`, ['size', 'storage_server', 'flow_id', 'flow_token']);
                yield db.delAsync(`SESSION_SZIED@${id}`);
                let size = data[0];
                let storage_server = data[1];
                let flow_id = data[2];
                let flow_token = data[3];
                if (size === null || storage_server === null || flow_id === null || flow_token === null) {
                    return null;
                }
                return new Session(id, size, storage_server, flow_id, flow_token);
            }
            catch (_a) {
                return null;
            }
        });
    }
}
function validate_id(id) {
    if (id.length < 4 || id.length > 64) {
        return false;
    }
    return true;
}
function create_session(id, size) {
    return __awaiter(this, void 0, void 0, function* () {
        if (validate_id(id) === false) {
            return [400, interface_1.ErrorMessage.INVALID_ID];
        }
        if (size <= 0) {
            return [400, interface_1.ErrorMessage.INVALID_PARAM];
        }
        let session = yield Session.new(id, size);
        if (session === 'EOTH') {
            return [500, interface_1.ErrorMessage.INTERNAL];
        }
        else if (session === 'EDUP') {
            return [400, interface_1.ErrorMessage.DUPLICATED_ID];
        }
        return session;
    });
}
function route_direct_upload(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if ((req.method !== 'POST' && req.method !== 'PUT') || req.url === undefined) {
            return false;
        }
        let req_path = Url.parse(req.url).pathname;
        if (req_path === undefined) {
            return false;
        }
        let matches = REGEX_ROUTE_DIRECT_UPLOAD.exec(req_path);
        if (matches === null) {
            return false;
        }
        // Routing matched
        let content_length = req.headers['content-length'];
        if (typeof content_length !== 'string') {
            res.statusCode = 400;
            res.end(interface_1.ErrorMessage.INVALID_PARAM);
            return true;
        }
        let session = yield create_session(matches[1], parseInt(content_length));
        if (!(session instanceof Session)) {
            let [code, message] = session;
            res.statusCode = code;
            res.end(message);
            return true;
        }
        res.writeHead(307, { location: `${session.storage_server}/flow/${session.flow_id}/push?token=${session.flow_token}` });
        res.end();
        return true;
    });
}
app.post(REGEX_ROUTE_CREATE, (req, res) => __awaiter(this, void 0, void 0, function* () {
    let create_param = req.body;
    if (create_param.file_size === undefined) {
        res.status(400).json({ msg: interface_1.ErrorMessage.INVALID_PARAM });
        return;
    }
    let id = '';
    let session = [500, interface_1.ErrorMessage.INTERNAL];
    for (let len = 6; len <= 8; len++) {
        id = yield idgen.gen(len);
        session = yield create_session(id, create_param.file_size);
        if (session instanceof Session) {
            break;
        }
        else {
            let [code, message] = session;
            if (message !== interface_1.ErrorMessage.DUPLICATED_ID) {
                break;
            }
        }
    }
    if (!(session instanceof Session)) {
        let [code, message] = session;
        res.status(code).json({ msg: message });
        return;
    }
    let data = {
        id,
        flow_storage: session.storage_server,
        flow_id: session.flow_id,
        flow_token: session.flow_token,
    };
    res.json(data);
}));
/*
app.post(REGEX_ROUTE_POLLEVENT, async (req: any, res: any) => {
    let id: string = req.params['id']
    let poll_param: PollBody = req.body
    if (validate_id(id) === false) {
        res.status(404).send()
        return
    }
    let sub_db = BlueBird.promisifyAll(Redis.createClient(config.db_port, config.db_host)) as AsyncRedisClient
    try {
        let get_promise = new Promise<string>((resolve, reject) => {
            sub_db.on(`message`, (channel: string, msg: string) => {
                if (msg === 'GET') {
                    resolve()
                }
            })
        })
        await sub_db.subscribeAsync(`NOTIFY@${id}/${poll_param.token}`)
        let flow_token = await db.hgetAsync(`SESSION@${id}`, 'flow_token')
        if (flow_token !== poll_param.token) {
            res.status(404).send()
            return
        }
        await get_promise
        res.json([{ event: 'GET' }])
    } catch {
        res.status(404).send()
        return
    } finally {
        sub_db.quit()
    }
})
*/
app.get(REGEX_ROUTE_DIRECT_DOWNLOAD, (req, res) => __awaiter(this, void 0, void 0, function* () {
    let ua = req.useragent;
    if (ua !== undefined) {
        if (ua.isBot && REGEX_BOT_WHITELIST.exec(ua.source.toLowerCase()) === null) {
            res.status(418).send();
            return;
        }
    }
    let id = req.params['id'];
    let filename = req.params['filename'];
    if (validate_id(id) === false) {
        res.status(404).send();
        return;
    }
    let session = yield Session.get(id);
    if (session === null) {
        res.status(404).send();
        return;
    }
    yield db.publishAsync(`NOTIFY@${session.id}/${session.flow_token}`, `GET`);
    if (filename === undefined) {
        filename = id;
    }
    res.redirect(`${session.storage_server}/flow/${session.flow_id}/pull?filename=${filename}`);
}));
let server = Http.createServer();
server.on('checkContinue', (req, res) => __awaiter(this, void 0, void 0, function* () {
    if ((yield route_direct_upload(req, res)) === false) {
        res.writeContinue();
        app(req, res);
    }
}));
server.on('request', (req, res) => __awaiter(this, void 0, void 0, function* () {
    if ((yield route_direct_upload(req, res)) === false) {
        app(req, res);
    }
}));
if (Cluster.isMaster) {
    for (let i = 0; i < config.num_worker; i++) {
        Cluster.fork();
    }
    console.log(`Droplet listening on ${config.listen_host}:${config.listen_port}`);
}
else {
    server.listen(config.listen_port, config.listen_host);
}
