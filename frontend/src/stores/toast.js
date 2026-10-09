import { defineStore } from 'pinia';

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: []
  }),
  actions: {
    add(message, type = 'info', duration = 3000) {
      const id = Date.now() + Math.random();
      this.toasts.push({ id, message, type });
      setTimeout(() => {
        this.remove(id);
      }, duration);
    },
    success(message) {
      this.add(message, 'success');
    },
    warning(message) {
      this.add(message, 'warning');
    },
    error(message) {
      this.add(message, 'error');
    },
    info(message) {
      this.add(message, 'info');
    },
    remove(id) {
      const idx = this.toasts.findIndex(t => t.id === id);
      if (idx !== -1) {
        this.toasts.splice(idx, 1);
      }
    }
  }
});
