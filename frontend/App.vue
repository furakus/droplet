<template>
<div id="app">
    <div id="header" class="grid grid-center">
    </div>
    <div id="container" class="grid grid-center">
        <div class="col-6">
            <div class="grid"><div class="col">
                <form-text :readonly="true" v-model="file_name">FILE</form-text>
            </div></div>
            <div class="grid" v-if="link"><div class="col">
                <form-text :readonly="true" v-model="link">LINK</form-text>
            </div></div>
            <div class="grid" v-if="file === null"><div class="col">
                <button class="btn-warn" @click="$refs.fileinput.click()">SELECT</button>
                <span class="guide">or drag and drop a file to upload.</span>
            </div></div>
            <div class="grid" v-if="file"><div class="col">
                <button class="btn-warn" @click="upload()">UPLOAD</button>
                <button class="btn-defl" @click="cancel()">CANCEL</button>
                <button class="btn-harz" @click="$refs.fileinput.click()">CHANGE</button>
            </div></div>
        </div>
    </div>
    <input ref="fileinput" type="file" hidden="true" @change="selectFile($event.target.files)" />
</div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component,  } from 'vue-property-decorator'
import axios from 'axios'

@Component
export default class App extends Vue {
    file: File | null = null
    link: string | null = null

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
        let resp = await axios.post('/d/gid')
        let id = resp.data.id
        this.link = `${location.origin}/${id}/${this.file_name}`
    }

    cancel() {
        this.file = null
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
