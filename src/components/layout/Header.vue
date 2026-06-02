<template>
  <header class="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
    <div class="flex items-center gap-3">
      <button @click="$emit('toggleSidebar')" class="md:hidden p-1 rounded hover:bg-[var(--color-bg-secondary)] transition">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
      <span class="text-sm font-medium text-[var(--color-text)]">{{ title }}</span>
    </div>
    <div class="flex items-center gap-2">
      <button @click="theme.toggle()" class="p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] transition">
        <svg v-if="theme.isDark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
      <button @click="$emit('newSession')" class="p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] transition">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useThemeStore } from '../../stores/theme'

defineProps<{ title: string }>()
defineEmits<{ toggleSidebar: []; newSession: [] }>()

const theme = useThemeStore()
</script>
