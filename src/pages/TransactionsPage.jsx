import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BackArrow from '../components/BackArrow'
import TransactionModal from '../components/TransactionModal'

function TransactionsPage() {
  const [safeAddress, setSafeAddress] = useState('0x179a8BDDa1AB5fEF17AAF6Ff0FFCb2875925668F')
  const [transactions, setTransactions] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const navigate = useNavigate()

  const fetchTransactions = async () => {
    if (!safeAddress.trim()) {
      setError('Please enter a Safe address.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const apiUrl = `${import.meta.env.VITE_SAFE_TRANSACTION_API_URL}/safes/${safeAddress}/multisig-transactions/`
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      const pendingTransactions = data.results.filter(tx => !tx.isExecuted)
      setTransactions(pendingTransactions)
    } catch (error) {
      setError(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const selectTransaction = (txHash) => {
    navigate(`/risk-detector?safeAddress=${encodeURIComponent(safeAddress)}&txHash=${encodeURIComponent(txHash)}`)
  }

  const viewTransactionDetails = (transaction, e) => {
    e.stopPropagation() // Prevent triggering the parent div's onClick
    setSelectedTransaction(transaction)
  }

  return (
    <div>
      <BackArrow to="/" />
      <h1>Pending Multisig Transactions</h1>
      
      <div id="input-container">
        <input
          type="text"
          value={safeAddress}
          onChange={(e) => setSafeAddress(e.target.value)}
          placeholder="Enter Safe address (e.g. 0x179a8BDDa1AB5fEF17AAF6Ff0FFCb2875925668F)"
        />
        <button onClick={fetchTransactions}>Fetch Pending Transactions</button>
      </div>

      <div id="transactions">
        {loading && <p className="loading">Loading transactions...</p>}
        {error && <p className="error">{error}</p>}
        {transactions && (
          transactions.length === 0 ? (
            <p>No pending transactions found.</p>
          ) : (
            <div className="transactions-list">
              {transactions.map((tx, index) => (
                <div 
                  key={tx.safeTxHash}
                  className="transaction-item" 
                  onClick={() => selectTransaction(tx.safeTxHash)}
                >
                  <h3>Transaction {index + 1}</h3>
                  <p><strong>To:</strong> {tx.to}</p>
                  <p><strong>Value:</strong> {tx.value} Wei</p>
                  <p><strong>Safe TX Hash:</strong> {tx.safeTxHash}</p>
                  <div className="transaction-buttons">
                    <button 
                      className="view-details-btn"
                      onClick={(e) => viewTransactionDetails(tx, e)}
                    >
                      View Details
                    </button>
                    <button className="select-btn">Select This Transaction</button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {selectedTransaction && (
        <TransactionModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  )
}

export default TransactionsPage 