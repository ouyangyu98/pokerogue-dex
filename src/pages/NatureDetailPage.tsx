import { useParams, Link } from 'react-router-dom'
import SEOMeta from '../seo/SEOMeta'
import JsonLd from '../seo/JsonLd'
import { getNatureMeta } from '../seo/generateMeta'
import { buildNatureSchema, buildBreadcrumbList } from '../seo/schemaBuilders'

const natureRows = [
  { id: 'HARDY', nameZh: '勤奋', upStat: null, downStat: null },
  { id: 'LONELY', nameZh: '怕寂寞', upStat: '攻击', downStat: '防御' },
  { id: 'BRAVE', nameZh: '勇敢', upStat: '攻击', downStat: '速度' },
  { id: 'ADAMANT', nameZh: '固执', upStat: '攻击', downStat: '特攻' },
  { id: 'NAUGHTY', nameZh: '顽皮', upStat: '攻击', downStat: '特防' },
  { id: 'BOLD', nameZh: '大胆', upStat: '防御', downStat: '攻击' },
  { id: 'DOCILE', nameZh: '坦率', upStat: null, downStat: null },
  { id: 'RELAXED', nameZh: '悠闲', upStat: '防御', downStat: '速度' },
  { id: 'IMPISH', nameZh: '淘气', upStat: '防御', downStat: '特攻' },
  { id: 'LAX', nameZh: '乐天', upStat: '防御', downStat: '特防' },
  { id: 'TIMID', nameZh: '胆小', upStat: '速度', downStat: '攻击' },
  { id: 'HASTY', nameZh: '急躁', upStat: '速度', downStat: '防御' },
  { id: 'SERIOUS', nameZh: '认真', upStat: null, downStat: null },
  { id: 'JOLLY', nameZh: '爽朗', upStat: '速度', downStat: '特攻' },
  { id: 'NAIVE', nameZh: '天真', upStat: '速度', downStat: '特防' },
  { id: 'MODEST', nameZh: '内敛', upStat: '特攻', downStat: '攻击' },
  { id: 'MILD', nameZh: '慢吞吞', upStat: '特攻', downStat: '防御' },
  { id: 'QUIET', nameZh: '冷静', upStat: '特攻', downStat: '速度' },
  { id: 'BASHFUL', nameZh: '害羞', upStat: null, downStat: null },
  { id: 'RASH', nameZh: '马虎', upStat: '特攻', downStat: '特防' },
  { id: 'CALM', nameZh: '温和', upStat: '特防', downStat: '攻击' },
  { id: 'GENTLE', nameZh: '温顺', upStat: '特防', downStat: '防御' },
  { id: 'SASSY', nameZh: '自大', upStat: '特防', downStat: '速度' },
  { id: 'CAREFUL', nameZh: '慎重', upStat: '特防', downStat: '特攻' },
  { id: 'QUIRKY', nameZh: '浮躁', upStat: null, downStat: null },
]

export default function NatureDetailPage() {
  const { id } = useParams()
  const nature = natureRows.find(n => n.id === id)

  if (!nature) return <div className="loading">未找到该性格</div>

  const meta = getNatureMeta(nature)

  return (
    <div className="nature-detail-page detail-page">
      <SEOMeta title={meta.title} description={meta.description} path={`/nature/${nature.id}`} keywords={meta.keywords} />
      <JsonLd
        data={[
          ...buildNatureSchema(nature),
          buildBreadcrumbList([
            { name: '首页', path: '/' },
            { name: '性格表', path: '/natures' },
            { name: nature.nameZh, path: `/nature/${nature.id}` },
          ]),
        ]}
      />

      <Link to="/natures" className="back-link">← 返回性格表</Link>

      <h1>{nature.nameZh}性格</h1>
      <p className="lead">
        {nature.nameZh}性格
        {nature.upStat && nature.downStat
          ? `会提升${nature.upStat}、降低${nature.downStat}。`
          : '不会对能力值产生修正。'}
      </p>
    </div>
  )
}
