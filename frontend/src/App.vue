<template>
  <div class="app-container">
    <TheNavbar />
    <main class="main-content">
      <router-view></router-view>
    </main>
    <TheFooter />
  </div>
</template>

<script setup>
import TheNavbar from './components/common/TheNavbar.vue';
import TheFooter from './components/common/TheFooter.vue';
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.main-content {
  flex: 1;
}
</style>
