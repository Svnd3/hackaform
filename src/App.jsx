import { Route, Routes } from 'react-router-dom'
import AppLayout from './layout/AppLayout.jsx'
import AboutPage from './pages/AboutPage.jsx'
import EventDetailsPage from './pages/EventDetailsPage.jsx'
import EventFormPage from './pages/EventFormPage.jsx'
import ExplorePage from './pages/ExplorePage.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import OrganizerDashboardPage from './pages/OrganizerDashboardPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import SavedPage from './pages/SavedPage.jsx'
import SchedulePage from './pages/SchedulePage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import './App.css'
import './styles/phase2.css'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="events" element={<ExplorePage />} />
        <Route path="events/:eventId" element={<EventDetailsPage />} />
        <Route path="saved" element={<SavedPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="organizer" element={<OrganizerDashboardPage />} />
          <Route path="organizer/events/new" element={<EventFormPage />} />
          <Route path="organizer/events/:eventId/edit" element={<EventFormPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
