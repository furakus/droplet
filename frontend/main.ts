import './styles/styles.less'
import Vue from 'vue'
import FormText from './components/FormText'
import App from './App'

Vue.component('form-text', FormText)

new Vue({
    el: "#app",
    render: h => h(App)
})
