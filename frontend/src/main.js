import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router/index.js'
import App from './App.vue'
import VueKonva from 'vue-konva'
import './assets/styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(VueKonva)

// Init auth BEFORE mounting — ensures authReady=true before any route guard fires
// (prevents race condition between beforeEach watching authReady and onMounted calling init)
const { useAuthStore } = await import('./stores/auth.js')
const auth = useAuthStore()
await auth.init()

app.mount('#app')
