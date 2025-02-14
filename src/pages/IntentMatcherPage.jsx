import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import BackArrow from '../components/BackArrow'

function IntentMatcherPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [transactionDetails, setTransactionDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [matchRunning, setMatchRunning] = useState(false)
  const [showMatchAnalysis, setShowMatchAnalysis] = useState(false)
  const [matchScore, setMatchScore] = useState(null)
  const [userIntent, setUserIntent] = useState(null)

  const messagesContainerRef = useRef(null)

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

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const { scrollHeight, clientHeight } = messagesContainerRef.current
      messagesContainerRef.current.scrollTop = scrollHeight - clientHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

  const runIntentMatch = async (providedIntent) => {
    setShowMatchAnalysis(true)
    setMatchScore(null)

    if (!providedIntent && !messages.length) {
      setMessages([{
        type: 'assistant',
        content: 'What is your intent with this transaction?'
      }])
      return
    }

    try {
      const baseUrl = `${import.meta.env.VITE_BACKEND_API_URL_ANALYZER}/match-intent`
      const params = new URLSearchParams({
        from_address: safeAddress || '',
        to_address: transactionDetails.to || '',
        value: String(Number(transactionDetails.value) || 0),
        data: transactionDetails.data || "0x",
        dataDecoded: transactionDetails.dataDecoded ? JSON.stringify(transactionDetails.dataDecoded) : "",
        intent: providedIntent || userIntent || ""
      })
      
      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        console.error('Error details:', errorData)
        throw new Error(`Match analysis failed: ${response.statusText}${errorData ? ` - ${JSON.stringify(errorData)}` : ''}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const messageData = JSON.parse(line.slice(6))
              const newMessage = {
                type: 'assistant',
                content: messageData.content,
                raw: messageData
              }
              setMessages(prev => [...prev, newMessage])

              const content = messageData.content
              if (messageData.content && messageData.content.includes('================================== Ai Message ==================================')) {
                try {
                  // Extract the JSON part from the message
                  const jsonMatch = messageData.content.match(/```json\n([\s\S]*?)\n```/)
                  if (jsonMatch) {
                    const reportData = JSON.parse(jsonMatch[1])
                    setMatchScore(reportData.match_score)
                  }
                } catch (e) {
                  console.error('Error parsing match score:', e)
                }
              }
              
            } catch (e) {
              console.error('Error parsing message:', e)
            }
          }
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'system',
        content: `Error during match analysis: ${error.message}`
      }])
    } finally {
      setMatchRunning(false)
    }
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setMessages(prev => [...prev, {
      type: 'user',
      content: newMessage
    }])

    if (!userIntent && messages.length === 1) {
      const intent = newMessage.trim()
      setUserIntent(intent)
      setMatchRunning(true)
      
      setTimeout(() => {
        runIntentMatch(intent)
      }, 0)
    }

    setNewMessage('')
  }

  const getMatchLevel = (score) => {
    if (score <= 33) return 'low-match'
    if (score <= 66) return 'medium-match'
    return 'high-match'
  }

  const renderLoadingIndicator = () => {
    return (
      <div className="loading-indicator">
        <div className="loading-spinner"></div>
        <p>Analyzing intent match...</p>
      </div>
    )
  }

  const proceedToSignTransaction = () => {
    navigate(`/sign-transaction?safeAddress=${encodeURIComponent(safeAddress)}&txHash=${encodeURIComponent(txHash)}`)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <div>
      <BackArrow to="/transactions" />
      <h1>Intent Matcher</h1>

      <div className="match-container">
        <div className="match-step">
          <h3>Intent Match Analysis</h3>
          {!showMatchAnalysis ? (
            <button 
              className="match-btn" 
              onClick={() => runIntentMatch()}
              disabled={matchRunning}
            >
              Run Intent Match
            </button>
          ) : (
            <div className="conversation-container">
              {userIntent && (
                <div className="stored-intent">
                  <small>Stored Intent: {userIntent}</small>
                </div>
              )}
              <div className="messages-container" ref={messagesContainerRef}>
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`message ${message.type} ${message.raw ? 'with-raw-data' : ''}`}
                  >
                    <div className="message-content">
                      {message.content}
                    </div>
                  </div>
                ))}
                {matchRunning && (
                  <div className="message system">
                    {renderLoadingIndicator()}
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="message-input-container">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ask about the intent matching..."
                  className="message-input"
                />
                <button type="submit" className="send-button">
                  Send
                </button>
              </form>
              {matchScore !== null && (
                <div className={`match-score ${getMatchLevel(matchScore)}`}>
                  <h3>Match Score: {matchScore}/100</h3>
                  <div className="match-bar">
                    <div className="match-fill" style={{ width: `${matchScore}%` }}></div>
                  </div>
                </div>
              )}
              {!matchRunning && (
                <div className="sign-container">
                  <button onClick={proceedToSignTransaction} className="sign-btn">
                    Proceed to Sign Transaction
                  </button>
                </div>
              )}
              
            </div>
          )}
        </div>
      </div>

      {transactionDetails && (
        <div className="transaction-info">
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

      <style jsx>{`
        .match-container {
          max-width: 1200px;
          margin: 20px auto;
          padding: 30px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .conversation-container {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }

        .messages-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
          height: 400px;
          overflow-y: auto;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .message {
          padding: 15px;
          border-radius: 8px;
          max-width: 85%;
        }

        .message.system {
          background: #e3e3e3;
          align-self: flex-start;
          font-style: italic;
        }

        .message.user {
          background: #007bff;
          color: white;
          align-self: flex-end;
          max-width: 60%;
        }

        .message.assistant {
          background: #f1f1f1;
          align-self: flex-start;
          max-width: 75%;
        }

        .message-content {
          word-break: break-word;
          white-space: pre-wrap;
        }

        .message-input-container {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }

        .message-input {
          flex: 1;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1em;
        }

        .send-button {
          padding: 12px 24px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }

        .send-button:hover {
          background: #0056b3;
        }

        .match-score {
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 10px;
        }

        .match-score.low-match { background: #f8d7da; }
        .match-score.medium-match { background: #fff3cd; }
        .match-score.high-match { background: #d4edda; }

        .match-bar {
          height: 10px;
          background: rgba(0,0,0,0.1);
          border-radius: 5px;
          overflow: hidden;
          margin-top: 10px;
        }

        .match-fill {
          height: 100%;
          background: currentColor;
          transition: width 0.3s ease;
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

        .stored-intent {
          padding: 8px;
          background: #f0f0f0;
          border-radius: 4px;
          margin-bottom: 10px;
          font-size: 0.8em;
          color: #666;
        }

        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          gap: 15px;
        }

        .loading-spinner {
          width: 30px;
          height: 30px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-indicator p {
          color: #666;
          margin: 0;
          font-size: 0.9em;
        }

        .message.system .loading-indicator {
          background: transparent;
        }

        .sign-container {
          display: flex;
          justify-content: center;
          margin-top: 20px;
        }

        .sign-btn {
          padding: 12px 24px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1em;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .sign-btn:hover {
          background: #218838;
        }
      `}</style>
    </div>
  )
}

export default IntentMatcherPage 