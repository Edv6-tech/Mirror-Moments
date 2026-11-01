export interface HistoricalScan {
  id: string;
  date: string;
  label: string;
  skinAge: number;
  scores: {
    moisture: number;
    redness: number;
    pore: number;
    wrinkle: number;
    dark_circle: number;
    acne: number;
  };
  isSeededDemo?: boolean;
}

export function getSeededDemoScans(): HistoricalScan[] {
  return [
    {
      id: 'scan_week_1',
      date: '2026-10-07',
      label: 'Week 1 (Baseline)',
      skinAge: 27,
      scores: {
        moisture: 58,
        redness: 82,
        pore: 70,
        wrinkle: 85,
        dark_circle: 60,
        acne: 92,
      },
      isSeededDemo: true,
    },
    {
      id: 'scan_week_2',
      date: '2026-10-14',
      label: 'Week 2 (Hydration Focus)',
      skinAge: 26,
      scores: {
        moisture: 65,
        redness: 86,
        pore: 72,
        wrinkle: 86,
        dark_circle: 63,
        acne: 94,
      },
      isSeededDemo: true,
    },
    {
      id: 'scan_week_3',
      date: '2026-10-21',
      label: 'Week 3 (Barrier Recovery)',
      skinAge: 26,
      scores: {
        moisture: 72,
        redness: 90,
        pore: 75,
        wrinkle: 87,
        dark_circle: 65,
        acne: 96,
      },
      isSeededDemo: true,
    },
    {
      id: 'scan_week_4',
      date: '2026-10-28',
      label: 'Week 4 (Today)',
      skinAge: 25,
      scores: {
        moisture: 78,
        redness: 94,
        pore: 78,
        wrinkle: 88,
        dark_circle: 68,
        acne: 98,
      },
      isSeededDemo: true,
    },
  ];
}

export function calculateTrend(scans: HistoricalScan[], metric: keyof HistoricalScan['scores']) {
  if (scans.length < 2) return { delta: 0, trend: 'insufficient_data' };
  const first = scans[0].scores[metric] || 0;
  const last = scans[scans.length - 1].scores[metric] || 0;
  const delta = last - first;
  return {
    delta,
    trend: delta > 2 ? 'improving' : delta < -2 ? 'declining' : 'stable',
  };
}
