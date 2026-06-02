import { defineStore } from 'pinia'
import { ref } from 'vue'
import { streamChat, type SSEEvent } from '../api/chat'
import { getSessions, deleteSession, getMessages } from '../api/session'

export interface DisplayMessage {
  id: string
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
  const isLoadingSessions = ref(false)
  const isLoadingMessages = ref(false)
  const error = ref('')

  let abortController: AbortController | null = null

  function createMessage(role: DisplayMessage['role'], content: string, extras?: Partial<DisplayMessage>): DisplayMessage {
    return {
      id: crypto.randomUUID(),
      role,
      content,
      ...extras,
    }
  }

  async function loadSessions() {
    isLoadingSessions.value = true
    error.value = ''
    try {
      const res = await getSessions()
      if (res.code === 0) {
        sessions.value = res.data || []
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load sessions'
      console.error('loadSessions failed:', e)
    } finally {
      isLoadingSessions.value = false
    }
  }

  async function loadMessages(sessionId: string) {
    currentSessionId.value = sessionId
    isLoadingMessages.value = true
    error.value = ''
    try {
      const res = await getMessages(sessionId)
      if (res.code === 0) {
        messages.value = (res.data || []).map((m) =>
          createMessage(m.role, m.content, { toolCalls: m.toolCalls })
        )
      }
    } catch (e) {
      messages.value = []
      error.value = e instanceof Error ? e.message : 'Failed to load messages'
      console.error('loadMessages failed:', e)
    } finally {
      isLoadingMessages.value = false
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
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to delete session'
      console.error('removeSession failed:', e)
    }
  }

  function newSession() {
    currentSessionId.value = ''
    messages.value = []
    error.value = ''
  }

  async function sendMessage(content: string, regenerate = false) {
    if (!content.trim() || isStreaming.value) return

    let sessionId = currentSessionId.value
    if (!sessionId) {
      sessionId = 'web-' + crypto.randomUUID()
      currentSessionId.value = sessionId
    }

    if (!regenerate) {
      messages.value.push(createMessage('user', content))
    }

    isStreaming.value = true
    error.value = ''
    abortController = new AbortController()

    // Add placeholder for assistant response
    const assistantMsg = createMessage('assistant', '', { isStreaming: true })
    messages.value.push(assistantMsg)
    const assistantIndex = messages.value.length - 1

    let accumulated = ''
    let sessionsNeedRefresh = true

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
            messages.value.push(createMessage('system', `Calling tool: ${event.toolName}\n${event.content}`, { toolName: event.toolName }))
            break
          case 'TOOL_RESULT':
            messages.value.push(createMessage('tool', event.content, { toolName: event.toolName }))
            break
          case 'THINKING':
            break
          case 'ERROR':
            messages.value.push(createMessage('system', event.content))
            break
        }
      },
      onDone() {
        messages.value[assistantIndex] = {
          ...messages.value[assistantIndex],
          isStreaming: false,
        }
        isStreaming.value = false
        // Only refresh sessions if this was a new session
        if (sessionsNeedRefresh) {
          loadSessions()
          sessionsNeedRefresh = false
        }
      },
      onError(err: string) {
        messages.value[assistantIndex] = {
          ...messages.value[assistantIndex],
          content: accumulated || `Error: ${err}`,
          isStreaming: false,
        }
        isStreaming.value = false
        error.value = err
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
    isLoadingSessions,
    isLoadingMessages,
    error,
    loadSessions,
    loadMessages,
    removeSession,
    newSession,
    sendMessage,
    cancelStream,
    regenerate,
  }
})
