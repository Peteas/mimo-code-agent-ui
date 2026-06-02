<template>
  <div :class="['flex gap-3 mb-4', message.role === 'user' ? 'justify-end' : 'justify-start']">
    <!-- AI Avatar -->
    <div v-if="message.role !== 'user'" class="w-8 h-8 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-xs shrink-0">
      M
    </div>

    <!-- Message Content -->
    <div
      :class="[
        'max-w-[80%] rounded-xl px-4 py-3 text-sm',
        message.role === 'user'
          ? 'bg-[var(--color-primary)] text-white'
          : message.role === 'system'
          ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20'
          : message.role === 'tool'
          ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
          : 'bg-[var(--color-msg-ai)] text-[var(--color-text)]'
      ]"
    >
      <div v-if="message.role === 'user'" class="whitespace-pre-wrap">{{ message.content }}</div>
      <div v-else class="markdown-body" v-html="renderedContent"></div>

      <!-- Streaming cursor -->
      <span v-if="message.isStreaming" class="inline-block w-2 h-4 bg-[var(--color-primary)] animate-pulse ml-1"></span>
    </div>

    <!-- User Avatar -->
    <div v-if="message.role === 'user'" class="w-8 h-8 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-center justify-center text-xs shrink-0">
      U
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { renderMarkdown } from '../../utils/markdown'
import type { DisplayMessage } from '../../stores/chat'

const props = defineProps<{ message: DisplayMessage }>()

const renderedContent = computed(() => {
  if (!props.message.content) return ''
  return renderMarkdown(props.message.content)
})
</script>

<style scoped>
.markdown-body :deep(pre) {
  background: #0f172a;
  border-radius: 0.5rem;
  padding: 0.75rem;
  overflow-x: auto;
  margin: 0.5rem 0;
}
.markdown-body :deep(code) {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.75rem;
}
.markdown-body :deep(.code-block) {
  margin: 0.5rem 0;
  border-radius: 0.5rem;
  overflow: hidden;
}
.markdown-body :deep(.code-header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.375rem 0.75rem;
  background: #1e293b;
  font-size: 0.75rem;
  color: #94a3b8;
}
.markdown-body :deep(.code-lang) {
  color: #64748b;
}
.markdown-body :deep(.copy-btn) {
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  transition: background 0.15s;
}
.markdown-body :deep(.copy-btn:hover) {
  background: rgba(255, 255, 255, 0.1);
}
.markdown-body :deep(p) {
  margin: 0.25rem 0;
}
.markdown-body :deep(ul), .markdown-body :deep(ol) {
  padding-left: 1rem;
  margin: 0.25rem 0;
}
.markdown-body :deep(a) {
  color: var(--color-primary);
  text-decoration: underline;
}
.markdown-body :deep(blockquote) {
  border-left: 2px solid var(--color-border);
  padding-left: 0.75rem;
  font-style: italic;
  color: var(--color-text-secondary);
}
</style>
