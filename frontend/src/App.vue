<template>
  <div class="app-container">
    <TheNavbar />
    <main class="main-content">
      <router-view></router-view>
    </main>
    <TheFooter />

    <!-- Toast Notifications -->
    <div class="toast-container">
      <div 
        v-for="toast in toastStore.toasts" 
        :key="toast.id" 
        :class="['toast-item', toast.type]"
      >
        <span class="toast-msg">{{ toast.message }}</span>
        <button class="toast-close" @click="toastStore.remove(toast.id)">✕</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import TheNavbar from './components/TheNavbar.vue';
import TheFooter from './components/TheFooter.vue';
import { useToastStore } from './stores/toast';

const toastStore = useToastStore();
</script>

<style>
:root {
  --primary-color: #2563eb;
  --secondary-color: #0f172a;
  --accent-color: #f59e0b;
  --bg-color: #f8fafc;
  --card-bg: rgba(255, 255, 255, 0.7);
  --text-main: #1e293b;
  --text-muted: #64748b;
  --shadow-sm: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  --radius-lg: 16px;
  --radius-xl: 24px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Be Vietnam Pro', sans-serif;
  background-color: var(--bg-color);
  color: var(--text-main);
  line-height: 1.6;
}

/* Glassmorphism utility */
.glass-panel {
  background: var(--card-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: var(--shadow-md);
  border-radius: var(--radius-lg);
}
</style>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.main-content {
  flex: 1;
}

.toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 100000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}
.toast-item {
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 18px;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
  font-size: 0.9rem;
  font-weight: 500;
  min-width: 260px;
  max-width: 380px;
  border: 1px solid #e2e8f0;
  animation: slideIn 0.25s ease-out;
}
.toast-item.success {
  border-left: 4px solid #10b981;
  color: #065f46;
}
.toast-item.error {
  border-left: 4px solid #ef4444;
  color: #991b1b;
}
.toast-item.info {
  border-left: 4px solid #2563eb;
  color: #1e40af;
}
.toast-close {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  font-size: 0.85rem;
}
.toast-close:hover {
  color: #1e293b;
}
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
