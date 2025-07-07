<script setup>
import { onMounted, ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import MarkdownIt from 'markdown-it';

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

const md = new MarkdownIt({ linkify: true, breaks: true });

function markdownToHtml(text) {
  return md.render(text || '');
}

// NEW: create conversation
async function createNewConversation() {
  // Optimistically reset UI for a fresh chat session
  messages.value = [];
  isFirstMsg.value = true;
  if (currentConversationId.value && currentConversationId.value.has_no_msg) {
    return
  }
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

  // Ensure we have an active conversation – if not, create one first
  if (!currentConversationId.value) {
    try {
      const convRes = await axios.post(
        '/api/conversation',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newConv = convRes.data?.data;
      console.log('newConv', newConv)
      if (newConv?.id) {
        currentConversationId.value = newConv.id;
        conversations.value.unshift(newConv);
      }
    } catch (err) {
      console.error('Failed to create conversation', err);
      return;
    }
  }

  // Add user message to UI and prepare placeholder for AI reply
  const userMessage = {
    content: messageInput.value,
    ai_reply: '',
    timestamp: new Date().toISOString(),
  };
  messages.value.push(userMessage);
  const messageIndex = messages.value.length - 1;

  const toSend = messageInput.value;
  messageInput.value = '';

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message: toSend, conversationId: currentConversationId.value }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Network response was not ok (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let boundary;
      // SSE events are separated by two newlines (\n\n)
      while ((boundary = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, boundary).trim();
        buffer = buffer.slice(boundary + 2);

        // We only care about lines that start with "data:"
        if (!rawEvent.startsWith('data:')) continue;
        const dataStr = rawEvent.slice(5).trim();

        if (dataStr === '[DONE]') {
          // Stream finished
          break;
        }
        if (dataStr === '[ERROR]') {
          throw new Error('Server error during stream');
        }

        // Attempt to JSON-parse, fall back to string
        let token;
        try {
          token = JSON.parse(dataStr);
        } catch (_) {
          token = dataStr;
        }

        // Append token to the AI reply field
        messages.value[messageIndex].ai_reply += token;
      }
    }
  } catch (err) {
    console.error(err);
    router.push('/login');
  }
}

// NEW: delete conversation
async function deleteConversation(conversationId, e) {
  if (e) e.stopPropagation();
  const confirmDelete = window.confirm('Are you sure you want to delete this chat?');
  if (!confirmDelete) return;
  try {
    await axios.delete(`/api/conversation/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // Remove from local list
    conversations.value = conversations.value.filter(c => c.id !== conversationId);
    // If currently open conversation is deleted, reset
    if (currentConversationId.value === conversationId) {
      currentConversationId.value = null;
      messages.value = [];
      isFirstMsg.value = true;
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
        <li v-for="(conversation, idx) in conversations" :key="idx"
          class="mb-2 text-sm flex items-center justify-between hover:bg-gray-700 p-2 rounded cursor-pointer"
          @click="getMessagesByConversation(conversation.id)">
          <span class="text-sm truncate mr-2">{{ conversation.title || `Conversation #${conversation.id}` }}</span>
          <button @click.stop="deleteConversation(conversation.id, $event)" aria-label="Delete conversation"
            class="text-red-500 hover:text-red-600">
            <!-- trash icon -->
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
              stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6l-1 14H6L5 6"></path>
              <path d="M10 11v6"></path>
              <path d="M14 11v6"></path>
            </svg>
          </button>
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
            <span class="font-semibold">AI:</span>
            <div v-html="markdownToHtml(msg.ai_reply)"></div>
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