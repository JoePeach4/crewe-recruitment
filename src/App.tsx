import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import { ToastProvider } from './components/ui/Toast'

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/player/:playerName" element={<Dashboard />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
