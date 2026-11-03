/// <reference lib="webworker" />

import { calculateNatalChart, type ChartInput } from './natalChart'

type ChartRequest = { input: ChartInput }
type ChartReply = { chart?: ReturnType<typeof calculateNatalChart>; error?: string }

self.addEventListener('message', (event: MessageEvent<ChartRequest>) => {
  try {
    const reply: ChartReply = { chart: calculateNatalChart(event.data.input) }
    self.postMessage(reply)
  } catch (error) {
    const reply: ChartReply = {
      error: error instanceof Error ? error.message : 'No se pudo calcular la carta natal.',
    }
    self.postMessage(reply)
  }
})
