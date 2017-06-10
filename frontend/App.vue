<template>
<div id="app">
    <div class="grid">
        <h2 class="col-3">Droplet</h2>
    </div>
    <div class="grid">
        <div class="col-3">
            aaaaabbb
        </div>
        <div class="col-9">
            <button class="btn-defl">UPLOAD</button>
            <button class="btn-warn">CANCEL</button>
            <button class="btn-succ">ACCEPT</button>
            <button class="btn-harz">DELETE</button>
        </div>
    </div>
</div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component } from 'vue-property-decorator'

@Component
export default class App extends Vue {}
</script>

<style lang="less">
#app {
    max-width: 768px;
    margin: 0 auto;
}
</style>
