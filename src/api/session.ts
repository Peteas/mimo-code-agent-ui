import client from './client'

export interface Message {
  role: 'user' | 'assistant' | 'tool' | 'system'
  content: string
  toolCalls?: Array<{ id: string; name: string; arguments: string }>
}

export async function getSessions(): Promise<{ code: number; data: string[] }> {
  const { data } = await client.get('/sessions')
  return data
}

export async function deleteSession(sessionId: string) {
  const { data } = await client.delete(`/sessions/${sessionId}`)
  return data
}

export async function getMessages(sessionId: string): Promise<{ code: number; data: Message[] }> {
  const { data } = await client.get(`/sessions/${sessionId}/messages`)
  return data
}
