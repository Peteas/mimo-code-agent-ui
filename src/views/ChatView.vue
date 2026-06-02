<template>
  <div class="flex h-screen overflow-hidden">
    <!-- Sidebar overlay for mobile -->
    <div
      v-if="sidebarOpen"
      @click="sidebarOpen = false"
      class="fixed inset-0 z-20 bg-black/50 md:hidden"
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
      <div ref="messagesContainer" class="flex-1 overflow-y-auto px-4 py-6">
        <div class="max-w-3xl mx-auto">
          <!-- Welcome -->
          <div v-if="chat.messages.length === 0" class="text-center py-20">
            <div class="w-16 h-16 rounded-2xl bg-[var(--color-primary)] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">M</div>
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
          <ChatMessage
            v-for="(msg, idx) in chat.messages"
            :key="idx"
            :message="msg"
          />

          <!-- Scroll to bottom button -->
          <button
            v-if="showScrollBtn"
            @click="scrollToBottom"
            class="fixed bottom-24 right-6 p-2 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] shadow-lg hover:bg-[var(--color-bg-secondary)] transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
      </div>

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
import { ref, onMounted, nextTick, watch } from 'vue'
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
const messagesContainer = ref<HTMLElement>()

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
})

watch(() => chat.messages.length, () => {
  nextTick(() => scrollToBottom())
})

function scrollToBottom() {
  messagesContainer.value?.scrollTo({
    top: messagesContainer.value.scrollHeight,
    behavior: 'smooth',
  })
}

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
