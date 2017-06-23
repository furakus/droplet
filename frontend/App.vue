<template>
<div id="app" @dragover.prevent="onDragFile" @drop.prevent="onDropFile">
    <div id="header">
        <div class="grid"><div class="col">
            <h1>Droplet</h1>
        </div></div>
    </div>
    <div id="container">
        <div class="grid grid-center">
            <div class="col-8">
                <div class="grid" v-for="file in filelist"><div class="col">
                    <form-text :readonly="true" v-model="file.name">FILE</form-text>
                </div></div>
                <div class="grid" v-if="state > 0"><div class="col">
                    <form-text :readonly="true" v-model="link">LINK</form-text>
                </div></div>
                <div class="grid" v-if="state > 0"><div class="col">
                    <progress-bar :progress="progress"></progress-bar>
                </div></div>
                <template v-if="state === 0">
                    <div class="grid" v-if="!filelist"><div class="col">
                        <button class="btn-warn" @click="$refs.fileinput.click()">SELECT</button>
                        <span class="guide">or drag and drop a file to upload.</span>
                    </div></div>
                    <div class="grid" v-if="filelist"><div class="col">
                        <button class="btn-warn" @click="upload()">UPLOAD</button>
                        <button class="btn-defl" @click="reset()">CANCEL</button>
                        <button class="btn-harz" @click="$refs.fileinput.click()">CHANGE</button>
                    </div></div>
                </template>
                <div class="grid" v-if="state > 0"><div class="col">
                    <button class="btn-harz" v-if="state === 1" @click="reset()">CANCEL</button>
                    <button class="btn-succ" v-if="state === 2" @click="reset()">CLEAR</button>
                    <span class="guide" v-if="state === 1">Transfering...</span>
                    <span class="guide" v-if="state === 2">Done.</span>
                </div></div>
            </div>
        </div>
        <div class="grid"><div class="col">
            <p>
                Droplet Service allows you to transfer files over network.
            </p>
            <p><small>
                It works like a pipe and only buffers a small part of the file during transfer. The one-time link will be destroyed immediately when the transfer is done.
            </small></p>
            <p>
                You can also upload files by cURL
            </p>
            <code>
                curl -LT <strong>${your file path}</strong> https://d.ika.cx/<strong>${a unique id}</strong>/<strong>${file name}</strong><br><br>
                * The length of <strong>${a unique id}</strong> must >= 4, contains only alphebats and numbers.
            </code>
        </div></div>
        <div class="grid"><div class="col">
            <p><small><ul>
                <li>[1] <strong><a href="https://github.com/furakus/droplet">Droplet</a></strong>, Fast One-time File Exchange Service</li> 
                <li>[2] <strong><a href="https://github.com/pzread/furakus/">Furakus</a></strong>, High Performance Http Flow Broker</li>
            </ul></small></p>
        </div></div>
    </div>
    <input ref="fileinput" type="file" hidden="true" multiple="true" @change="onSelectFile"></input>
</div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component,  } from 'vue-property-decorator'
import Axios from 'axios'
import { CancelTokenSource } from 'axios'
import Hashids from 'hashids'
import JSZip from 'jszip'
import { ErrorMessage } from '../interface'

interface UploadResponse {
    storage_server: string
    flow_id: string
    flow_token: string
}

interface ErrorResponse {
    msg: ErrorMessage
}

enum State {
    Pending = 0,
    Uploading = 1,
    Done = 2,
}

@Component
export default class App extends Vue {
    state: State = State.Pending
    filelist: File[] | null = null
    link: string | null = null
    progress: number = 0
    cancel_token: CancelTokenSource | null = null

    onDragFile(evt: DragEvent) {
        if (this.state === State.Done) {
            this.reset()
        }
        if (this.state === State.Pending) {
            evt.dataTransfer.dropEffect = 'copy'
        } else {
            evt.dataTransfer.dropEffect = 'none'
        }
    }

    onDropFile(evt: DragEvent) {
        let files = evt.dataTransfer.files
        if (this.state === State.Pending && files.length > 0) {
            this.filelist = []
            for (let i = 0; i < files.length; ++i) {
                this.filelist.push(files[i])
            }
        }
    }

    onSelectFile(evt: Event) {
        let files = (<HTMLInputElement>evt.target).files
        if (this.state === State.Pending && files !== null && files.length > 0) {  
            this.filelist = []
            for (let i = 0; i < files.length; ++i) {
                this.filelist.push(files[i])
            }
        }
    }

    async upload() {
        if (this.state !== State.Pending || this.filelist === null || this.filelist.length === 0) {
            return
        }
        let blob: Blob
        let name: string
        if (this.filelist.length === 1) {
            blob = this.filelist[0]
            name = this.filelist[0].name
        } else {
            blob = await this.packFiles(this.filelist)
            name = 'droplet.zip'
        }
        let hasher = new Hashids(navigator.userAgent, 4, 'abcdefghijklmnopqrstuvwxyz0123456789')
        let id: string
        let data: UploadResponse | null = null
        let shortlen = 10000
        while (true) {
            id = hasher.encode(Math.floor((new Date()).getTime() / 100) % shortlen)
            let res = await Axios.post(`/api/id/${id}/upload`, { size: blob.size })
            if (res.status === 200) {
                data = res.data
                break
            } else if (res.status === 400) {
                let err: ErrorResponse = res.data
                if (err.msg !== ErrorMessage.DUPLICATED_ID) {
                    break
                }
            }
            shortlen *= 10
        }
        if (data !== null) {
            this.link = `${location.origin}/${id}/${name}`
            this.state = State.Uploading
            await this.uploadBlob(blob, data.storage_server, data.flow_id, data.flow_token)
            this.state = State.Done
        } else {
            this.reset()
        }
    }

    reset() {
        this.filelist = null
        this.link = null
        this.progress = 0
        let fileinput = <HTMLInputElement>this.$refs['fileinput']
        fileinput.value = ''
        if (this.cancel_token !== null) {
            this.cancel_token.cancel()    
            this.cancel_token = null
        }
        this.state = State.Pending
    }

    async packFiles(files: File[]): Promise<Blob> {
        let pack = JSZip()
        for (let file of files) {
            pack.file(file.name, file)
        }
        let blob: Blob = await pack.generateAsync({
            compression: 'STORE',
            type: 'blob',
        })
        return blob
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
    width: 100%;
}

#header {
    max-width: 640px;
    margin: 0 auto;
    h1 {
        .mono-font(2rem);
    }
}

#container {
    height: ~"calc(100% - 2rem)";
    max-width: 640px;
    margin: 0 auto;
    span.guide {
        margin-left: 0.5rem;
        .mono-font(0.8rem);
    }
    small, code {
        font-size: 0.8rem;
    }
    ul {
        padding: 0;
        list-style: none;
    }
}
</style>
