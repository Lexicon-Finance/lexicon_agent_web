import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import BackArrow from '../components/BackArrow'

function RiskDetectorPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [transactionDetails, setTransactionDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [checkResult, setCheckResult] = useState(null)
  const [checkRunning, setCheckRunning] = useState(false)
  const [showRiskAnalysis, setShowRiskAnalysis] = useState(false)
  const [infoStatuses, setInfoStatuses] = useState({
    contractInfo: { loading: false, error: null, data: null },
    simulation: { loading: false, error: null, data: null },
    decodedData: { loading: false, error: null, data: transactionDetails?.dataDecoded || null },
    basicInfo: { loading: false, data: null }
  })
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [riskScore, setRiskScore] = useState(null)
  const [riskReport, setRiskReport] = useState(null)

  // Update the ref and scroll function
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

  // Add useEffect to scroll when messages change
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
      
      setInfoStatuses(prev => ({
        ...prev,
        basicInfo: { loading: false, data: { ...tx, ethValue } },
        decodedData: { loading: false, data: tx.dataDecoded || null },
        contractInfo: { loading: false, data: { address: tx.to } },
        simulation: { loading: false, data: { value: tx.value, to: tx.to } }
      }))
    } catch (error) {
      setError(`Error loading transaction details: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const runRiskCheck = async () => {
    setCheckRunning(true)
    setCheckResult(null)
    setShowRiskAnalysis(true)
    setRiskScore(null)
    
    // Clear any existing messages
    setMessages([])

    try {
      // Build URL with query parameters
      const baseUrl = `${import.meta.env.VITE_BACKEND_API_URL_ANALYZER}/analyze`
      const params = new URLSearchParams({
        from_address: safeAddress || '',
        to_address: transactionDetails.to || '',
        value: String(Number(transactionDetails.value) || 0),
        data: transactionDetails.data || "0x",
        gas: String(Number(transactionDetails.gas) || 0),
        gas_price: String(Number(transactionDetails.gasPrice) || 0),
        dataDecoded: transactionDetails.dataDecoded ? JSON.stringify(transactionDetails.dataDecoded) : ""
      })
      
      const analyzeUrl = `${baseUrl}?${params.toString()}`
      console.log('Analysis URL:', analyzeUrl)

      const response = await fetch(analyzeUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        console.error('Error details:', errorData)
        throw new Error(`Analysis failed: ${response.statusText}${errorData ? ` - ${JSON.stringify(errorData)}` : ''}`)
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
              
              // Check if this is the final risk report message
              if (messageData.content && messageData.content.includes('================================== Ai Message ==================================')) {
                try {
                  // Extract the JSON part from the message
                  const jsonMatch = messageData.content.match(/```json\n([\s\S]*?)\n```/)
                  if (jsonMatch) {
                    const reportData = JSON.parse(jsonMatch[1])
                    setRiskReport(reportData)
                    if (reportData.risk_score) {
                      setRiskScore(parseInt(reportData.risk_score))
                    }
                  }
                } catch (e) {
                  console.error('Error parsing risk report:', e)
                }
              }
              
              // Create a message object that includes all the data
              const newMessage = {
                type: 'assistant',
                content: messageData.content,
                raw: messageData
              }
              
              setMessages(prev => [...prev, newMessage])
            } catch (e) {
              console.error('Error parsing message:', e)
            }
          }
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'system',
        content: `Error during analysis: ${error.message}`
      }])
    } finally {
      setCheckRunning(false)
    }
  }

  const proceedToIntentMatcher = () => {
    navigate(`/intent-matcher?safeAddress=${encodeURIComponent(safeAddress)}&txHash=${encodeURIComponent(txHash)}`)
  }

  const renderStatus = (status) => {
    if (status.loading) return '🔄 Fetching...'
    if (status.error) return '❌ Error'
    if (status.data) return '✅ Ready'
    return '⚪ Not started'
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    // Add user message
    setMessages(prev => [...prev, {
      type: 'user',
      content: newMessage
    }])

    // Clear input
    setNewMessage('')

    // TODO: Here you would typically send the message to your LLM service
    // For now, just add a mock response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: 'I understand your question. Let me analyze that...'
      }])
    }, 1000)
  }

  const getRiskLevel = (score) => {
    if (score <= 33) return 'low-risk'
    if (score <= 66) return 'medium-risk'
    return 'high-risk'
  }

  const renderLoadingIndicator = () => {
    return (
      <div className="loading-indicator">
        <div className="loading-spinner"></div>
        <p>Analyzing transaction risks...</p>
      </div>
    )
  }

  // Add new component for risk report display
  const RiskReport = ({ report }) => {
    if (!report) return null;

    return (
      <div className="risk-report">
        <h2>{report.title}</h2>
        <div className={`risk-score ${getRiskLevel(report.risk_score)}`}>
          <h3>Risk Score: {report.risk_score}/100</h3>
          <div className="risk-bar">
            <div className="risk-fill" style={{ width: `${report.risk_score}%` }}></div>
          </div>
        </div>
        <div className="risk-analysis">
          <h3>Analysis</h3>
          <div className="analysis-content">
            {report.analysis}
          </div>
        </div>
        <style jsx>{`
          .risk-report {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }

          .risk-analysis {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
          }

          .analysis-content {
            white-space: pre-wrap;
            line-height: 1.5;
          }

          h2 {
            margin-top: 0;
            color: #333;
          }

          h3 {
            color: #555;
            margin-bottom: 10px;
          }
        `}</style>
      </div>
    );
  };

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <div>
      <BackArrow to="/transactions" />
      <h1>Risk Detector</h1>

      <div className="check-container checks-container">
        <div className="check-step">
          <h3>Risk Detection Check</h3>
          {!showRiskAnalysis ? (
            <button 
              className="check-btn" 
              onClick={runRiskCheck}
              disabled={checkRunning}
            >
              Run Risk Detection
            </button>
          ) : (
            <div className="conversation-container">
              <div className="messages-container" ref={messagesContainerRef}>
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`message ${message.type} ${message.raw ? 'with-raw-data' : ''}`}
                  >
                    <div className="message-content">
                      {message.content}
                    </div>
                    {message.items && (
                      <div className="status-list">
                        {message.items.map((item, i) => (
                          <div key={i} className="status-item">
                            <span className="status-title">{item.title}</span>
                            <span className="status-indicator">{renderStatus(item.status)}</span>
                            <a href="#" className="status-details">View Details</a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {checkRunning && (
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
                  placeholder="Ask a question about this transaction..."
                  className="message-input"
                />
                <button type="submit" className="send-button">
                  Send
                </button>
              </form>
              {riskReport && <RiskReport report={riskReport} />}
              {!checkRunning && (
                <div className="sign-container">
                  <button onClick={proceedToIntentMatcher} className="sign-btn">
                    Proceed to Intent Matcher
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
        .check-container {
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
          height: 400px; /* Fixed height */
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
          width: auto;
          max-width: 85%;
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

        .message.system.with-status-list {
          max-width: 100%;
        }

        .message-content {
          word-break: break-word;
          white-space: pre-wrap;
        }

        .status-list {
          margin-top: 8px;
          display: flex;
          flex-direction: row;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
        }

        .status-item {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 4px;
          gap: 12px;
          flex: 1;
          min-width: 200px;
        }

        .status-title {
          display: none;
        }

        .status-indicator {
          padding: 4px 8px;
          border-radius: 4px;
          background: #fff;
          font-size: 0.9em;
          white-space: nowrap;
        }

        .status-details {
          white-space: nowrap;
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

        .info-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 15px;
        }

        .info-item {
          display: flex;
          align-items: center;
          padding: 12px;
          background: white;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .info-title {
          flex: 1;
          font-weight: 500;
        }

        .status {
          padding: 4px 8px;
          margin: 0 10px;
          border-radius: 4px;
          background: #eee;
          font-size: 0.9em;
        }

        .view-details {
          color: #0066cc;
          text-decoration: none;
          font-size: 0.9em;
        }

        .view-details:hover {
          text-decoration: underline;
        }

        .risk-score {
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 15px;
        }

        .risk-score h3 {
          margin: 0 0 10px 0;
        }

        .risk-bar {
          height: 20px;
          background: #e0e0e0;
          border-radius: 10px;
          overflow: hidden;
        }

        .risk-fill {
          height: 100%;
          transition: width 0.5s ease-in-out;
        }

        .low-risk {
          background: #e8f5e9;
        }
        .low-risk .risk-fill {
          background: #4caf50;
        }

        .medium-risk {
          background: #fff3e0;
        }
        .medium-risk .risk-fill {
          background: #ff9800;
        }

        .high-risk {
          background: #ffebee;
        }
        .high-risk .risk-fill {
          background: #f44336;
        }

        .message.with-raw-data {
          position: relative;
        }

        .raw-data {
          margin-top: 10px;
          border-top: 1px solid rgba(0,0,0,0.1);
          padding-top: 10px;
        }

        .toggle-raw-data {
          background: #f0f0f0;
          border: 1px solid #ddd;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8em;
          cursor: pointer;
        }

        .toggle-raw-data:hover {
          background: #e0e0e0;
        }

        .raw-data pre {
          margin-top: 10px;
          padding: 10px;
          background: #f8f8f8;
          border-radius: 4px;
          font-size: 0.9em;
          overflow-x: auto;
          white-space: pre-wrap;
          word-wrap: break-word;
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
      `}</style>
    </div>
  )
}

export default RiskDetectorPage 