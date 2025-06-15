import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Chat from '../views/Chat.vue';

const routes = [
  {
    path: '/',
    redirect: '/chat',
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/chat',
    name: 'Chat',
    component: Chat,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('token');
    if (!token) return next('/login');
  }
  return next();
});

export default router; 