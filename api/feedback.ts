interface FeedbackItem {
  id: string
  nickname: string
  content: string
  page?: string
  createdAt: string
}

const REPO = process.env.GITHUB_REPO || 'ouyangyu98/pokerogue-dex'
const TOKEN = process.env.GITHUB_TOKEN || ''
const LABEL = 'feedback'
const TITLE_PREFIX = '反馈 · '
const MAX_CONTENT_LENGTH = 500
const MAX_NICKNAME_LENGTH = 20

const GITHUB_API = 'https://api.github.com'

function parseIssueToFeedback(issue: any): FeedbackItem {
  // Metadata is stored in an HTML comment at the end of the issue body
  const metaMatch = issue.body?.match(/<!--feedback-meta:(.*?)-->/)
  let meta: { nickname?: string; page?: string; createdAt?: string } = {}
  if (metaMatch) {
    try {
      meta = JSON.parse(metaMatch[1])
    } catch {
      // ignore parse errors
    }
  }

  // Content is everything before the metadata comment
  let content = issue.body || ''
  if (metaMatch && metaMatch.index !== undefined) {
    content = content.slice(0, metaMatch.index).trim()
  }

  return {
    id: String(issue.number),
    nickname: meta.nickname || '匿名训练师',
    content,
    page: meta.page,
    createdAt: meta.createdAt || issue.created_at,
  }
}

async function ensureLabelExists(): Promise<void> {
  try {
    const checkResp = await fetch(`${GITHUB_API}/repos/${REPO}/labels/${LABEL}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        ...(TOKEN ? { Authorization: `token ${TOKEN}` } : {}),
      },
    })
    if (checkResp.ok) return

    // Label doesn't exist, try to create it
    await fetch(`${GITHUB_API}/repos/${REPO}/labels`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `token ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: LABEL,
        color: '667eea',
        description: '用户页面反馈',
      }),
    })
  } catch (err) {
    // Non-fatal: continue without the label
    console.error('Label setup skipped:', err)
  }
}

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  // GET — list feedback issues
  if (req.method === 'GET') {
    try {
      // Fetch all open issues (no label filter); feedback items are identified
      // by the title prefix because some fine-grained tokens cannot apply labels.
      const resp = await fetch(
        `${GITHUB_API}/repos/${REPO}/issues?state=open&per_page=100&sort=created&direction=desc`,
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            ...(TOKEN ? { Authorization: `token ${TOKEN}` } : {}),
          },
        },
      )

      if (!resp.ok) {
        console.error('GitHub API error:', resp.status)
        return res.status(200).json({ items: [], error: 'Failed to load feedback' })
      }

      const issues = await resp.json()
      const items: FeedbackItem[] = (issues as any[])
        .filter(issue => !issue.pull_request && issue.title?.startsWith(TITLE_PREFIX))
        .map(parseIssueToFeedback)

      return res.status(200).json({ items })
    } catch (err) {
      console.error('Failed to fetch feedback:', err)
      return res.status(200).json({ items: [], error: 'Failed to load feedback' })
    }
  }

  // POST — create a feedback issue
  if (req.method === 'POST') {
    if (!TOKEN) {
      return res.status(500).json({ error: '服务未配置 GITHUB_TOKEN' })
    }

    try {
      const content = (req.body?.content || '').toString().trim()
      const nickname = (req.body?.nickname || '').toString().trim() || '匿名训练师'
      const page = (req.body?.page || '').toString().trim() || undefined

      if (!content) {
        return res.status(400).json({ error: '反馈内容不能为空' })
      }
      if (content.length > MAX_CONTENT_LENGTH) {
        return res.status(400).json({ error: `反馈内容不能超过${MAX_CONTENT_LENGTH}字` })
      }
      if (nickname.length > MAX_NICKNAME_LENGTH) {
        return res.status(400).json({ error: `昵称不能超过${MAX_NICKNAME_LENGTH}字` })
      }

      const createdAt = new Date().toISOString()
      const meta = JSON.stringify({ nickname, page, createdAt })

      const titleContent = content.length > 50 ? content.slice(0, 50) + '...' : content
      const title = `${TITLE_PREFIX}${nickname}: ${titleContent}`
      const body = `${content}\n\n<!--feedback-meta:${meta}-->`

      // Best-effort label setup; some fine-grained tokens cannot manage labels
      await ensureLabelExists()

      const resp = await fetch(`${GITHUB_API}/repos/${REPO}/issues`, {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `token ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          body,
          labels: [LABEL],
        }),
      })

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}))
        console.error('GitHub API error:', resp.status, errorData)
        return res.status(500).json({ error: '提交失败，请稍后重试' })
      }

      const issue = await resp.json()
      const item = parseIssueToFeedback(issue)

      return res.status(200).json({ success: true, item })
    } catch (err) {
      console.error('Failed to submit feedback:', err)
      return res.status(500).json({ error: '提交失败，请稍后重试' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
