<template>
<div class="form-text grid-noGutter">
    <div class="col-3"><label>
        <slot></slot>
    </label></div>
    <div class="col-9">
        <input type="text" :readonly="readonly" :value="value" @input="updateValue($event.target.value)"></input>
    </div>
</div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

@Component
export default class FormText extends Vue {
    @Prop()
    readonly: boolean

    @Prop()
    value: string | null

    updateValue(value: string) {
        this.$emit('input', value);
    }
}
</script>

<style lang="less">
@import "../styles/styles.less";

div.form-text {
    .fixed-height(2rem);
    background-color: #0096FF;
    & > div > label {
        padding-left: 1rem;
        color: white;
        .mono-font(0.9rem);
    }
}
</style>
