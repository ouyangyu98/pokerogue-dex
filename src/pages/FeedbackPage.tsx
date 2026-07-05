import { useEffect, useState, useCallback } from 'react'
import SEOMeta from '../seo/SEOMeta'
import JsonLd from '../seo/JsonLd'
import { buildBreadcrumbList, buildWebSite } from '../seo/schemaBuilders'

interface FeedbackItem {
  id: string
  nickname: string
  content: string
  page?: string
  createdAt: string
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const min = Math.floor(diff / 60000)
  const hr = Math.floor(diff / 3600000)
  const day = Math.floor(diff / 86400000)

  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  if (hr < 24) return `${hr} 小时前`
  if (day < 30) return `${day} 天前`
  return d.toLocaleDateString('zh-CN')
}

const PAGE_LABELS: Record<string, string> = {
  '/pokemon': '精灵图鉴',
  '/biomes': '地区查询',
  '/items': '道具清单',
  '/types': '属性克制',
  '/natures': '性格表',
  '/map': '地区导航',
  '/team': '配队分析',
  '/report': '数据报告',
  '/feedback': '反馈页',
}

export default function FeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [nickname, setNickname] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const loadFeedback = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/feedback')
      const data = await res.json()
      setItems(data.items || [])
    } catch {
      setError('加载反馈列表失败，请刷新重试')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFeedback()
  }, [loadFeedback])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setSubmitting(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nickname.trim(),
          content: content.trim(),
          page: window.location.pathname,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '提交失败')
      } else {
        setContent('')
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        // Optimistic: prepend new item
        if (data.item) {
          setItems(prev => [data.item, ...prev])
        }
      }
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  const remaining = 500 - content.length

  return (
    <div className="page">
      <SEOMeta
        title="反馈留言 - PokeRogue 中文图鉴"
        description="提交你对 PokeRogue 中文图鉴的反馈和建议，所有人都可以查看。"
        path="/feedback"
        keywords="PokeRogue,反馈,留言,建议"
      />
      <JsonLd
        data={[
          buildWebSite(),
          buildBreadcrumbList([
            { name: '首页', path: '/' },
            { name: '反馈留言', path: '/feedback' },
          ]),
        ]}
      />

      <div className="feedback-page">
        <div className="feedback-header">
          <h2>反馈留言墙</h2>
          <p>遇到 bug、有功能建议、或者想说点什么？留在这里，所有人都能看到。</p>
        </div>

        {/* Submit form */}
        <form className="feedback-form" onSubmit={handleSubmit}>
          <div className="feedback-form-row">
            <input
              type="text"
              className="feedback-nickname"
              placeholder="昵称（选填，留空显示「匿名训练师」）"
              value={nickname}
              maxLength={20}
              onChange={e => setNickname(e.target.value)}
            />
          </div>
          <textarea
            className="feedback-textarea"
            placeholder="写下你的反馈..."
            value={content}
            maxLength={500}
            rows={3}
            onChange={e => setContent(e.target.value)}
            required
          />
          <div className="feedback-form-footer">
            <span className={`feedback-counter ${remaining < 50 ? 'warning' : ''}`}>
              {remaining} 字剩余
            </span>
            <div className="feedback-form-actions">
              {success && <span className="feedback-success">✓ 提交成功</span>}
              {error && <span className="feedback-error">{error}</span>}
              <button
                type="submit"
                className="feedback-submit-btn"
                disabled={submitting || !content.trim()}
              >
                {submitting ? '提交中...' : '提交反馈'}
              </button>
            </div>
          </div>
        </form>

        {/* Feedback list */}
        <div className="feedback-list-header">
          <span>全部留言 ({items.length})</span>
          <button className="feedback-refresh" onClick={loadFeedback} disabled={loading}>
            {loading ? '加载中...' : '↻ 刷新'}
          </button>
        </div>

        {loading && items.length === 0 ? (
          <div className="feedback-empty">加载中...</div>
        ) : items.length === 0 ? (
          <div className="feedback-empty">
            还没有留言，快来抢沙发吧 🛋️
          </div>
        ) : (
          <div className="feedback-list">
            {items.map(item => (
              <div key={item.id} className="feedback-item">
                <div className="feedback-item-avatar">
                  {item.nickname.charAt(0).toUpperCase()}
                </div>
                <div className="feedback-item-body">
                  <div className="feedback-item-meta">
                    <span className="feedback-item-name">{item.nickname}</span>
                    {item.page && PAGE_LABELS[item.page] && (
                      <span className="feedback-item-page">{PAGE_LABELS[item.page]}</span>
                    )}
                    <span className="feedback-item-time">{formatTime(item.createdAt)}</span>
                  </div>
                  <div className="feedback-item-content">{item.content}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
