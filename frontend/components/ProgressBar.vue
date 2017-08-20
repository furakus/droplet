<template>
<div class="progress-bar">
    <div class="inner" :style="{ width: `${progress * 100}%` }"></div>
</div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

@Component
export default class ProgressBar extends Vue {
    @Prop()
    progress: number
}
</script>

<style lang="less">
@import "../styles/colors.less";
@import "../styles/styles.less";

div.progress-bar {
    & > div.inner {
        .fixed-height(0.5rem);
        background-color: @gray;
        transition: width 0.05s linear;
    }
}
</style>
