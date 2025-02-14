import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import BackArrow from '../components/BackArrow'

function SignTransactionPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [transactionDetails, setTransactionDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [signing, setSigning] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const safeAddress = searchParams.get('safeAddress')
  const txHash = searchParams.get('txHash')

  useEffect(() => {
    if (!safeAddress || !txHash) {
      setError('Missing required parameters')
      setLoading(false)
      return
    }

    fetchTransactionDetails()
  }, [safeAddress, txHash])

  const fetchTransactionDetails = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SAFE_TRANSACTION_API_URL}/multisig-transactions/${txHash}/`
      )
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const tx = await response.json()
      const ethValue = tx.value ? (Number(tx.value) / 1e18).toFixed(6) : '0'
      setTransactionDetails({ ...tx, ethValue })
    } catch (error) {
      setError(`Error loading transaction details: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSignTransaction = async () => {
    setSigning(true)
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL_SAFE}/send_safe_transaction/${safeAddress}/${txHash}`,
        {
          method: 'POST',
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to sign transaction: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.status === 'success') {
        setIsSubmitted(true);
      } else {
        throw new Error('Transaction signing failed');
      }
    } catch (error) {
      setError(`Error signing transaction: ${error.message}`);
    } finally {
      setSigning(false);
    }
  }

  const handleReturnHome = () => {
    navigate('/');
  }

  const handleViewTransaction = () => {
    window.open(`https://app.safe.global/transactions/queue?safe=sep:${safeAddress}`, '_blank');
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <div className="sign-transaction-page">
      <BackArrow to={`/intent-matcher?safeAddress=${safeAddress}&txHash=${txHash}`} />
      <h1>Sign Transaction</h1>

      {transactionDetails && (
        <div className="transaction-details">
          <h2>Transaction Details</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Safe Address:</label>
              <span>{safeAddress}</span>
            </div>
            <div className="info-item">
              <label>To:</label>
              <span>{transactionDetails.to}</span>
            </div>
            <div className="info-item">
              <label>Value:</label>
              <span>{transactionDetails.ethValue} ETH ({transactionDetails.value} Wei)</span>
            </div>
            <div className="info-item">
              <label>Nonce:</label>
              <span>{transactionDetails.nonce}</span>
            </div>
            <div className="info-item">
              <label>Safe TX Hash:</label>
              <span>{transactionDetails.safeTxHash}</span>
            </div>
            <div className="info-item">
              <label>Submission Date:</label>
              <span>{new Date(transactionDetails.submissionDate).toLocaleString()}</span>
            </div>
            {transactionDetails.dataDecoded && (
              <div className="info-item full-width">
                <label>Operation:</label>
                <span>
                  {transactionDetails.dataDecoded.method}
                  ({transactionDetails.dataDecoded.parameters
                    ? JSON.stringify(transactionDetails.dataDecoded.parameters, null, 2)
                    : 'No parameters'})
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="sign-actions">
        {!isSubmitted ? (
          <button 
            className="sign-button" 
            onClick={handleSignTransaction}
            disabled={signing}
          >
            {signing ? (
              <>
                <span className="spinner"></span>
                Signing...
              </>
            ) : (
              'Sign Transaction'
            )}
          </button>
        ) : (
          <div className="success-actions">
            <div className="message-container">
              <p className="success-message">Transaction is signed!!</p>
            </div>
            <div className="button-container">
              <button className="return-home-button" onClick={handleReturnHome}>
                Return Home
              </button>
              <button className="view-transaction-button" onClick={handleViewTransaction}>
                View Transaction
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .sign-transaction-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .transaction-details {
          background: white;
          border-radius: 12px;
          padding: 30px;
          margin: 20px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .info-item {
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .info-item.full-width {
          grid-column: 1 / -1;
        }

        .info-item label {
          display: block;
          font-weight: 500;
          margin-bottom: 5px;
        }

        .info-item span {
          word-break: break-all;
        }

        .sign-actions {
          display: flex;
          justify-content: center;
          margin-top: 30px;
        }

        .sign-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px 40px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1.1em;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .success-actions {
          display: flex;
          gap: 20px;
          justify-content: center;
        }

        .return-home-button,
        .view-transaction-button {
          padding: 12px 24px;
          border: none;
          border-radius: 4px;
          font-size: 1em;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .return-home-button {
          background: #6c757d;
          color: white;
        }

        .view-transaction-button {
          background: #007bff;
          color: white;
        }

        .return-home-button:hover {
          background: #5a6268;
        }

        .view-transaction-button:hover {
          background: #0056b3;
        }

        .sign-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .error {
          color: #dc3545;
          padding: 20px;
          background: #f8d7da;
          border-radius: 4px;
          margin: 20px 0;
        }
      `}</style>
    </div>
  )
}

export default SignTransactionPage 