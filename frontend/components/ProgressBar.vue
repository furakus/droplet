<template>
<div class="progress-bar">
    <div class="background"></div>
    <div class="indicator" :style="{ width: `${Math.floor(progress * 100)}%` }"></div>
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

@bar-height: 0.5rem;

div.progress-bar {
    height: @bar-height;
    overflow: hidden;
    & > div.background {
        height: 100%;
        width: 100%;
        position: absolute;
        top: 0;
        left: 0;
        background-color: @gray;
    }
    & > div.indicator {
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        transition: width 0.5s linear;
        animation: backlight 4s steps(1, end) infinite;
        &:before {
            content: "";
            height: 100%;
            width: auto;
            display: block;
            position: absolute;
            top: 0;
            animation-name: wave, light;
            animation-duration: 2s, 4s;
            animation-timing-function: cubic-bezier(0.860, 0.000, 0.070, 1.000), steps(1, end);
            animation-iteration-count: infinite;
            animation-delay: 1s;
        }
        &:after {
            content: "";
            height: 100%;
            width: 0.3rem;
            display: block;
            position: absolute;
            top: 0;
            left: 100%;
            opacity: 0.3;
            background-color: black;
        }
    }
    @keyframes wave {
        0% {left: 0%; right: 100%;}
        50% {left: 0%; right: -0.3rem;}
        100% {left: 100%; right: 0%;}
    }
    @keyframes light {
        0% {background-color: lighten(@blue, 12%);}
        50% {background-color: @blue;}
    }
    @keyframes backlight {
        0% {background-color: lighten(@blue, 6%);}
        50% {background-color: lighten(@blue, 18%);}
    }
}
</style>
