import { kv } from '@vercel/kv'

export interface FeedbackItem {
  id: string
  nickname: string
  content: string
  page?: string
  createdAt: string
}

const MAX_CONTENT_LENGTH = 500
const MAX_NICKNAME_LENGTH = 20
const LIST_KEY = 'feedback:list'
const MAX_ITEMS = 200

export default async function handler(req: Request): Promise<Response> {
  // CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  if (req.method === 'GET') {
    try {
      const rawItems = await kv.lrange(LIST_KEY, 0, MAX_ITEMS - 1)
      const items: FeedbackItem[] = rawItems.map((raw: string) => JSON.parse(raw))
      return Response.json({ items }, { headers })
    } catch (err) {
      console.error('Failed to fetch feedback:', err)
      return Response.json({ items: [], error: 'Failed to load feedback' }, { status: 500, headers })
    }
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json()
      const content = (body.content || '').toString().trim()
      const nickname = (body.nickname || '').toString().trim() || '匿名训练师'
      const page = (body.page || '').toString().trim() || undefined

      if (!content) {
        return Response.json({ error: '反馈内容不能为空' }, { status: 400, headers })
      }
      if (content.length > MAX_CONTENT_LENGTH) {
        return Response.json({ error: `反馈内容不能超过${MAX_CONTENT_LENGTH}字` }, { status: 400, headers })
      }
      if (nickname.length > MAX_NICKNAME_LENGTH) {
        return Response.json({ error: `昵称不能超过${MAX_NICKNAME_LENGTH}字` }, { status: 400, headers })
      }

      const item: FeedbackItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        nickname,
        content,
        page,
        createdAt: new Date().toISOString(),
      }

      await kv.lpush(LIST_KEY, JSON.stringify(item))
      // Trim old items to prevent unbounded growth
      await kv.ltrim(LIST_KEY, 0, MAX_ITEMS - 1)

      return Response.json({ success: true, item }, { headers })
    } catch (err) {
      console.error('Failed to submit feedback:', err)
      return Response.json({ error: '提交失败，请稍后重试' }, { status: 500, headers })
    }
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405, headers })
}
