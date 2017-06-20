<template>
<div id="app">
    <div id="header" class="grid grid-center"></div>
    <div id="container" class="grid grid-center">
        <div class="col-6">
            <div class="grid"><div class="col">
                <form-text :readonly="true" v-model="file_name">FILE</form-text>
            </div></div>
            <div class="grid" v-if="link"><div class="col">
                <form-text :readonly="true" v-model="link">LINK</form-text>
            </div></div>
            <div class="grid" v-if="link"><div class="col">
                <progress-bar :progress="progress"></progress-bar>
            </div></div>
            <div class="grid" v-if="!file"><div class="col">
                <button class="btn-warn" @click="$refs.fileinput.click()">SELECT</button>
                <span class="guide">or drag and drop a file to upload.</span>
            </div></div>
            <div class="grid" v-if="file && !link"><div class="col">
                <button class="btn-warn" @click="upload()">UPLOAD</button>
                <button class="btn-defl" @click="reset()">CANCEL</button>
                <button class="btn-harz" @click="$refs.fileinput.click()">CHANGE</button>
            </div></div>
            <div class="grid" v-if="link"><div class="col">
                <button class="btn-harz" v-if="progress !== 1" @click="reset()">CANCEL</button>
                <button class="btn-succ" v-if="progress === 1" @click="reset()">DONE</button>
            </div></div>
        </div>
    </div>
    <input ref="fileinput" type="file" hidden="true" @change="selectFile($event.target.files)" />
</div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component,  } from 'vue-property-decorator'
import Axios from 'axios'
import { CancelTokenSource } from 'axios'
import Hashids from 'hashids'
import { ErrorMessage } from '../interface'

interface UploadResponse {
    storage_server: string
    flow_id: string
    flow_token: string
}

interface ErrorResponse {
    msg: ErrorMessage
}

@Component
export default class App extends Vue {
    file: File | null = null
    link: string | null = null
    progress: number = 0
    cancel_token: CancelTokenSource | null = null

    get file_name() {
        if (this.file === null) {
            return ''
        } else {
            return this.file.name
        }
    }

    selectFile(files: FileList) {
        if (files.length != 1) {
            return
        }
        this.file = files[0]
    }

    async upload() {
        if (this.file === null) {
            return
        }
        let hasher = new Hashids(navigator.userAgent, 4, 'abcdefghijklmnopqrstuvwxyz0123456789')
        let id: string
        let data: UploadResponse | null = null
        while (true) {
            id = hasher.encode((new Date()).getTime())
            let res = await Axios.post(`/api/id/${id}/upload`, { size: this.file.size })
            if (res.status === 200) {
                data = res.data
                break
            } else if (res.status === 400) {
                let err: ErrorResponse = res.data
                if (err.msg !== ErrorMessage.DUPLICATED_ID) {
                    break
                }
            }
        }
        if (data !== null) {
            this.link = `${location.origin}/${id}/${this.file_name}`
            this.uploadBlob(this.file, data.storage_server, data.flow_id, data.flow_token)
        }
    }

    reset() {
        this.file = null
        this.link = null
        this.progress = 0
        if (this.cancel_token !== null) {
            this.cancel_token.cancel()    
            this.cancel_token = null
        }
    }

    async uploadBlob(blob: Blob, storage_server: string, flow_id: string, flow_token: string) {
        let progressCallback = (evt: ProgressEvent) => {
            this.progress = evt.loaded / evt.total
        }
        this.cancel_token = Axios.CancelToken.source()
        await Axios.post(`${storage_server}/flow/${flow_id}/push?token=${flow_token}`, blob, {
            onUploadProgress: progressCallback,
            cancelToken: this.cancel_token.token,
        })
        this.progress = 1
    }
}
</script>

<style lang="less">
@import "./styles/styles.less";

body {
    height: 100%;
    margin: 0 0;
    padding: 0 0;
}

#app {
    height: 100%;
    max-width: 768px;
    margin: 0 auto;
}

#header {
    height: 2rem;
    > div.title {
        line-height: 2rem;
        background-color: #012756;
        color: white;
        font-family: 'Source Code Pro', monospace;
        text-align: center;
    }
}

#container {
    height: ~"calc(100% - 2rem)";
    span.guide {
        margin-left: 0.5rem;
        .mono-font(0.8rem);
    }
}
</style>
