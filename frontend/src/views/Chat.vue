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

const conversations = ref([]);
const currentConversationId = ref(null);

const isFirstMsg = ref(true);

// NEW: state for mobile sidebar toggle
const sidebarOpen = ref(false);

// NEW: create conversation
async function createNewConversation() {
  // Optimistically reset UI for a fresh chat session
  messages.value = [];
  isFirstMsg.value = true;
  currentConversationId.value = null;

  try {
    const res = await axios.post(
      '/api/conversation',
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Expecting { msg: 'success', data: { id, title } }
    const newConv = res.data?.data;
    if (newConv?.id) {
      conversations.value.unshift(newConv);
      currentConversationId.value = newConv.id;
    }
  } catch (err) {
    // If the request fails, we simply log the error; the UI already reset
    console.error(err);
  }

  // Close sidebar on mobile after creating conversation
  sidebarOpen.value = false;
}

async function getConversations() {
  try {
    const res = await axios.get(`/api/conversation`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    conversations.value = res.data?.data || [];
  } catch (err) {
    console.error(err);
    router.push('/login');
  }
}

async function getMessagesByConversation(conversationId) {
  isFirstMsg.value = false;
  try {
    const res = await axios.get(`/api/conversation/message?conversationId=${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    messages.value = res.data?.data || [];
    currentConversationId.value = conversationId;
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
      '/api/chat',
      { message: toSend, conversationId: currentConversationId.value },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const { data } = res.data;
    if (data) {
      // Update the last message (user) with the AI reply
      const lastMsg = messages.value[messages.value.length - 1];
      if (lastMsg && !lastMsg.ai_reply) {
        lastMsg.ai_reply = data.ai_reply;
      }

      // If we didn't have conversation yet, set it (first message scenario)
      if (!currentConversationId.value && data.conversation_id) {
        currentConversationId.value = data.conversation_id;
      }
    }
  } catch (err) {
    console.error(err);
    router.push('/login');
  }
}

onMounted(() => {
  getConversations();
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
      <!-- NEW: New conversation button -->
      <button @click="createNewConversation()"
        class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mb-4 flex items-center justify-center">
        <!-- simple plus icon -->
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        New Chat
      </button>
      <ul>
        <li v-for="(conversation, idx) in conversations" :key="idx" class="mb-2 text-sm truncate cursor-pointer hover:bg-gray-700 p-2 rounded"
          @click="getMessagesByConversation(conversation.id)">
          {{ conversation.title || `Conversation #${conversation.id}` }}
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