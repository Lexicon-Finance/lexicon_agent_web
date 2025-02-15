import { Box, Typography, Button, Container, Paper, Link, Tabs, Tab, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const InstructionPage = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [safeAddress, setSafeAddress] = useState('');
  const [addressError, setAddressError] = useState('');

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const validateAddress = (address) => {
    // Check if it's a valid Ethereum address
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    return addressRegex.test(address);
  };

  const handleAddressChange = (event) => {
    const address = event.target.value;
    setSafeAddress(address);
    
    if (!address) {
      setAddressError('Safe address is required');
    } else if (!validateAddress(address)) {
      setAddressError('Please enter a valid Ethereum address');
    } else {
      setAddressError('');
    }
  };

  const handleContinue = () => {
    if (validateAddress(safeAddress)) {
      navigate('/transactions', { state: { safeAddress } });
    } else {
      setAddressError('Please enter a valid Safe address before continuing');
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(120deg, #f0f7ff 0%, #e6f0ff 100%)',
      py: 6
    }}>
      <Container maxWidth="md">
        <Button
          variant="outlined"
          onClick={() => navigate('/')}
          sx={{
            mb: 3,
            color: '#1565c0',
            borderColor: '#1565c0',
            '&:hover': {
              borderColor: '#1565c0',
              backgroundColor: 'rgba(21, 101, 192, 0.04)',
            },
          }}
        >
          ← Back to Landing Page
        </Button>

        <Paper 
          elevation={6} 
          sx={{ 
            p: 4,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              textAlign: 'center',
              color: '#1a237e',
              fontWeight: 600,
              mb: 4
            }}
          >
            Welcome to the Security Officer Agent
          </Typography>
          
          <Box sx={{ my: 4 }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                color: '#1565c0',
                fontWeight: 500
              }}
            >
              Initial Setup: Safe Wallet Configuration
            </Typography>
            
            <Typography 
              paragraph 
              sx={{ 
                color: '#424242',
                mb: 3
              }}
            >
              To use the Security Officer Agent, you need a Safe Wallet on sepolia network with the Security Officer as a co-signer.
              Choose one of the following options:
            </Typography>

            <Box sx={{ 
              borderBottom: 1, 
              borderColor: 'divider', 
              mb: 3
            }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                sx={{
                  '& .MuiTab-root': {
                    fontWeight: 500,
                    fontSize: '1rem'
                  }
                }}
              >
                <Tab label="Create New Safe" />
                <Tab label="Use Existing Safe" />
              </Tabs>
            </Box>

            <Box 
              role="tabpanel" 
              hidden={tabValue !== 0}
              sx={{ 
                backgroundColor: '#f8faff',
                borderRadius: 2,
                p: 3,
                mb: 3
              }}
            >
              {tabValue === 0 && (
                <Typography component="div">
                  <ol style={{ paddingLeft: '20px' }}>
                    <li>
                      <Typography paragraph sx={{ color: '#424242' }}>
                        Visit <Link href="https://app.safe.global" target="_blank" rel="noopener" sx={{ fontWeight: 500 }}>Safe Global</Link> to create a new Safe wallet
                      </Typography>
                    </li>
                    <li>
                      <Typography paragraph sx={{ color: '#424242' }}>
                        Select "Create new Safe" and choose the sepolia network
                      </Typography>
                    </li>
                    <li>
                      <Typography paragraph sx={{ color: '#424242' }}>
                        Add your wallet address as the first owner
                      </Typography>
                    </li>
                    <li>
                      <Typography paragraph sx={{ color: '#424242' }}>
                        Add the Security Officer's address as the second owner: <code style={{ backgroundColor: '#e3f2fd', padding: '2px 6px', borderRadius: '4px' }}>0xAe473fD3640423d6Fa3C3558F35f9De2FbFF54E7</code>
                      </Typography>
                    </li>
                    <li>
                      <Typography paragraph sx={{ color: '#424242' }}>
                        Set the threshold to 2 out of 2 owners required for transactions
                      </Typography>
                    </li>
                  </ol>
                </Typography>
              )}
            </Box>

            <Box 
              role="tabpanel" 
              hidden={tabValue !== 1}
              sx={{ 
                backgroundColor: '#f8faff',
                borderRadius: 2,
                p: 3,
                mb: 3
              }}
            >
              {tabValue === 1 && (
                <Typography component="div">
                  <ol style={{ paddingLeft: '20px' }}>
                    <li>
                      <Typography paragraph sx={{ color: '#424242' }}>
                        Open your existing Safe on <Link href="https://app.safe.global" target="_blank" rel="noopener" sx={{ fontWeight: 500 }}>Safe Global</Link>
                      </Typography>
                    </li>
                    <li>
                      <Typography paragraph sx={{ color: '#424242' }}>
                        Go to "Settings" → "Owners"
                      </Typography>
                    </li>
                    <li>
                      <Typography paragraph sx={{ color: '#424242' }}>
                        Click "Add new owner" and enter the Security Officer's address: <code style={{ backgroundColor: '#e3f2fd', padding: '2px 6px', borderRadius: '4px' }}>0xAe473fD3640423d6Fa3C3558F35f9De2FbFF54E7</code>
                      </Typography>
                    </li>
                    <li>
                      <Typography paragraph sx={{ color: '#424242' }}>
                        Change the threshold to require both your signature and the Security Officer's signature (2/2)
                      </Typography>
                    </li>
                    <li>
                      <Typography paragraph sx={{ color: '#424242' }}>
                        Sign and execute the ownership change transaction
                      </Typography>
                    </li>
                  </ol>
                </Typography>
              )}
            </Box>

            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                color: '#1565c0',
                fontWeight: 500,
                mt: 4
              }}
            >
              Using the Security Officer Agent
            </Typography>
            
            <Typography paragraph sx={{ color: '#424242', mb: 3 }}>
              Once your Safe wallet is configured, here's how to use the Security Officer Agent:
            </Typography>

            <Box 
              sx={{ 
                backgroundColor: '#f8faff',
                borderRadius: 2,
                p: 3,
                mb: 3
              }}
            >
              <Typography component="div">
                <ol style={{ paddingLeft: '20px' }}>
                  <li>
                    <Typography paragraph sx={{ color: '#424242' }}>
                      Create a transaction from your Safe wallet
                    </Typography>
                  </li>
                  <li>
                    <Typography paragraph sx={{ color: '#424242' }}>
                      Fetch the transaction details on our interface
                    </Typography>
                  </li>
                  <li>
                    <Typography paragraph sx={{ color: '#424242' }}>
                      Run Risk Detector on the transaction details
                    </Typography>
                  </li>
                  <li>
                    <Typography paragraph sx={{ color: '#424242' }}>
                      Enter your intent for the transaction and run intent matcher
                    </Typography>
                  </li>
                  <li>
                    <Typography paragraph sx={{ color: '#424242' }}>
                      After the checks are done, ask the Security Officer to co-sign the transaction
                    </Typography>
                  </li>
                </ol>
              </Typography>
            </Box>

            <Typography 
              paragraph 
              sx={{ 
                mt: 2, 
                mb: 4,
                color: '#d32f2f',
                backgroundColor: '#fff4f4',
                p: 2,
                borderRadius: 1,
                fontWeight: 500
              }}
            >
              Important: This feature is still in alpha. Only use it for testing purposes.
            </Typography>

            <Box sx={{ mt: 4, mb: 3 }}>
              <TextField
                fullWidth
                label="Enter your Safe Address"
                value={safeAddress}
                onChange={handleAddressChange}
                error={!!addressError}
                helperText={addressError}
                placeholder="0x..."
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#ffffff'
                  }
                }}
              />
            </Box>

            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleContinue}
              size="large"
              disabled={!validateAddress(safeAddress)}
              sx={{
                width: '100%',
                py: 1.5,
                fontWeight: 600,
                fontSize: '1.1rem',
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(21, 101, 192, 0.2)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(21, 101, 192, 0.3)',
                }
              }}
            >
              Continue to Transactions
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default InstructionPage; 