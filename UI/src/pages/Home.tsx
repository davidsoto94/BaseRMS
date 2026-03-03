import Sidebar from '../components/Sidebar'
import { useI18n } from '../i18n/I18nProvider'

export default function Home() {
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-12 md:ml-0">
        <section className="rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
            {t('home.title')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            {t('home.subtitle')}
          </p>
        </section>
      </main>
    </div>
  )
}
