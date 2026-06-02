<template>
  <div class="border-t border-[var(--color-border)] bg-[var(--color-bg)] p-4">
    <div class="max-w-3xl mx-auto">
      <div class="flex items-end gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-2 focus-within:border-[var(--color-primary)] transition">
        <textarea
          ref="textareaRef"
          v-model="input"
          @keydown="handleKeydown"
          @input="autoResize"
          :disabled="disabled"
          placeholder="Ask me anything..."
          rows="1"
          class="flex-1 bg-transparent resize-none text-sm text-[var(--color-text)] placeholder-[var(--color-text-secondary)] focus:outline-none min-h-[24px] max-h-[120px]"
        ></textarea>
        <button
          v-if="disabled"
          @click="$emit('cancel')"
          class="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
        </button>
        <button
          v-else
          @click="handleSend"
          :disabled="!input.trim()"
          class="p-2 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition disabled:opacity-30"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
      <div class="mt-1 text-xs text-[var(--color-text-secondary)] text-center">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

const props = defineProps<{ disabled: boolean }>()
const emit = defineEmits<{ send: [content: string]; cancel: [] }>()

const input = ref('')
const textareaRef = ref<HTMLTextAreaElement>()

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function handleSend() {
  if (input.value.trim() && !props.disabled) {
    emit('send', input.value.trim())
    input.value = ''
    nextTick(() => autoResize())
  }
}

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}
</script>
