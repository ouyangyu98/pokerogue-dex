import type { ReactNode } from 'react'
import { Helmet } from './Helmet'
import { siteConfig, getCanonicalPath } from './generateMeta'

export interface SEOMetaProps {
  title: string
  description: string
  path: string
  keywords?: string
  ogImage?: string
  ogType?: 'website' | 'article'
  noindex?: boolean
  children?: ReactNode
}

export default function SEOMeta({
  title,
  description,
  path,
  keywords,
  ogImage,
  ogType = 'website',
  noindex = false,
  children,
}: SEOMetaProps) {
  const canonical = getCanonicalPath(path)
  const ogImageUrl = ogImage?.startsWith('http') ? ogImage : `${siteConfig.siteUrl}${ogImage || siteConfig.defaultOgImage}`
  const fullTitle = title.includes(siteConfig.siteName) ? title : `${title} | ${siteConfig.siteName}`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:locale" content={siteConfig.locale} />
      <meta property="og:site_name" content={siteConfig.siteName} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />
      {siteConfig.twitterHandle && <meta name="twitter:site" content={siteConfig.twitterHandle} />}

      {children}
    </Helmet>
  )
}
