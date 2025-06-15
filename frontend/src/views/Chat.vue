<script setup>
import { onMounted, ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const token = localStorage.getItem('token');
if (!token) {
  router.push('/login');
}

const messageInput = ref('');
const messages = ref([]);

async function fetchHistory() {
  try {
    const res = await axios.get('http://localhost:5000/api/history', {
      headers: { Authorization: `Bearer ${token}` },
    });
    messages.value = res.data;
  } catch (err) {
    console.error(err);
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
      'http://localhost:5000/api/chat',
      { message: toSend },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // Find index of userMessage to update ai_reply
    const idx = messages.value.findIndex((m) => m === userMessage);
    if (idx !== -1) {
      messages.value[idx].ai_reply = res.data.ai_reply;
    }
  } catch (err) {
    console.error(err);
  }
}

onMounted(() => {
  fetchHistory();
});
</script>

<template>
  <div class="h-screen flex">
    <!-- Side Panel for History -->
    <aside class="w-64 bg-gray-800 text-white p-4 overflow-y-auto">
      <h2 class="text-xl font-semibold mb-4">Chat History</h2>
      <ul>
        <li
          v-for="(msg, idx) in messages"
          :key="idx"
          class="mb-2 text-sm truncate"
        >
          {{ msg.content }}
        </li>
      </ul>
    </aside>

    <!-- Main Chat Area -->
    <div class="flex flex-col flex-1">
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
      <form @submit.prevent="sendMessage" class="p-4 bg-white shadow flex">
        <input
          v-model="messageInput"
          class="flex-1 border rounded p-2 mr-2"
          placeholder="Type your message..."
        />
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">
          Send
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* No additional styles needed since we rely on Tailwind */
</style> 