import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// StrictMode intentionally omitted: it double-mounts effects in dev, which
// churns the worker pool and the MathLive web component. Re-enable if needed.
createRoot(document.getElementById('root')!).render(<App />)
