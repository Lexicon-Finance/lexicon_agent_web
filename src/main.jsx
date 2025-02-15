import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'
import InstructionPage from './pages/InstructionPage'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import TransactionsPage from './pages/TransactionsPage'
import RiskDetectorPage from './pages/RiskDetectorPage'
import IntentMatcherPage from './pages/IntentMatcherPage'
import SignTransactionPage from './pages/SignTransactionPage'
import LandingPage from './pages/LandingPage'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <LandingPage />,
      },
      {
        path: "/instructions",
        element: <InstructionPage />,
      },
      {
        path: "/transactions",
        element: <TransactionsPage />,
      },
      {
        path: "/risk-detector",
        element: <RiskDetectorPage />,
      },
      {
        path: "/intent-matcher",
        element: <IntentMatcherPage />,
      },
      {
        path: "/sign-transaction",
        element: <SignTransactionPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
