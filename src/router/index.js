import { createRouter, createWebHistory } from 'vue-router';
import TablaDatos from '@/components/TablaDatos.vue';


const routes = [
  {
    path: '/',
    name: 'TablaDatos',
    component: TablaDatos,
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;