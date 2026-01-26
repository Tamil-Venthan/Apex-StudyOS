import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import MainLayout from './components/Layout/MainLayout'
import { ThemeProvider } from './components/ThemeProvider'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import PageLoader from './components/PageLoader'
import PageTransition from './components/PageTransition'

// Lazy load all route components for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const MySubjects = lazy(() => import('./pages/MySubjects'))
const MyClasses = lazy(() => import('./pages/MyClasses'))

const Analytics = lazy(() => import('./pages/Analytics'))
const Schedule = lazy(() => import('./pages/Schedule'))
const Timer = lazy(() => import('./pages/Timer'))

const Settings = lazy(() => import('./pages/Settings'))
const SubjectDetail = lazy(() => import('./pages/SubjectDetail'))
const CourseDetail = lazy(() => import('./pages/CourseDetail'))
const Calendar = lazy(() => import('./pages/Calendar'))
const AICoach = lazy(() => import('./pages/AICoach'))

function App(): React.JSX.Element {
  useKeyboardShortcuts()

  return (
    <ThemeProvider>
      <MainLayout>
        <Suspense fallback={<PageLoader />}>
          <PageTransition>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/subjects" element={<MySubjects />} />
              <Route path="/subjects/:id" element={<SubjectDetail />} />
              <Route path="/classes" element={<MyClasses />} />
              <Route path="/classes/:id" element={<CourseDetail />} />

              <Route path="/analytics" element={<Analytics />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/timer" element={<Timer />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/ai-coach" element={<AICoach />} />

              <Route path="/settings" element={<Settings />} />
            </Routes>
          </PageTransition>
        </Suspense>
      </MainLayout>
    </ThemeProvider>
  )
}

export default App
