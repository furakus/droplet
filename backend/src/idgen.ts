import { promisify } from 'util'
import * as Crypto from 'crypto'

const PREFIX: string[] = ['a', 'b', 'c', 'd', 'f', 'g', 'h', 'i', 'j', 'k', 'm', 'n', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
const SUFFIX: string[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
const MAX_PREFIX_LEN: number = 3
const MIN_ID_LEN: number = 6

export default class IdGenerator {
    private weight_table: number[] = []
    constructor() {
        let acc_weight = 0
        for (let i = 1; i <= MAX_PREFIX_LEN; i++) {
            let weight = Math.pow(PREFIX.length, i) * Math.pow(SUFFIX.length, MAX_PREFIX_LEN - i)
            acc_weight += weight
            this.weight_table.push(acc_weight)
        }
    }
    async gen(len: number): Promise<string> {
        len = Math.max(MIN_ID_LEN, len)
        let buf = await promisify(Crypto.randomBytes)(MAX_PREFIX_LEN + len)
        let prefix_rnd = 0
        for (let i = 0; i < MAX_PREFIX_LEN; i++) {
            prefix_rnd = prefix_rnd * 256 + buf[i]
        }
        buf = buf.slice(MAX_PREFIX_LEN)
        prefix_rnd = prefix_rnd % this.weight_table[this.weight_table.length - 1]
        let prefix_len = 1
        for (let i = MAX_PREFIX_LEN - 1; i >= 0; i--) {
            if (prefix_rnd >= this.weight_table[i]) {
                prefix_len = i + 1
                break
            }
        }
        let id = ''
        for (let i = 0; i < prefix_len; i++) {
            id += PREFIX[buf[i] % PREFIX.length]
        }
        for (let i = prefix_len; i < len; i++) {
            id += SUFFIX[buf[i] % SUFFIX.length]
        }
        return id
    }
}
