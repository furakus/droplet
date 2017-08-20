<template>
<div class="form-text grid-noGutter">
    <div class="col-3">
        <label>
            <slot></slot>
        </label>
        <div v-if="copiable" class="copy" :class="{ effect: copy_effect }" @click="copyText" @mousedown="copy_effect = false" @mouseup="copy_effect = true">
            <i class="fa fa-files-o" aria-hidden="true"></i>
            <div class="effect"></div>
        </div>
    </div>
    <div class="col-9">
        <input type="text" ref="input" :readonly="readonly" :value="value" @input="updateValue($event.target.value)"></input>
    </div>
</div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

@Component
export default class FormText extends Vue {
    @Prop({ default: false })
    readonly: boolean

    @Prop({ default: false })
    copiable: boolean

    @Prop({ default: '' })
    value: string

    copy_effect: boolean = false

    updateValue(value: string) {
        this.$emit('input', value);
    }

    copyText() {
        let e_input = <HTMLInputElement>this.$refs['input'];
        e_input.focus();
        e_input.setSelectionRange(0, this.value.length);
        document.execCommand('copy');
    }
}
</script>

<style lang="less">
@import "../styles/styles.less";

div.form-text {
    .fixed-height(2rem);
    background-color: @blue;
    & > div > label {
        padding-left: 1rem;
        color: white;
        .mono-font(0.9rem);
    }

    div.copy {
        position: absolute;
        top: 0;
        right: 0.5rem;
        cursor: pointer;
        > i {
            .fixed-height(2rem);
            width: 2rem;
            color: lighten(desaturate(@blue, 30%), 50%);
            text-align: center;
        }
        > div.effect {
            height: 2.5rem;
            width: 2.5rem;
            padding: 0.95rem;
            box-sizing: border-box;
            position: absolute;
            top: -0.25rem;
            left: -0.25rem;
            &:before {
                content: "";
                height: 100%;
                width: 100%;
                display: block;
                box-sizing: border-box;
                border-radius: 100%;
                border: solid 0.3rem transparent;
            }
        }
        &.effect > div.effect {
            padding: 0;
            transition: padding 0.2s linear;
            &:before {
                border-color: white;
                border-width: 0;
                opacity: 0;
                transition: border-width 0.4s linear, opacity 0.2s linear 0.2s;
            }
        }
        &:hover > i {
            color: white;
            transition: color 0.1s linear;
        }
    }
}
</style>
