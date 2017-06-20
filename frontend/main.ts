import './styles/styles.less'
import Vue from 'vue'
import FormText from './components/FormText'
import ProgressBar from './components/ProgressBar'
import App from './App'

Vue.component('form-text', FormText)
Vue.component('progress-bar', ProgressBar)

new Vue({
    el: "#app",
    render: h => h(App)
})
