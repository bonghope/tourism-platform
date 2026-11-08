<template><span v-if="count" class="support-unread" :aria-label="`${count} tin nhắn chưa đọc`">{{ count > 99 ? '99+' : count }}</span></template>
<script setup>
import {ref,onMounted,onUnmounted} from 'vue';
import {supportRequest} from '../services/support';
const count=ref(0);let timer,disposed=false,busy=false;
async function refresh(){if(disposed||busy||document.hidden)return;busy=true;try{const r=await supportRequest('/support/unread');if(!disposed)count.value=r.count;}catch{if(!disposed)count.value=0;}finally{busy=false;}}
onMounted(()=>{refresh();timer=setInterval(refresh,15000);window.addEventListener('support-read',refresh);});
onUnmounted(()=>{disposed=true;clearInterval(timer);window.removeEventListener('support-read',refresh);});
</script>
<style scoped>.support-unread{display:inline-flex;align-items:center;justify-content:center;min-width:19px;height:19px;margin-left:5px;padding:0 5px;border-radius:12px;background:#dc5546;color:white;font-size:11px;font-weight:700;vertical-align:middle}</style>
