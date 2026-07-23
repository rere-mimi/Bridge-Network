import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { CrossSectionApp } from './components/CrossSectionApp'
import './index.css'
import './App.css'

function isSectionRoute() {
  return window.location.hash.startsWith('#/section')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isSectionRoute() ? <CrossSectionApp /> : <App />}
  </StrictMode>,
)
