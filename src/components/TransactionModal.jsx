import React, { useState, useEffect } from 'react'

function TransactionModal({ transaction, onClose }) {
  const [simulationResult, setSimulationResult] = useState(null)
  const [simulationLoading, setSimulationLoading] = useState(true)
  const [simulationError, setSimulationError] = useState(null)
  const [contractInfo, setContractInfo] = useState(null)
  const [contractLoading, setContractLoading] = useState(true)

  useEffect(() => {
    fetchSimulation()
    identifyAddress()
  }, [transaction])

  const fetchSimulation = async () => {
    setSimulationLoading(true)
    setSimulationError(null)

    try {
      // Build URL with query parameters
      const baseUrl = `${import.meta.env.VITE_BACKEND_API_URL_ANALYZER}/simulate`
      const params = new URLSearchParams({
        from_address: transaction.safe || '',
        to_address: transaction.to || '',
        value: String(Number(transaction.value) || 0),
        gas: String(Number(transaction.baseGas) || 0),
        gas_price: String(Number(transaction.gasPrice) || 0),
        input: transaction.data || "0x"
      })
      
      const simulateUrl = `${baseUrl}?${params.toString()}`
      console.log('Simulation URL:', simulateUrl)
      
      const response = await fetch(simulateUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        }
      })

      console.log('Response status:', response.status)
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        console.error('Error details:', errorData)
        throw new Error(`Simulation failed: ${response.statusText}${errorData ? ` - ${JSON.stringify(errorData)}` : ''}`)
      }

      const result = await response.json()
      setSimulationResult(result)
    } catch (error) {
      console.error('Simulation error:', error)
      setSimulationError(error.message)
    } finally {
      setSimulationLoading(false)
    }
  }

  const identifyAddress = async () => {
    setContractLoading(true)
    try {
      // Check if it's a multisend transaction
      const isMultiSend = transaction.dataDecoded?.method === 'multiSend'
      
      const fetchContractInfo = async (address) => {
        const url = `https://api-sepolia.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${import.meta.env.VITE_ETHERSCAN_API_KEY}`
        const response = await fetch(url)
        const data = await response.json()
        
        if (data.status === "1" && data.result[0]) {
          const sourceInfo = data.result[0]
          
          if (sourceInfo.ABI !== "Contract source code not verified") {
            // Contract verified
            return {
              type: 'contract',
              address,
              name: sourceInfo.ContractName,
              abi: JSON.parse(sourceInfo.ABI),
              implementation: sourceInfo.Implementation || null, // For proxy contracts
              proxy: sourceInfo.Proxy === "1"
            }
          } else {
            // Contract exists but not verified
            return {
              type: 'unverified_contract',
              address
            }
          }
        } else {
          // Likely an EOA
          return {
            type: 'eoa',
            address
          }
        }
      }
      
      if (isMultiSend) {
        // Parse multisend transactions
        const transactions = transaction.dataDecoded.parameters[0].valueDecoded
        const contractsInfo = await Promise.all(
          transactions.map(tx => fetchContractInfo(tx.to))
        )
        setContractInfo({
          type: 'multisend',
          contracts: contractsInfo
        })
      } else {
        // Check single contract
        const info = await fetchContractInfo(transaction.to)
        setContractInfo(info)
      }
    } catch (error) {
      console.error('Error fetching contract info:', error)
      setContractInfo({ type: 'error', message: error.message })
    } finally {
      setContractLoading(false)
    }
  }

  if (!transaction) return null

  const ethValue = transaction.value ? (Number(transaction.value) / 1e18).toFixed(6) : '0'

  // Format the entire transaction object for display
  const rawData = {
    ...transaction,
    // Remove redundant or circular references if any
    confirmations: transaction.confirmations?.length || 0,
  }

  const renderContractInfo = () => {
    if (contractLoading) {
      return <div className="contract-loading">Loading contract information...</div>
    }

    if (!contractInfo) return null

    switch (contractInfo.type) {
      case 'eoa':
        return (
          <div className="info-item full-width">
            <label>Address Type:</label>
            <span>Externally Owned Account (EOA)</span>
            <p className="address-info">{contractInfo.address}</p>
          </div>
        )

      case 'contract':
        return (
          <div className="info-item full-width">
            <label>Contract Information:</label>
            <div className="contract-info">
              <p><strong>Address:</strong> {contractInfo.address}</p>
              <p><strong>Name:</strong> {contractInfo.name}</p>
              <p><strong>Type:</strong> Verified Smart Contract {contractInfo.proxy && '(Proxy)'}</p>
              {contractInfo.implementation && (
                <p><strong>Implementation:</strong> {contractInfo.implementation}</p>
              )}
              <div className="contract-abi">
                <strong>ABI:</strong>
                <pre>{JSON.stringify(contractInfo.abi, null, 2)}</pre>
              </div>
            </div>
          </div>
        )

      case 'unverified_contract':
        return (
          <div className="info-item full-width">
            <label>Contract Information:</label>
            <div className="contract-info">
              <p><strong>Address:</strong> {contractInfo.address}</p>
              <p><strong>Type:</strong> Unverified Smart Contract</p>
              <p className="warning">Contract source code not verified on Etherscan</p>
            </div>
          </div>
        )

      case 'multisend':
        return (
          <div className="info-item full-width">
            <label>MultiSend Transaction Contracts:</label>
            <div className="multisend-contracts">
              {contractInfo.contracts.map((contract, index) => (
                <div key={index} className="contract-info">
                  <h4>Contract {index + 1}</h4>
                  <p><strong>Address:</strong> {contract.address}</p>
                  {contract.type === 'contract' && (
                    <>
                      <p><strong>Name:</strong> {contract.name}</p>
                      <p><strong>Type:</strong> Verified Smart Contract {contract.proxy && '(Proxy)'}</p>
                      {contract.implementation && (
                        <p><strong>Implementation:</strong> {contract.implementation}</p>
                      )}
                      <div className="contract-abi">
                        <strong>ABI:</strong>
                        <pre>{JSON.stringify(contract.abi, null, 2)}</pre>
                      </div>
                    </>
                  )}
                  {contract.type === 'unverified_contract' && (
                    <>
                      <p><strong>Type:</strong> Unverified Smart Contract</p>
                      <p className="warning">Contract source code not verified on Etherscan</p>
                    </>
                  )}
                  {contract.type === 'eoa' && (
                    <p><strong>Type:</strong> EOA</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )

      case 'error':
        return (
          <div className="info-item full-width">
            <label>Contract Information Error:</label>
            <span className="error">{contractInfo.message}</span>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Transaction Details</h2>
        <div className="info-grid">
          <div className="info-item">
            <label>To:</label>
            <span>{transaction.to}</span>
          </div>
          <div className="info-item">
            <label>Value:</label>
            <span>{ethValue} ETH ({transaction.value} Wei)</span>
          </div>
          <div className="info-item">
            <label>Nonce:</label>
            <span>{transaction.nonce}</span>
          </div>
          <div className="info-item">
            <label>Safe TX Hash:</label>
            <span>{transaction.safeTxHash}</span>
          </div>
          <div className="info-item">
            <label>Submission Date:</label>
            <span>{new Date(transaction.submissionDate).toLocaleString()}</span>
          </div>
          <div className="info-item full-width">
            <label>Simulation Results:</label>
            <div className="simulation-container">
              {simulationLoading && (
                <div className="simulation-loading">Running simulation...</div>
              )}
              {simulationError && (
                <div className="simulation-error">
                  Error: {simulationError}
                  <button onClick={fetchSimulation} className="retry-btn">
                    Retry Simulation
                  </button>
                </div>
              )}
              {simulationResult && (
                <div className="simulation-result">
                  <pre>{JSON.stringify(simulationResult, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
          {transaction.dataDecoded && (
            <div className="info-item full-width">
              <label>Operation:</label>
              <span>
                {transaction.dataDecoded.method}
                ({transaction.dataDecoded.parameters
                  ? JSON.stringify(transaction.dataDecoded.parameters, null, 2)
                  : 'No parameters'})
              </span>
            </div>
          )}
          <div className="info-item full-width">
            <label>Raw Transaction Data:</label>
            <div className="raw-data-container">
              <pre>{JSON.stringify(rawData, null, 2)}</pre>
            </div>
          </div>
          {renderContractInfo()}
        </div>
      </div>
    </div>
  )
}

export default TransactionModal 