import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import map_china from '../views/map_china.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: map_china
  },
]

const router = createRouter({
  history: createWebHashHistory(process.env.PUBLIC_PATH || '/'),
  routes
})

export default router
