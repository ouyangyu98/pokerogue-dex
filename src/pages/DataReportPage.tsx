import { useEffect, useState } from 'react'
import SEOMeta from '../seo/SEOMeta'
import JsonLd from '../seo/JsonLd'
import { getReportMeta } from '../seo/generateMeta'
import { buildBreadcrumbList, buildWebSite } from '../seo/schemaBuilders'
import DataReportOriginal from '../components/DataReport'
import type { DataReport } from '../types'

export default function DataReportPage() {
  const [report, setReport] = useState<DataReport | null>(null)

  useEffect(() => {
    fetch('/data/data-report.json')
      .then(r => r.json())
      .then((data: DataReport) => setReport(data))
      .catch(() => {})
  }, [])

  const meta = report ? getReportMeta(report) : { title: '数据报告 - PokeRogue 中文图鉴', description: 'PokeRogue 数据覆盖与生成报告。' }

  return (
    <div className="page">
      <SEOMeta title={meta.title} description={meta.description} path="/report" keywords="PokeRogue,宝可梦肉鸽,数据报告,覆盖率" />
      <JsonLd
        data={[
          buildWebSite(),
          buildBreadcrumbList([
            { name: '首页', path: '/' },
            { name: '数据报告', path: '/report' },
          ]),
        ]}
      />
      <DataReportOriginal />
    </div>
  )
}
