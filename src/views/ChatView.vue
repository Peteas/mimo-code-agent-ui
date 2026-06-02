<template>
  <div class="flex h-screen overflow-hidden">
    <!-- Sidebar overlay for mobile -->
    <div
      v-if="sidebarOpen"
      @click="sidebarOpen = false"
      class="fixed inset-0 z-20 bg-black/50 md:hidden"
      aria-hidden="true"
    ></div>

    <!-- Sidebar -->
    <Sidebar
      :open="sidebarOpen"
      :sessions="chat.sessions"
      :current-session-id="chat.currentSessionId"
      @new-session="handleNewSession"
      @select-session="handleSelectSession"
      @delete-session="handleDeleteSession"
    />

    <!-- Main Chat Area -->
    <main class="flex-1 flex flex-col min-w-0">
      <Header
        :title="chat.currentSessionId ? chat.currentSessionId.substring(0, 30) : 'New Conversation'"
        @toggle-sidebar="sidebarOpen = !sidebarOpen"
        @new-session="handleNewSession"
      />

      <!-- Messages -->
      <div ref="messagesContainer" class="flex-1 overflow-y-auto px-4 py-6" role="log" aria-live="polite" aria-label="Chat messages">
        <div class="max-w-3xl mx-auto">
          <!-- Loading state -->
          <div v-if="chat.isLoadingMessages" class="flex items-center justify-center py-20">
            <div class="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
            <span class="ml-3 text-sm text-[var(--color-text-secondary)]">Loading messages...</span>
          </div>

          <!-- Welcome -->
          <div v-else-if="chat.messages.length === 0" class="text-center py-20">
            <div class="w-16 h-16 rounded-2xl bg-[var(--color-primary)] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4" aria-hidden="true">M</div>
            <h2 class="text-xl font-semibold mb-2">MiMo Code Agent</h2>
            <p class="text-[var(--color-text-secondary)] text-sm max-w-md mx-auto mb-6">
              Powered by Xiaomi MiMo v2.5 Pro. I can help you read, write, and search code, execute commands, manage git, and more.
            </p>
            <div class="flex flex-wrap justify-center gap-2">
              <button
                v-for="suggestion in suggestions"
                :key="suggestion"
                @click="chat.sendMessage(suggestion)"
                class="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition"
              >{{ suggestion }}</button>
            </div>
          </div>

          <!-- Message List -->
          <TransitionGroup v-else name="msg" tag="div">
            <ChatMessage
              v-for="msg in chat.messages"
              :key="msg.id"
              :message="msg"
            />
          </TransitionGroup>

          <!-- Scroll to bottom button -->
          <Transition name="fade">
            <button
              v-if="showScrollBtn"
              @click="scrollToBottom"
              aria-label="Scroll to bottom"
              class="fixed bottom-24 right-6 p-2 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] shadow-lg hover:bg-[var(--color-bg-secondary)] transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </Transition>
        </div>
      </div>

      <!-- Error banner -->
      <Transition name="fade">
        <div v-if="chat.error" class="px-4 py-2 bg-red-500/10 border-t border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center justify-between">
          <span>{{ chat.error }}</span>
          <button @click="chat.error = ''" class="ml-2 text-xs underline hover:no-underline" aria-label="Dismiss error">Dismiss</button>
        </div>
      </Transition>

      <!-- Input -->
      <ChatInput
        :disabled="chat.isStreaming"
        @send="chat.sendMessage"
        @cancel="chat.cancelStream"
      />
    </main>
  </div>

  <!-- Auth Modal -->
  <AuthModal :visible="chat.showAuthModal" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useChatStore } from '../stores/chat'
import { useAuthStore } from '../stores/auth'
import Sidebar from '../components/layout/Sidebar.vue'
import Header from '../components/layout/Header.vue'
import ChatMessage from '../components/chat/ChatMessage.vue'
import ChatInput from '../components/chat/ChatInput.vue'
import AuthModal from '../components/auth/AuthModal.vue'

const chat = useChatStore()
const auth = useAuthStore()

const sidebarOpen = ref(false)
const showScrollBtn = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const autoScrollEnabled = ref(true)

const suggestions = [
  'List files in current directory',
  'Show git status',
  'Find all Java files',
  'Help me write a function',
]

onMounted(async () => {
  if (auth.isLoggedIn) {
    await auth.fetchUser()
    if (auth.isLoggedIn) {
      chat.showAuthModal = false
      await chat.loadSessions()
    } else {
      chat.showAuthModal = true
    }
  } else {
    chat.showAuthModal = true
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', handleGlobalKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
})

function handleGlobalKeydown(e: KeyboardEvent) {
  // Cmd/Ctrl+N: new session
  if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
    e.preventDefault()
    handleNewSession()
  }
  // Escape: close sidebar on mobile
  if (e.key === 'Escape') {
    sidebarOpen.value = false
  }
}

// Auto-scroll: watch message count for new messages
watch(() => chat.messages.length, () => {
  nextTick(() => scrollToBottom())
})

// Auto-scroll: watch last message content for streaming
watch(() => {
  const msgs = chat.messages
  if (msgs.length === 0) return ''
  return msgs[msgs.length - 1].content
}, () => {
  if (autoScrollEnabled.value) {
    nextTick(() => scrollToBottom())
  }
})

function scrollToBottom() {
  messagesContainer.value?.scrollTo({
    top: messagesContainer.value.scrollHeight,
    behavior: 'smooth',
  })
}

// Detect user scroll to disable auto-scroll
function handleScroll() {
  const el = messagesContainer.value
  if (!el) return
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
  autoScrollEnabled.value = atBottom
  showScrollBtn.value = !atBottom && chat.messages.length > 0
}

onMounted(() => {
  messagesContainer.value?.addEventListener('scroll', handleScroll, { passive: true })
})

async function handleNewSession() {
  chat.newSession()
  sidebarOpen.value = false
}

async function handleSelectSession(sessionId: string) {
  await chat.loadMessages(sessionId)
  sidebarOpen.value = false
  nextTick(() => scrollToBottom())
}

async function handleDeleteSession(sessionId: string) {
  if (confirm('Delete this conversation?')) {
    await chat.removeSession(sessionId)
  }
}
</script>

<style scoped>
.msg-enter-active {
  transition: all 0.2s ease-out;
}
.msg-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
