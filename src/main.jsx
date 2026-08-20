import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { SavedEventsProvider } from './context/SavedEventsContext.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SavedEventsProvider>
        <App />
      </SavedEventsProvider>
    </BrowserRouter>
  </StrictMode>,
)
