import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementIcons from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import '@/styles/element-overrides.scss'
import '@/styles/global.scss'
import 'vditor/dist/index.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ElementPlus)
for (const [name, comp] of Object.entries(ElementIcons)) {
  app.component(name, comp as never)
}
app.mount('#app')
