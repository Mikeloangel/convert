import { useEffect, useState } from 'react'
import {
  Container,
  Button,
  TextField,
  Select,
  MenuItem,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Box,
  Grid,
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import axios from 'axios'

// ---------------------- CONFIG ----------------------

const API_KEY = import.meta.env.VITE_EXCHANGE_API_KEY as string

const COMMON_CURRENCIES = ['RUB', 'RSD', 'EUR', 'BYN', 'USD', 'BAM', 'TRY']
const EXTRA_CURRENCIES = ['GBP', 'CHF', 'CNY', 'JPY']

type CurrencyBlock = {
  currency: string
  amount: number
}

// ---------------------- APP ----------------------

export default function App() {
  const [source, setSource] = useState<CurrencyBlock>({ currency: 'RSD', amount: 100 })
  const [target, setTarget] = useState<CurrencyBlock>({ currency: 'RUB', amount: 0 })
  const [result, setResult] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<any[]>([])

  // Load from localStorage
  useEffect(() => {
    const savedSource = localStorage.getItem('source')
    const savedTarget = localStorage.getItem('target')
    const savedHistory = localStorage.getItem('history')

    if (savedSource) setSource(JSON.parse(savedSource))
    if (savedTarget) setTarget(JSON.parse(savedTarget))
    if (savedHistory) setHistory(JSON.parse(savedHistory))
  }, [])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('source', JSON.stringify(source))
    localStorage.setItem('target', JSON.stringify(target))
  }, [source, target])

  const handleFastSelect = (isSource: boolean, currency: string) => {
    isSource ? setSource({ ...source, currency }) : setTarget({ ...target, currency })
  }

  const handleConvert = async () => {
    if (!API_KEY) {
      alert('Missing API key')
      return
    }

    setLoading(true)
    try {
      const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/pair/${source.currency}/${target.currency}/${source.amount}`
      const { data } = await axios.get(url)

      if (data.result === 'success') {
        setResult(data.conversion_result)
        setTarget((prev) => ({ ...prev, amount: data.conversion_result }))

        const newEntry = {
          date: new Date().toISOString(),
          fromCurrency: source.currency,
          fromAmount: source.amount,
          toCurrency: target.currency,
          toAmount: data.conversion_result,
        }

        const updatedHistory = [newEntry, ...history].slice(0, 10)
        setHistory(updatedHistory)
        localStorage.setItem('history', JSON.stringify(updatedHistory))
      } else {
        alert('Failed to fetch conversion')
      }
    } catch (err) {
      alert('Error fetching exchange data')
    } finally {
      setLoading(false)
    }
  }

  const switchCurrencies = () => {
    setSource(target)
    setTarget(source)
    setResult(null)
  }

  const renderCurrencySection = (
    label: string,
    data: CurrencyBlock,
    isSource: boolean,
    setData: (val: CurrencyBlock) => void
  ) => (
    <Card>
      <CardContent>
        <Typography variant="h6">{label}</Typography>
        <Box sx={{ mt: 1, mb: 1 }}>
          {COMMON_CURRENCIES.map((cur) => (
            <Button
              key={cur}
              variant={data.currency === cur ? 'contained' : 'outlined'}
              onClick={() => handleFastSelect(isSource, cur)}
              size="small"
              sx={{ mr: 1, mb: 1 }}
            >
              {cur}
            </Button>
          ))}
        </Box>
        <Select
          fullWidth
          value={data.currency}
          onChange={(e) => setData({ ...data, currency: e.target.value })}
          sx={{ mb: 2 }}
        >
          {[...COMMON_CURRENCIES, ...EXTRA_CURRENCIES].map((cur) => (
            <MenuItem key={cur} value={cur}>
              {cur}
            </MenuItem>
          ))}
        </Select>
        <TextField
          fullWidth
          type="number"
          label="Amount"
          value={data.amount}
          onChange={(e) => setData({ ...data, amount: parseFloat(e.target.value) || 0 })}
        />
        <Box mt={2}>
          <Typography variant="body2">Selected currency: {data.currency}</Typography>
        </Box>
      </CardContent>
    </Card>
  )

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Currency Converter
      </Typography>

      <Grid container spacing={1}>
        <Grid>
          {renderCurrencySection('Base Currency', source, true, setSource)}
        </Grid>

        <Grid sx={{ textAlign: 'center' }}>
          <Button
            onClick={switchCurrencies}
            variant="outlined"
            startIcon={<SwapHorizIcon />}
            sx={{ mt: 8 }}
          >
            Switch
          </Button>
        </Grid>

        <Grid>
          {renderCurrencySection('Target Currency', target, false, setTarget)}
        </Grid>
      </Grid>

      <Box mt={4} textAlign="center">
        <Button
          variant="contained"
          onClick={handleConvert}
          disabled={loading}
          size="large"
        >
          {loading ? <CircularProgress size={24} /> : 'Convert'}
        </Button>
      </Box>

      {result !== null && (
        <Box mt={4} textAlign="center">
          <Typography variant="h5">
            {source.amount} {source.currency} = {result} {target.currency}
          </Typography>
        </Box>
      )}

      {history.length > 0 && (
        <Box mt={5}>
          <Typography variant="h6" gutterBottom>
            Previous Conversions
          </Typography>
          {history.map((entry, idx) => (
            <Card key={idx} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {new Date(entry.date).toLocaleString()}
                </Typography>
                <Typography>
                  {entry.fromAmount} {entry.fromCurrency} → {entry.toAmount}{' '}
                  {entry.toCurrency}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Container>
  )
}
