'use client';

import React, { useEffect, useState } from 'react';

interface DonutChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  size?: number;
  title?: string;
}

export default function DonutChart({ data, size = 200, title }: DonutChartProps) {
  const [animated, setAnimated] = useState(false);
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const total = data.reduce((sum, item) => sum + item.value, 0);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  let currentOffset = 0;

  return (
    <div className="donut-container flex flex-col items-center">
      {title && <h3 className="text-white font-semibold mb-4">{title}</h3>}
      <div className="flex items-center gap-8">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="var(--border)"
              strokeWidth={strokeWidth}
            />
            
            {/* Data circles */}
            {data.map((item, index) => {
              if (item.value === 0) return null;
              
              const percentage = item.value / total;
              const strokeDasharray = `${circumference} ${circumference}`;
              const strokeDashoffset = animated 
                ? circumference - (percentage * circumference)
                : circumference;
                
              const offsetAngle = (currentOffset / total) * 360 - 90;
              currentOffset += item.value;

              return (
                <circle
                  key={index}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(${offsetAngle} ${size / 2} ${size / 2})`}
                  style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">{total}</span>
            <span className="text-xs text-text-secondary">Total</span>
          </div>
        </div>

        <div className="donut-legend flex flex-col gap-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-text-secondary">{item.label}</span>
              <span className="text-sm font-bold text-white ml-auto">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
