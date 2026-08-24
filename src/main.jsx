import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import AuthProvider from './context/AuthProvider.jsx'
import { SavedEventsProvider } from './context/SavedEventsContext.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SavedEventsProvider>
          <App />
        </SavedEventsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
