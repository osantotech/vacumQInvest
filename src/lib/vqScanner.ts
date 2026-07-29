// src/lib/vqScanner.ts

export type Kline = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type VQPhase = 'IDLE' | 'PST_FLIP' | 'PB_START' | 'PBv' | 'PPB_EC';
export type VQDirection = 'LONG' | 'SHORT' | 'NONE';

export type VQState = {
  fase: VQPhase;
  direcao: VQDirection;
  brkPrice: number;
  pbStartPrice: number;
  volumesDurantePB: number[];
  swingHigh: number;
  swingLow: number;
};

export type VQSignal = {
  ativo: string;
  timeframe: string;
  fase: VQPhase;
  direcao: VQDirection;
  brk_price: number;
  close_atual: number;
  sma8: number;
  sma21: number;
  sma200: number;
  fib_382: number;
  fib_618: number;
  score_pbv: number;
  fatores: {
    vol_5x: boolean;
    vol_caindo: boolean;
    zona_fibo: boolean;
    toque_sma: boolean;
    candle_forte: boolean;
  };
};

// Helper para calcular SMA
export function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    result.push(sum / period);
  }
  return result;
}

// Analisador principal do VQ Pullback
export function analyzeVQPullback(klines: Kline[], symbol: string, timeframe: string): VQSignal | null {
  if (klines.length < 200) return null;

  const closes = klines.map(k => k.close);
  const sma8 = calculateSMA(closes, 8);
  const sma21 = calculateSMA(closes, 21);
  const sma200 = calculateSMA(closes, 200);

  let state: VQState = {
    fase: 'IDLE',
    direcao: 'NONE',
    brkPrice: 0,
    pbStartPrice: 0,
    volumesDurantePB: [],
    swingHigh: 0,
    swingLow: 0
  };

  let lastSignal: VQSignal | null = null;

  for (let i = 200; i < klines.length; i++) {
    const candle = klines[i];
    const s8 = sma8[i];
    const s21 = sma21[i];
    const prevS8 = sma8[i - 1];
    const prevS21 = sma21[i - 1];

    // Fase 1: PST Flip (Rompimento das SMAs)
    // Long: SMA8 cruza acima da SMA21
    const goldenCross = prevS8 <= prevS21 && s8 > s21;
    // Short: SMA8 cruza abaixo da SMA21
    const deathCross = prevS8 >= prevS21 && s8 < s21;

    if (goldenCross) {
      state = {
        fase: 'PST_FLIP',
        direcao: 'LONG',
        brkPrice: candle.close,
        pbStartPrice: 0,
        volumesDurantePB: [],
        swingHigh: candle.high,
        swingLow: candle.low
      };
      continue;
    } else if (deathCross) {
      state = {
        fase: 'PST_FLIP',
        direcao: 'SHORT',
        brkPrice: candle.close,
        pbStartPrice: 0,
        volumesDurantePB: [],
        swingHigh: candle.high,
        swingLow: candle.low
      };
      continue;
    }

    if (state.fase === 'IDLE') continue;

    // Atualiza Swing High/Low enquanto está no rompimento (antes do pullback)
    if (state.fase === 'PST_FLIP') {
      if (state.direcao === 'LONG' && candle.high > state.swingHigh) state.swingHigh = candle.high;
      if (state.direcao === 'SHORT' && candle.low < state.swingLow) state.swingLow = candle.low;
    }

    // Fase 2: Início do Pullback
    if (state.fase === 'PST_FLIP') {
      const isPullbackStart = (state.direcao === 'LONG' && candle.close < state.brkPrice) ||
                              (state.direcao === 'SHORT' && candle.close > state.brkPrice);
      
      if (isPullbackStart) {
        state.fase = 'PB_START';
        state.pbStartPrice = state.direcao === 'LONG' ? state.swingHigh : state.swingLow;
        state.volumesDurantePB = [candle.volume];
      }
      continue;
    }

    // Acumula volume se estiver em PB
    if (state.fase === 'PB_START' || state.fase === 'PBv') {
      state.volumesDurantePB.push(candle.volume);
    }

    // Fase 3: PBv (Placar de 5 fatores)
    if (state.fase === 'PB_START' || state.fase === 'PBv') {
      // Calcula média de volume dos últimos 20 candles (geral) para comparar
      const last20Vols = klines.slice(i - 20, i).map(k => k.volume);
      const avgVol20 = last20Vols.reduce((a, b) => a + b, 0) / 20;
      const avgVolPB = state.volumesDurantePB.reduce((a, b) => a + b, 0) / state.volumesDurantePB.length;

      // Fator 1: Volume 5x (algum candle do PB teve 5x a média de 20?)
      const vol5x = Math.max(...state.volumesDurantePB) >= avgVol20 * 5;

      // Fator 2: Volume caindo (exaustão - volume atual < média do pullback)
      const volCaindo = candle.volume < avgVolPB;

      // Fator 3: Zona Fib 0.382-0.618
      const fib382 = state.direcao === 'LONG' ? state.swingHigh - (state.swingHigh - state.swingLow) * 0.382 : state.swingLow + (state.swingHigh - state.swingLow) * 0.382;
      const fib618 = state.direcao === 'LONG' ? state.swingHigh - (state.swingHigh - state.swingLow) * 0.618 : state.swingLow + (state.swingHigh - state.swingLow) * 0.618;
      
      let zonaFibo = false;
      if (state.direcao === 'LONG') {
        zonaFibo = candle.low <= fib382 && candle.high >= fib618;
      } else {
        zonaFibo = candle.high >= fib382 && candle.low <= fib618;
      }

      // Fator 4: Toque na SMA8 e fechamento do lado certo
      const toqueSma = state.direcao === 'LONG' 
        ? (candle.low <= s8 && candle.close > s8) 
        : (candle.high >= s8 && candle.close < s8);

      // Fator 5: Candle forte de retomada (corpo > 50% do range e fechamento favorável)
      const range = candle.high - candle.low;
      const body = Math.abs(candle.close - candle.open);
      const isStrongBody = range > 0 && (body / range) > 0.5;
      const isFavoring = state.direcao === 'LONG' ? candle.close > candle.open : candle.close < candle.open;
      const candleForte = isStrongBody && isFavoring;

      const score = [vol5x, volCaindo, zonaFibo, toqueSma, candleForte].filter(Boolean).length;

      // Atualiza o estado se PBv formou um bom score (>= 3)
      if (score >= 3) {
        state.fase = 'PBv';
        
        lastSignal = {
          ativo: symbol,
          timeframe: timeframe,
          fase: state.fase,
          direcao: state.direcao,
          brk_price: state.brkPrice,
          close_atual: candle.close,
          sma8: s8,
          sma21: s21,
          sma200: sma200[i],
          fib_382: fib382,
          fib_618: fib618,
          score_pbv: score,
          fatores: { vol_5x: vol5x, vol_caindo: volCaindo, zona_fibo: zonaFibo, toque_sma: toqueSma, candle_forte: candleForte }
        };
      }

      // Fase 4: PPB-ec (Confirmação de retomada rompendo o pbStartPrice)
      if (state.fase === 'PBv') {
        const isPPB = (state.direcao === 'LONG' && candle.close > state.pbStartPrice) ||
                      (state.direcao === 'SHORT' && candle.close < state.pbStartPrice);
        
        if (isPPB) {
          state.fase = 'PPB_EC';
          
          lastSignal = {
            ...lastSignal!,
            fase: 'PPB_EC',
            close_atual: candle.close
          };
          
          // Reseta para buscar próximo ciclo (ou pode manter IDLE até novo cruzamento)
          state = { fase: 'IDLE', direcao: 'NONE', brkPrice: 0, pbStartPrice: 0, volumesDurantePB: [], swingHigh: 0, swingLow: 0 };
        }
      }
    }
  }

  return lastSignal; // Retorna apenas se o último candle fechado for relevante
}
