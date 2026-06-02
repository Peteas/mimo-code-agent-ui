<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="w-full max-w-sm rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] p-6 shadow-2xl">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-lg">M</div>
        <div>
          <h2 class="text-lg font-semibold">MiMo Code Agent</h2>
        </div>
      </div>

      <div class="flex gap-2 mb-4">
        <button
          :class="['flex-1 py-2 rounded-lg text-sm font-medium transition', mode === 'login' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]']"
          @click="mode = 'login'"
        >Login</button>
        <button
          :class="['flex-1 py-2 rounded-lg text-sm font-medium transition', mode === 'register' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]']"
          @click="mode = 'register'"
        >Register</button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-3">
        <input
          v-model="formUsername"
          type="text"
          placeholder="Username"
          class="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
          required
        />
        <input
          v-if="mode === 'register'"
          v-model="formEmail"
          type="email"
          placeholder="Email (optional)"
          class="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
        />
        <input
          v-model="formPassword"
          type="password"
          placeholder="Password"
          class="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
          required
        />
        <input
          v-if="mode === 'register'"
          v-model="formPasswordConfirm"
          type="password"
          placeholder="Confirm Password"
          class="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
          required
        />
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2 rounded-lg bg-[var(--color-primary)] text-white font-medium text-sm hover:bg-[var(--color-primary-hover)] transition disabled:opacity-50"
        >{{ loading ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Register') }}</button>
      </form>

      <p v-if="error" class="mt-3 text-red-500 text-xs text-center">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../../stores/auth'

defineProps<{ visible: boolean }>()

const auth = useAuthStore()
const mode = ref<'login' | 'register'>('login')
const loading = ref(false)
const error = ref('')

const formUsername = ref('')
const formEmail = ref('')
const formPassword = ref('')
const formPasswordConfirm = ref('')

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    if (mode.value === 'register') {
      if (formPassword.value !== formPasswordConfirm.value) {
        error.value = 'Passwords do not match'
        return
      }
      await auth.register(formUsername.value, formPassword.value, formEmail.value || undefined)
    } else {
      await auth.login(formUsername.value, formPassword.value)
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Operation failed'
  } finally {
    loading.value = false
  }
}
</script>
