import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import TransactionsPage from './pages/TransactionsPage'
import RiskDetectorPage from './pages/RiskDetectorPage'
import IntentMatcherPage from './pages/IntentMatcherPage'
import SignTransactionPage from './pages/SignTransactionPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/risk-detector" element={<RiskDetectorPage />} />
        <Route path="/intent-matcher" element={<IntentMatcherPage />} />
        <Route path="/sign-transaction" element={<SignTransactionPage />} />
      </Routes>
    </Router>
  )
}

export default App
