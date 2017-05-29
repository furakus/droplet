/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 9);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = require("axios");

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("cluster");

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("dotenv");

/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = require("express");

/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("express-useragent");

/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = require("http");

/***/ }),
/* 6 */
/***/ (function(module, exports) {

module.exports = require("morgan");

/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = require("redis");

/***/ }),
/* 8 */
/***/ (function(module, exports) {

module.exports = require("url");

/***/ }),
/* 9 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_cluster__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_cluster___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_cluster__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_http__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_http___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_http__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_express__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_express___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_express__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_morgan__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_morgan___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_morgan__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_url__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_url___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_url__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_redis__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_redis___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5_redis__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6_dotenv__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6_dotenv___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_6_dotenv__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7_express_useragent__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7_express_useragent___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_7_express_useragent__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8_axios__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8_axios___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_8_axios__);
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};









__WEBPACK_IMPORTED_MODULE_6_dotenv__["config"]();
const ERRMSG_INVALID_ID = '\r\n\r\nInvalid ID\r\n\r\n';
const ERRMSG_DUPLICATED_ID = '\r\n\r\nDuplicated ID\r\n\r\n';
const REGEX_ROUTE_UPLOAD = new RegExp('^/d/([^/]+)(/[^/]*)?$');
const REGEX_BOT_WHITELIST = new RegExp('^.*(curl|wget).*$');
function load_config() {
    let listen_host = process.env['LISTEN_HOST'];
    let listen_port = process.env['LISTEN_PORT'];
    let db_host = process.env['DB_HOST'];
    let db_port = parseInt(process.env['DB_PORT']);
    let storage_server = process.env['STORAGE_SERVER'];
    let num_worker = parseInt(process.env['NUM_WORKER']);
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
            db_port,
            storage_server,
            num_worker
        };
    }
}
const config = load_config();
const db = __WEBPACK_IMPORTED_MODULE_5_redis__["createClient"](config.db_port, config.db_host);
const app = __WEBPACK_IMPORTED_MODULE_2_express__();
app.use(__WEBPACK_IMPORTED_MODULE_3_morgan__('combined'));
app.use(__WEBPACK_IMPORTED_MODULE_7_express_useragent__["express"]());
function async_redis(method, ...args) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            method(...args, (err, result) => {
                if (err !== null) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
        });
    });
}
class Session {
    constructor(id, size, storage_server, flow_id, flow_token) {
        this.id = id;
        this.size = size;
        this.storage_server = storage_server;
        this.flow_id = flow_id;
        this.flow_token = flow_token;
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            if ((yield async_redis(db.del.bind(db), this.id)) !== 1) {
                return 'EOTH';
            }
            return 'OK';
        });
    }
    static new(id, size) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let storage_server = config.storage_server;
                if ((yield async_redis(db.hsetnx.bind(db), id, 'storage_server', storage_server)) !== 1) {
                    return 'EDUP';
                }
                let res = yield __WEBPACK_IMPORTED_MODULE_8_axios___default.a.post(`${storage_server}/new`, JSON.stringify({ size }));
                if (res.status !== 200) {
                    return 'EOTH';
                }
                let data = res.data;
                if ((yield async_redis(db.hmset.bind(db), id, {
                    size: size,
                    flow_id: data.id,
                    flow_token: data.token
                })) !== 'OK') {
                    return 'EOTH';
                }
                if ((yield async_redis(db.expire.bind(db), id, 300)) !== 1) {
                    return 'EOTH';
                }
                return new Session(id, size, storage_server, data.id, data.token);
            }
            catch (err) {
                return 'EOTH';
            }
        });
    }
    static load(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let data = yield async_redis(db.hmget.bind(db), id, ['size', 'storage_server', 'flow_id', 'flow_token']);
                let size = data[0];
                let storage_server = data[1];
                let flow_id = data[2];
                let flow_token = data[3];
                if (size === null || storage_server === null || flow_id === null || flow_token === null) {
                    return null;
                }
                return new Session(id, size, storage_server, flow_id, flow_token);
            }
            catch (err) {
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
function route_upload(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (req.method !== 'POST') {
            return false;
        }
        if (req.url === undefined) {
            return false;
        }
        let req_path = __WEBPACK_IMPORTED_MODULE_4_url__["parse"](req.url).pathname;
        if (req_path === undefined) {
            return false;
        }
        let matches = REGEX_ROUTE_UPLOAD.exec(req_path);
        if (matches === null) {
            return false;
        }
        // Routing matched
        let size = parseInt(req.headers['content-length']);
        if (size === 0) {
            res.statusCode = 400;
            res.end();
            return true;
        }
        let id = matches[1];
        if (validate_id(id) === false) {
            res.statusCode = 400;
            res.end(ERRMSG_INVALID_ID);
            return true;
        }
        let session = yield Session.new(id, size);
        if (session === 'EOTH') {
            res.statusCode = 500;
            res.end();
            return true;
        }
        if (session === 'EDUP') {
            res.statusCode = 400;
            res.end(ERRMSG_DUPLICATED_ID);
            return true;
        }
        res.writeHead(307, { location: `${session.storage_server}/${session.flow_id}/push?token=${session.flow_token}` });
        res.end();
        return true;
    });
}
app.get('/d/:id/:filename?', (req, res) => __awaiter(this, void 0, void 0, function* () {
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
    let session = yield Session.load(id);
    if (session === null) {
        res.status(404).send();
        return;
    }
    if ((yield session.delete()) !== 'OK') {
        res.status(500).send();
        return;
    }
    if (filename === undefined) {
        filename = id;
    }
    res.redirect(`${session.storage_server}/${session.flow_id}/pull?filename=${filename}`);
}));
let server = __WEBPACK_IMPORTED_MODULE_1_http__["createServer"]();
server.on('checkContinue', (req, res) => __awaiter(this, void 0, void 0, function* () {
    if ((yield route_upload(req, res)) === false) {
        res.writeContinue();
        app(req, res);
    }
}));
server.on('request', (req, res) => __awaiter(this, void 0, void 0, function* () {
    if ((yield route_upload(req, res)) === false) {
        app(req, res);
    }
}));
if (__WEBPACK_IMPORTED_MODULE_0_cluster__["isMaster"]) {
    for (let i = 0; i < config.num_worker; i++) {
        __WEBPACK_IMPORTED_MODULE_0_cluster__["fork"]();
    }
    console.log(`Droplet listening on ${config.listen_host}:${config.listen_port}`);
}
else {
    server.listen(config.listen_port, config.listen_host);
}


/***/ })
/******/ ]);