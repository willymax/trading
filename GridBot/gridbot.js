const url = 'wss://stream.data.alpaca.markets/v1beta1/crypto'
const socket = new WebSocket(url)
const API_KEY = ''
const SECRET_KEY = ''
const auth = {
  action: 'auth',
  key: API_KEY,
  secret: SECRET_KEY,
}
const subscribe = {
  action: 'subscribe',
  trades: ['ETHUSD'],
  quotes: ['ETHUSD'],
  bars: ['ETHUSD'],
}

const quotesElement = document.getElementById('quotes')
const tradesElement = document.getElementById('trades')

var currentBar = {}
var trades = []
var chart = LightweightCharts.createChart(document.getElementById('chart'), {
  width: 700,
  height: 300,
  crosshair: {
    mode: LightweightCharts.CrosshairMode.Normal,
  },
  timeScale: {
    borderColor: '#cccccc',
    timeVisible: true,
  },
  priceScale: {
    borderColor: '#cccccc',
  },
  crosshair: {
    mode: LightweightCharts.CrosshairMode.Normal,
  },
  grid: {
    vertLines: {
      color: '#404040',
    },
    horzLines: {
      color: '#404040',
    },
  },
})

var candleSeries = chart.addCandlestickSeries()
var start = new Date(Date.now() - 7200 * 1000).toISOString()
var baseUrl =
  'https://data.alpaca.markets/v1beta1/crypto/ETHUSD/bars?exchanges=CBSE&timeframe=1Min&start=' +
  start
fetch(baseUrl, {
  headers: {
    'APCA-API-KEY-ID': API_KEY,
    'APCA-API-SECRET-KEY': SECRET_KEY,
  },
})
  .then((r) => r.json())
  .then((res) => {
    const data = res.bars.map((bar) => {
      return {
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
        time: Date.parse(bar.t) / 1000,
      }
    })
    candleSeries.setData(data)
    currentBar = data[data.length - 1]
  })

socket.onmessage = function (event) {
  const data = JSON.parse(event.data)

  const message = data[0]['msg']
  if (message == 'connected') {
    socket.send(JSON.stringify(auth))
  }
  if (message == 'authenticated') {
    socket.send(JSON.stringify(subscribe))
  }

  for (const key in data) {
    const type = data[key].T
    if (type == 'q') {
      const quoteElement = document.createElement('div')
      quoteElement.className = 'quotes'
      quoteElement.innerHTML = `<b>${data[key].t}</b> ${data[key].bp} ${data[key].ap}`
      quotesElement.appendChild(quoteElement)
      //   console.log(data[key])
      var elements = document.getElementsByClassName('quotes')
      if (elements.length > 10) {
        quotesElement.removeChild(elements[0])
      }
    }
    if (type == 't') {
      //   console.log('got a trade')
      const tradeElement = document.createElement('div')
      tradeElement.className = 'trade'
      tradeElement.innerHTML = `<b>${data[key].t}</b> ${data[key].p} ${data[key].s}`
      tradesElement.appendChild(tradeElement)
      //   console.log(data[key])
      var elements = document.getElementsByClassName('trade')
      if (elements.length > 10) {
        tradesElement.removeChild(elements[0])
      }
      trades.push(data[key].p)
      var open = trades[0]
      var high = Math.max(...trades)
      var low = Math.min(...trades)
      var close = trades[trades.length - 1]
      candleSeries.update({
        time: currentBar.time + 60,
        open,
        high,
        low,
        close,
      })
    }
    if (type == 'b' && data[key].X == 'CBSE') {
      var bar = data[key]
      var timestamp = new Date(b.t).getTime() / 1000
      currentBar = {
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
        time: timestamp,
      }
      candleSeries.update(currentBar)
      trades = []
    }
  }
}
