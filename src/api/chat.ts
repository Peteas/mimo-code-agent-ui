export type SSEEventType = 'THINKING' | 'TOOL_CALL' | 'TOOL_RESULT' | 'ANSWER_CHUNK' | 'DONE' | 'ERROR'

export interface SSEEvent {
  type: SSEEventType
  toolName: string
  content: string
  isError: boolean
}

export interface ChatOptions {
  message: string
  sessionId: string
  regenerate?: boolean
  onEvent: (event: SSEEvent) => void
  onDone: () => void
  onError: (error: string) => void
  signal?: AbortSignal
}

function getAccessToken(): string {
  return sessionStorage.getItem('accessToken') || ''
}

export async function streamChat(options: ChatOptions): Promise<void> {
  const { message, sessionId, regenerate, onEvent, onDone, onError, signal } = options

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify({ message, sessionId, regenerate }),
      signal,
    })

    if (response.status === 401) {
      onError('Session expired. Please log in again.')
      return
    }

    if (!response.ok) {
      const errorText = await response.text()
      onError(`HTTP ${response.status}: ${errorText}`)
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      onError('No response body')
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('data:')) {
          try {
            const event: SSEEvent = JSON.parse(trimmed.substring(5).trim())
            onEvent(event)
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim().startsWith('data:')) {
      try {
        const event: SSEEvent = JSON.parse(buffer.trim().substring(5).trim())
        onEvent(event)
      } catch {
        // Skip
      }
    }

    onDone()
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      onDone()
    } else {
      onError(err instanceof Error ? err.message : 'Unknown error')
    }
  }
}
