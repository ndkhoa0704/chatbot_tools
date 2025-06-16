<script setup>
import { onMounted, ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { API_HOST } from '../config.js';

const router = useRouter();
const token = localStorage.getItem('token');
if (!token) {
  router.push('/login');
}

const messageInput = ref('');
const messages = ref([]);

// NEW: state for mobile sidebar toggle
const sidebarOpen = ref(false);

async function fetchHistory() {
  try {
    const res = await axios.get(`${API_HOST}/api/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    messages.value = res.data;
  } catch (err) {
    logger.error(err);
    router.push('/login');
  }
}

async function sendMessage() {
  if (!messageInput.value.trim()) return;
  const userMessage = {
    content: messageInput.value,
    ai_reply: '',
    timestamp: new Date().toISOString(),
  };
  messages.value.push(userMessage);
  const toSend = messageInput.value;
  messageInput.value = '';
  try {
    const res = await axios.post(
      `${API_HOST}/api/chat`,
      { message: toSend },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // Find index of userMessage to update ai_reply
    const idx = messages.value.findIndex((m) => m === userMessage);
    if (idx !== -1) {
      messages.value.push(res.data.ai_reply);
    }
  } catch (err) {
    logger.error(err);
    router.push('/login');
  }
}

onMounted(() => {
  fetchHistory();
});
</script>

<template>
  <!-- Container switches between column (mobile) and row (desktop) -->
  <div class="h-screen flex flex-col md:flex-row">
    <!-- Mobile header with hamburger to toggle sidebar -->
    <header class="flex items-center justify-between p-4 bg-gray-800 text-white md:hidden">
      <button @click="sidebarOpen = true" aria-label="Open sidebar" class="focus:outline-none">
        <!-- simple hamburger icon -->
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <h1 class="text-lg font-semibold">Chat</h1>
      <!-- Empty placeholder to balance flex -->
      <div class="w-6" />
    </header>

    <!-- Overlay when sidebar is open on mobile -->
    <div v-if="sidebarOpen" @click="sidebarOpen = false" class="fixed inset-0 bg-black/50 z-20 md:hidden" />

    <!-- Sidebar -->
    <aside :class="[
      'fixed inset-y-0 left-0 w-64 bg-gray-800 text-white p-4 overflow-y-auto transform duration-300 z-30 md:relative md:translate-x-0 md:flex-shrink-0',
      sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
    ]">
      <!-- Mobile sidebar header -->
      <div class="flex items-center justify-between mb-4 md:hidden">
        <h2 class="text-xl font-semibold">Chat History</h2>
        <button @click="sidebarOpen = false" aria-label="Close sidebar" class="focus:outline-none">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <!-- Desktop sidebar header -->
      <h2 class="text-xl font-semibold mb-4 hidden md:block">Chat History</h2>
      <ul>
        <li v-for="(msg, idx) in messages" :key="idx" class="mb-2 text-sm truncate">
          {{ msg.content }}
        </li>
      </ul>
    </aside>

    <!-- Main Chat Area -->
    <div class="flex flex-col flex-1">
      <!-- Messages list -->
      <div class="flex-1 overflow-y-auto p-4 bg-gray-100">
        <div v-for="(msg, idx) in messages" :key="idx" class="mb-4">
          <div class="mb-1">
            <span class="font-semibold">You:</span> {{ msg.content }}
          </div>
          <div v-if="msg.ai_reply" class="bg-white p-3 rounded shadow">
            <span class="font-semibold">AI:</span> {{ msg.ai_reply }}
          </div>
        </div>
      </div>
      <!-- Message input -->
      <form @submit.prevent="sendMessage" class="p-4 bg-white shadow flex">
        <input v-model="messageInput"
          class="flex-1 border rounded p-2 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Type your message..." />
        <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
          Send
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* No additional styles needed since we rely on Tailwind */
</style>