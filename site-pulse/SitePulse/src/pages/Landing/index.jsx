import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiCpu,
  FiGrid,
  FiTrendingUp,
  FiZap,
} from 'react-icons/fi';
import { ROUTES } from '@/constants/routes';

/**
 * Landing Page.
 * Public marketing front page rendered inside the LandingLayout.
 */

const FEATURES = [
  {
    icon: FiBriefcase,
    title: 'Projects & Tasks',
    description:
      'Plan, track, and deliver projects with structured boards, milestones, and complete visibility for every team.',
  },
  {
    icon: FiGrid,
    title: 'Sites & Monitoring',
    description:
      'Keep every site on schedule with live status, role assignments, punch lists, and real-time handover tracking.',
  },
  {
    icon: FiTrendingUp,
    title: 'CRM & Sales',
    description:
      'Leads, clients, pipelines, meetings, and follow-ups so no opportunity ever slips through the cracks.',
  },
  {
    icon: FiZap,
    title: 'AI-Powered Workspace',
    description:
      'Chat, reports, OCR, analytics, insights, and suggestions — an intelligent assistant built into your workflow.',
  },
  {
    icon: FiCalendar,
    title: 'Finance & Documents',
    description:
      'Expenses, budgets, and document management with role-based access at every level of the organization.',
  },
];

function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950/20 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 lg:px-6 py-20 lg:py-28 text-center">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-full px-4 py-1.5 mb-6">
            <FiCheckCircle className="w-4 h-4" />
            All your business operations in one place
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
            Everything your business needs,
            <br />
            <span className="text-blue-600 dark:text-blue-400">pulsing in sync.</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300">
            Site Pulse unifies projects, sites, CRM, HR, finance, and AI-powered
            insights into a single command center — built for construction,
            services, and growing teams.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={ROUTES.REGISTER}
              className="btn btn-primary inline-flex items-center gap-2 text-base px-8 py-3"
            >
              Get started free
              <FiArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center gap-2 text-base px-8 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Sign in to your account
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { value: '10+', label: 'Business modules' },
              { value: '6', label: 'AI features' },
              { value: '24/7', label: 'Cloud availability' },
              { value: '1', label: 'Source of truth' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              One platform, every department
            </h2>
            <p className="mt-3 max-w-xl mx-auto text-gray-600 dark:text-gray-400">
              Replace a stack of disconnected tools with a single, scoped workspace
              that every role can rely on.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-fit mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
{/* AI Highlight */}
      <section className="py-16 lg:py-20 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
              <FiCpu className="w-4 h-4" />
              Built-in AI
            </span>
            <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
              From reports to recommendations — instant.
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Ask natural-language questions, generate structured reports, extract
              text from documents, and receive proactive insights and suggestions
              — all scoped to your company&apos;s data.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'AI Chat & Reports',
                'AI OCR document extraction',
                'Data analytics in plain English',
                'Automated insights & suggestions',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <FiCheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to={ROUTES.REGISTER}
              className="btn btn-primary inline-flex items-center gap-2 mt-8"
            >
              Explore Site Pulse
              <FiArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">AI Assistant</p>
            <div className="mt-4 space-y-3">
              {[
                ['What are our biggest expenses this quarter?', true],
                ['Here are the top categories — materials account for the largest share of spend.', false],
                ['Generate a monthly inventory report', true],
                ['Report generated from your live company data. ✓', false],
              ].map(([text, isUser], idx) => (
                <div
                  key={idx}
                  className={`max-w-[90%] rounded-lg px-4 py-2 text-sm ${
                    isUser
                      ? 'ml-auto bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Ready to bring your operations into focus?
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Create your account in less than a minute and explore the full platform —
            no credit card required.
          </p>
          <Link
            to={ROUTES.REGISTER}
            className="btn btn-primary inline-flex items-center gap-2 mt-8 text-base px-8 py-3"
          >
            Create your account
            <FiArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </>
  );
}

export default LandingPage;