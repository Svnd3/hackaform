import { Route, Routes } from 'react-router-dom'
import AppLayout from './layout/AppLayout.jsx'
import AboutPage from './pages/AboutPage.jsx'
import EventDetailsPage from './pages/EventDetailsPage.jsx'
import ExplorePage from './pages/ExplorePage.jsx'
import HomePage from './pages/HomePage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import SavedPage from './pages/SavedPage.jsx'
import './App.css'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="events" element={<ExplorePage />} />
        <Route path="events/:eventId" element={<EventDetailsPage />} />
        <Route path="saved" element={<SavedPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
