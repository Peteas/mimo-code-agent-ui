import { defineStore } from 'pinia'
import { ref } from 'vue'
import { streamChat, type SSEEvent } from '../api/chat'
import { getSessions, deleteSession, getMessages } from '../api/session'

export interface DisplayMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  toolCalls?: Array<{ id: string; name: string; arguments: string }>
  toolName?: string
  isStreaming?: boolean
}

export const useChatStore = defineStore('chat', () => {
  const sessions = ref<string[]>([])
  const currentSessionId = ref('')
  const messages = ref<DisplayMessage[]>([])
  const isStreaming = ref(false)
  const showAuthModal = ref(false)

  let abortController: AbortController | null = null

  async function loadSessions() {
    try {
      const res = await getSessions()
      if (res.code === 0) {
        sessions.value = res.data || []
      }
    } catch {
      // Silent fail
    }
  }

  async function loadMessages(sessionId: string) {
    currentSessionId.value = sessionId
    try {
      const res = await getMessages(sessionId)
      if (res.code === 0) {
        messages.value = (res.data || []).map((m) => ({
          role: m.role,
          content: m.content,
          toolCalls: m.toolCalls,
        }))
      }
    } catch {
      messages.value = []
    }
  }

  async function removeSession(sessionId: string) {
    try {
      await deleteSession(sessionId)
      sessions.value = sessions.value.filter((s) => s !== sessionId)
      if (currentSessionId.value === sessionId) {
        currentSessionId.value = ''
        messages.value = []
      }
    } catch {
      // Silent fail
    }
  }

  function newSession() {
    currentSessionId.value = ''
    messages.value = []
  }

  async function sendMessage(content: string, regenerate = false) {
    if (!content.trim() || isStreaming.value) return

    let sessionId = currentSessionId.value
    if (!sessionId) {
      sessionId = 'web-' + crypto.randomUUID()
      currentSessionId.value = sessionId
    }

    if (!regenerate) {
      messages.value.push({ role: 'user', content })
    }

    isStreaming.value = true
    abortController = new AbortController()

    // Add placeholder for assistant response
    const assistantIndex = messages.value.length
    messages.value.push({ role: 'assistant', content: '', isStreaming: true })

    let accumulated = ''

    await streamChat({
      message: content,
      sessionId,
      regenerate,
      signal: abortController.signal,
      onEvent(event: SSEEvent) {
        switch (event.type) {
          case 'ANSWER_CHUNK':
            accumulated += event.content
            messages.value[assistantIndex] = {
              ...messages.value[assistantIndex],
              content: accumulated,
            }
            break
          case 'TOOL_CALL':
            messages.value.push({
              role: 'system',
              content: `Calling tool: ${event.toolName}\n${event.content}`,
              toolName: event.toolName,
            })
            break
          case 'TOOL_RESULT':
            messages.value.push({
              role: 'tool',
              content: event.content,
              toolName: event.toolName,
            })
            break
          case 'THINKING':
            // Could add thinking indicator
            break
          case 'ERROR':
            messages.value.push({ role: 'system', content: event.content })
            break
        }
      },
      onDone() {
        messages.value[assistantIndex] = {
          ...messages.value[assistantIndex],
          isStreaming: false,
        }
        isStreaming.value = false
        // Refresh sessions list
        loadSessions()
      },
      onError(error: string) {
        messages.value[assistantIndex] = {
          ...messages.value[assistantIndex],
          content: accumulated || `Error: ${error}`,
          isStreaming: false,
        }
        isStreaming.value = false
      },
    })
  }

  function cancelStream() {
    abortController?.abort()
    isStreaming.value = false
  }

  function regenerate() {
    const lastAssistantIdx = messages.value.length - 1
    if (lastAssistantIdx >= 0 && messages.value[lastAssistantIdx].role === 'assistant') {
      messages.value.splice(lastAssistantIdx, 1)
    }
    // Find the last user message
    const lastUserMsg = [...messages.value].reverse().find((m) => m.role === 'user')
    if (lastUserMsg) {
      sendMessage(lastUserMsg.content, true)
    }
  }

  return {
    sessions,
    currentSessionId,
    messages,
    isStreaming,
    showAuthModal,
    loadSessions,
    loadMessages,
    removeSession,
    newSession,
    sendMessage,
    cancelStream,
    regenerate,
  }
})
