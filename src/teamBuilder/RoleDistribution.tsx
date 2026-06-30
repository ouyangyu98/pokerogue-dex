import { ROLE_LABELS, type RoleResult } from './types'

interface RoleDistributionProps {
  roles: RoleResult
}

export default function RoleDistribution({ roles }: RoleDistributionProps) {
  const entries = Object.entries(roles.roleCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])

  return (
    <div className="analysis-card">
      <h4>职能分布</h4>
      {entries.length === 0 ? (
        <div className="analysis-empty">暂无数据</div>
      ) : (
        <div className="role-bars">
          {entries.map(([role, count]) => (
            <div key={role} className="role-bar-item">
              <div className="role-bar-label">{ROLE_LABELS[role as keyof typeof ROLE_LABELS]}</div>
              <div className="role-bar-track">
                <div
                  className="role-bar-fill"
                  style={{ width: `${Math.min((count / 6) * 100, 100)}%` }}
                />
              </div>
              <div className="role-bar-count">{count}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
