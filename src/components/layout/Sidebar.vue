<template>
  <aside
    :class="[
      'fixed md:relative z-30 h-full w-64 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] flex flex-col transition-transform duration-200',
      open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
    ]"
  >
    <div class="p-4 border-b border-[var(--color-border)]">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm">M</div>
        <div>
          <div class="text-sm font-semibold">MiMo Code</div>
          <div class="text-xs text-[var(--color-text-secondary)]">AI Agent</div>
        </div>
      </div>
    </div>

    <div class="p-3">
      <button
        @click="$emit('newSession')"
        class="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Chat
      </button>
    </div>

    <div class="flex-1 overflow-y-auto px-2 space-y-1">
      <div
        v-for="session in sessions"
        :key="session"
        @click="$emit('selectSession', session)"
        :class="[
          'group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition',
          session === currentSessionId
            ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20'
            : 'hover:bg-[var(--color-bg)] text-[var(--color-text-secondary)]'
        ]"
      >
        <span class="truncate flex-1">{{ session.substring(0, 20) }}</span>
        <button
          @click.stop="$emit('deleteSession', session)"
          class="opacity-0 group-hover:opacity-100 ml-2 p-1 rounded hover:bg-red-500/10 hover:text-red-500 transition"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        </button>
      </div>
    </div>

    <div class="p-3 border-t border-[var(--color-border)]">
      <div v-if="auth.isLoggedIn" class="flex items-center justify-between">
        <span class="text-sm text-[var(--color-text-secondary)]">{{ auth.username }}</span>
        <button @click="auth.logout()" class="text-xs text-[var(--color-text-secondary)] hover:text-red-500 transition">Logout</button>
      </div>
      <div class="flex items-center gap-1 mt-2">
        <span class="w-2 h-2 rounded-full bg-[var(--color-primary)]"></span>
        <span class="text-xs text-[var(--color-text-secondary)]">mimo-v2.5-pro</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useAuthStore } from '../../stores/auth'

defineProps<{
  open: boolean
  sessions: string[]
  currentSessionId: string
}>()

defineEmits<{
  newSession: []
  selectSession: [sessionId: string]
  deleteSession: [sessionId: string]
}>()

const auth = useAuthStore()
</script>
