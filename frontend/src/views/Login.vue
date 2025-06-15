<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { API_HOST } from '../config.js';

const router = useRouter();
const username = ref('');
const password = ref('');
const error = ref('');

async function login() {
  error.value = '';
  if (!username.value || !password.value) {
    error.value = 'Username and password are required';
    return;
  }
  try {
    const res = await axios.post(`${API_HOST}/api/login`, {
      username: username.value,
      password: password.value,
    });
    localStorage.setItem('token', res.data.token);
    router.push('/chat');
  } catch (err) {
    error.value = err?.response?.data?.message || 'Login failed';
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 rounded shadow w-full max-w-md">
      <h1 class="text-2xl font-bold mb-6 text-center">Login</h1>
      <div v-if="error" class="bg-red-100 text-red-700 p-2 mb-4 rounded">
        {{ error }}
      </div>
      <form @submit.prevent="login" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Username</label>
          <input v-model="username" type="text" class="mt-1 w-full border rounded p-2" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Password</label>
          <input v-model="password" type="password" class="mt-1 w-full border rounded p-2" />
        </div>
        <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">Login</button>
      </form>
    </div>
  </div>
</template> 