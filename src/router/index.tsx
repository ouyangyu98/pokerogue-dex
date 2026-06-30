import { RouterProvider } from 'react-router-dom'
import { HelmetProvider } from '../seo/Helmet'
import { router } from './routes'

export default function AppRouter() {
  return (
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>
  )
}
