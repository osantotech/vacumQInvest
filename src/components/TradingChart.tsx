'use client';

import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickSeries } from 'lightweight-charts';
import React, { useEffect, useRef, useState } from 'react';

interface TradingChartProps {
  symbol?: string;
  interval?: string;
}

export default function TradingChart({ symbol = 'BTCUSDT', interval = '15m' }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [chart, setChart] = useState<IChartApi | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [candlestickSeries, setCandlestickSeries] = useState<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const newChart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1A1C29' }, // Cor do bg-primary do VacumQInvest
        textColor: '#8A92A6',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 600,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      }
    });

    const newSeries = newChart.addSeries(CandlestickSeries, {
      upColor: '#26a69a', // Verde institucional
      downColor: '#ef5350', // Vermelho institucional
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    setChart(newChart);
    setCandlestickSeries(newSeries);

    const handleResize = () => {
      if (chartContainerRef.current) {
        newChart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      newChart.remove();
    };
  }, []);

  // Fetch initial data da API Pública da Binance Futures
  useEffect(() => {
    if (!candlestickSeries) return;

    let isMounted = true;

    // fapi é a API de futuros da Binance
    fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=1000`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cdata = data.map((d: any) => {
          return {
            time: d[0] / 1000,
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4]),
          };
        });
        candlestickSeries.setData(cdata);
      })
      .catch(err => console.error('Erro ao baixar velas da Binance:', err));

    return () => { isMounted = false; };
  }, [candlestickSeries, symbol, interval]);

  return (
    <div className="w-full relative rounded-lg overflow-hidden border border-glass-border">
      {/* Container do Gráfico */}
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}
