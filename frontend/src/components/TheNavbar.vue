<template>
  <nav class="navbar glass-panel">
    <div class="nav-brand">
      <router-link to="/" class="logo-link"><span class="logo">TaVivu</span></router-link>
    </div>
    <div class="nav-links">
      <router-link to="/">Trang chủ</router-link>
      <router-link to="/tours">Tour</router-link>
      <router-link to="/destinations">Điểm đến</router-link>
      <a href="#" @click.prevent="alertDev">Khuyến mãi</a>
      <router-link to="/about">Về chúng tôi</router-link>
    </div>
    <div class="nav-actions">
      <button class="btn-login" @click="alertDev">Đăng nhập</button>
      <button class="btn-register" @click="alertDev">Đăng ký ngay</button>
    </div>
  </nav>
</template>

<script setup>
const alertDev = () => {
  alert('Tính năng này thuộc các Module đang được phát triển (WIP). Bạn chờ thêm chút nhé!');
};
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 1200px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 1000;
  border-radius: 32px;
}
.logo-link {
  text-decoration: none;
}
.logo {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--primary-color);
  letter-spacing: -0.5px;
}
.nav-links {
  display: flex;
  gap: 32px;
}
.nav-links a {
  text-decoration: none;
  color: var(--text-main);
  font-weight: 500;
  transition: color 0.3s;
}
.nav-links a:hover {
  color: var(--primary-color);
}
.nav-actions {
  display: flex;
  gap: 12px;
}
.btn-login {
  padding: 10px 24px;
  background-color: transparent;
  color: var(--secondary-color);
  border: 1px solid var(--secondary-color);
  border-radius: 24px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-login:hover {
  background-color: rgba(15, 23, 42, 0.05);
}
.btn-register {
  padding: 10px 24px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 24px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.btn-register:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
}
</style>
