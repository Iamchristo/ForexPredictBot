'use client';
import { useEffect, useRef } from 'react';
import type { ChartCandle } from '@/types';

interface TradingChartProps {
  data: ChartCandle[];
  entryPrice?: number;
  stopLoss?: number;
  takeProfit1?: number;
  height?: number;
}

export function TradingChart({ data, entryPrice, stopLoss, takeProfit1, height = 220 }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !data?.length) return;

    let cleanup = () => {};

    import('lightweight-charts').then(({ createChart, ColorType, LineStyle }) => {
      if (!containerRef.current) return;

      const chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height,
        layout: {
          background: { type: ColorType.Solid, color: '#12121A' },
          textColor: '#94A3B8',
        },
        grid: {
          vertLines: { color: '#1A1A2E' },
          horzLines: { color: '#1A1A2E' },
        },
        crosshair: { mode: 1 },
        rightPriceScale: { borderColor: '#2A2A3D', scaleMargins: { top: 0.1, bottom: 0.1 } },
        timeScale: { borderColor: '#2A2A3D', timeVisible: true, secondsVisible: false },
      });
      chartRef.current = chart;

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#10B981',
        downColor: '#EF4444',
        borderUpColor: '#10B981',
        borderDownColor: '#EF4444',
        wickUpColor: '#10B981',
        wickDownColor: '#EF4444',
      });

      const formattedData = data
        .filter(d => d.open && d.high && d.low && d.close)
        .map(d => ({ time: d.time as any, open: d.open, high: d.high, low: d.low, close: d.close }));

      if (formattedData.length > 0) {
        candlestickSeries.setData(formattedData);
      }

      // Price lines
      if (entryPrice) {
        candlestickSeries.createPriceLine({ price: entryPrice, color: '#F59E0B', lineWidth: 1, lineStyle: LineStyle.Dashed, title: 'Entry' });
      }
      if (stopLoss) {
        candlestickSeries.createPriceLine({ price: stopLoss, color: '#EF4444', lineWidth: 1, lineStyle: LineStyle.Dashed, title: 'SL' });
      }
      if (takeProfit1) {
        candlestickSeries.createPriceLine({ price: takeProfit1, color: '#10B981', lineWidth: 1, lineStyle: LineStyle.Dashed, title: 'TP1' });
      }

      chart.timeScale().fitContent();

      const handleResize = () => {
        if (containerRef.current) {
          chart.applyOptions({ width: containerRef.current.clientWidth });
        }
      };
      window.addEventListener('resize', handleResize);
      cleanup = () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    });

    return () => cleanup();
  }, [data, entryPrice, stopLoss, takeProfit1, height]);

  return (
    <div className="w-full rounded-xl overflow-hidden border border-border">
      <div ref={containerRef} style={{ height }} />
    </div>
  );
}
