import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/setup', name: 'setup', component: () => import('@/views/SetupView.vue') },
    { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
    { path: '/ai', name: 'ai', component: () => import('@/views/AiView.vue') },
    { path: '/memos', name: 'memos', component: () => import('@/views/MemosView.vue') },
    { path: '/favorites', name: 'favorites', component: () => import('@/views/FavoritesView.vue') },
    { path: '/search', name: 'search', component: () => import('@/views/SearchView.vue') },
    {
      path: '/book/:bookSlug',
      name: 'book',
      component: () => import('@/views/BookView.vue'),
      props: true,
      children: [
        {
          path: ':noteId',
          name: 'book-note',
          component: () => import('@/views/BookView.vue'),
          props: true,
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
