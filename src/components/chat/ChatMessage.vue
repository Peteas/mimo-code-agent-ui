<template>
  <div :class="['flex gap-3 mb-4', message.role === 'user' ? 'justify-end' : 'justify-start']">
    <!-- AI Avatar -->
    <div v-if="message.role !== 'user'" class="w-8 h-8 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-xs shrink-0" aria-hidden="true">
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
      :role="message.role === 'user' ? 'article' : 'article'"
      :aria-label="message.role === 'user' ? 'Your message' : 'AI response'"
    >
      <div v-if="message.role === 'user'" class="whitespace-pre-wrap">{{ message.content }}</div>
      <div v-else class="markdown-body" v-html="renderedContent" ref="markdownEl"></div>

      <!-- Streaming cursor -->
      <span v-if="message.isStreaming" class="inline-block w-2 h-4 bg-[var(--color-primary)] animate-pulse ml-1" aria-hidden="true"></span>
    </div>

    <!-- User Avatar -->
    <div v-if="message.role === 'user'" class="w-8 h-8 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-center justify-center text-xs shrink-0" aria-hidden="true">
      U
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { renderMarkdown } from '../../utils/markdown'
import type { DisplayMessage } from '../../stores/chat'

const props = defineProps<{ message: DisplayMessage }>()

const markdownEl = ref<HTMLElement | null>(null)

// Debounce rendering during streaming to avoid re-parsing on every SSE chunk
let renderTimer: ReturnType<typeof setTimeout> | null = null
const debouncedContent = ref(props.message.content)

watch(() => props.message.content, (newContent) => {
  if (props.message.isStreaming) {
    if (renderTimer) clearTimeout(renderTimer)
    renderTimer = setTimeout(() => {
      debouncedContent.value = newContent
    }, 80)
  } else {
    debouncedContent.value = newContent
  }
}, { immediate: true })

const renderedContent = computed(() => {
  if (!debouncedContent.value) return ''
  return renderMarkdown(debouncedContent.value)
})

// Event delegation for copy buttons (replaces inline onclick)
function handleCopyClick(e: Event) {
  const target = e.target as HTMLElement
  if (target.dataset.copy) {
    const codeBlock = target.closest('.code-block')
    const code = codeBlock?.querySelector('code')
    if (code) {
      navigator.clipboard.writeText(code.textContent || '')
    }
  }
}

onMounted(() => {
  markdownEl.value?.addEventListener('click', handleCopyClick)
})

onBeforeUnmount(() => {
  if (renderTimer) clearTimeout(renderTimer)
  markdownEl.value?.removeEventListener('click', handleCopyClick)
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
  cursor: pointer;
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
