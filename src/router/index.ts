import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/splash' },
    { path: '/splash', name: 'splash', component: () => import('@/features/splash/SplashView.vue') },
    { path: '/activate', name: 'activate', component: () => import('@/features/activation/ActivationView.vue') },
    { path: '/setup', name: 'setup', component: () => import('@/features/auth/FirstRunSetupView.vue') },
    { path: '/login', name: 'login', component: () => import('@/features/auth/LoginView.vue') },
    { path: '/home', name: 'home', component: () => import('@/features/home/HomeView.vue') },
    { path: '/settings', name: 'settings', component: () => import('@/features/settings/SettingsView.vue') },
    { path: '/menu', name: 'menu', component: () => import('@/features/menu/MenuView.vue') },
    { path: '/pos', name: 'pos', component: () => import('@/features/pos/PosView.vue') },
    { path: '/checkout', name: 'checkout', component: () => import('@/features/checkout/CheckoutView.vue') },
    { path: '/orders', name: 'orders', component: () => import('@/features/orders/OrdersView.vue') },
    { path: '/reports', name: 'reports', component: () => import('@/features/reports/ReportsView.vue') },
    { path: '/order-timer', name: 'order-timer', component: () => import('@/features/order-timer/OrderTimerView.vue') }
  ]
})

export default router
