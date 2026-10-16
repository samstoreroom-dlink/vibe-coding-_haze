import {
  AirQualityBand,
  AirQualityInfo,
  HistoricalDataPoint,
  Pm25ApiResponse,
  PsiApiResponse,
  RegionDataSnapshot,
  RegionName,
} from '../types/psi';

export const REGION_DETAILS: Record<
  RegionName,
  { displayName: string; subLocation: string; coords: { lat: number; lng: number } }
> = {
  national: {
    displayName: 'Islandwide (National)',
    subLocation: 'All Singapore Sectors Average',
    coords: { lat: 1.3521, lng: 103.8198 },
  },
  central: {
    displayName: 'Central Region',
    subLocation: 'Bishan, Ang Mo Kio, Toa Payoh, Novena',
    coords: { lat: 1.35735, lng: 103.82 },
  },
  east: {
    displayName: 'East Region',
    subLocation: 'Tampines, Changi, Bedok, Pasir Ris',
    coords: { lat: 1.35735, lng: 103.94 },
  },
  west: {
    displayName: 'West Region',
    subLocation: 'Jurong, Tuas, Clementi, Bukit Batok',
    coords: { lat: 1.35735, lng: 103.7 },
  },
  north: {
    displayName: 'North Region',
    subLocation: 'Woodlands, Yishun, Sembawang, Mandai',
    coords: { lat: 1.41803, lng: 103.82 },
  },
  south: {
    displayName: 'South Region',
    subLocation: 'Marina Bay, Sentosa, Tanjong Pagar, Telok Blangah',
    coords: { lat: 1.29587, lng: 103.82 },
  },
};

export const AIR_QUALITY_BANDS: Record<AirQualityBand, AirQualityInfo> = {
  Good: {
    band: 'Good',
    label: 'Good',
    rangeText: '0 - 50',
    color: '#10b981',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-400',
    lightBg: 'rgba(16, 185, 129, 0.15)',
    description: 'Air quality is considered satisfactory, and air pollution poses little or no risk.',
    actionGuidance: 'Normal outdoor activities for everyone.',
  },
  Moderate: {
    band: 'Moderate',
    label: 'Moderate',
    rangeText: '51 - 100',
    color: '#0ea5e9',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    textColor: 'text-sky-400',
    lightBg: 'rgba(14, 165, 233, 0.15)',
    description: 'Air quality is acceptable. A small number of individuals unusually sensitive to pollution may experience slight irritation.',
    actionGuidance: 'Normal outdoor activities for most people. Sensitive persons monitor symptoms.',
  },
  Unhealthy: {
    band: 'Unhealthy',
    label: 'Unhealthy',
    rangeText: '101 - 200',
    color: '#f59e0b',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/40',
    textColor: 'text-amber-400',
    lightBg: 'rgba(245, 158, 11, 0.18)',
    description: 'Everyone may begin to experience health effects. Vulnerable groups may experience more serious effects.',
    actionGuidance: 'Reduce prolonged or strenuous outdoor exertion. Vulnerable individuals avoid strenuous activity. N95 mask advised if outdoor.',
  },
  'Very Unhealthy': {
    band: 'Very Unhealthy',
    label: 'Very Unhealthy',
    rangeText: '201 - 300',
    color: '#ef4444',
    bgColor: 'bg-red-500/15',
    borderColor: 'border-red-500/40',
    textColor: 'text-red-400',
    lightBg: 'rgba(239, 68, 68, 0.2)',
    description: 'Health alert: The risk of health effects is increased for everyone in the population.',
    actionGuidance: 'Avoid prolonged or strenuous outdoor exertion. Wear N95 mask outdoors. Close windows & run air purifiers indoors.',
  },
  Hazardous: {
    band: 'Hazardous',
    label: 'Hazardous',
    rangeText: '301+',
    color: '#8b5cf6',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/50',
    textColor: 'text-purple-400',
    lightBg: 'rgba(139, 92, 246, 0.25)',
    description: 'Emergency health warning: Entire population is likely to be affected with adverse symptoms.',
    actionGuidance: 'Minimize all outdoor exposure. Stay indoors with HEPA air filtration. Vulnerable persons remain indoors.',
  },
};

export function getAirQualityBand(psi: number): AirQualityBand {
  if (psi <= 50) return 'Good';
  if (psi <= 100) return 'Moderate';
  if (psi <= 200) return 'Unhealthy';
  if (psi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

export function getPm25Band(pm25: number): { label: string; band: string; color: string } {
  if (pm25 <= 55) return { label: 'Normal', band: 'Band I', color: '#10b981' };
  if (pm25 <= 150) return { label: 'Elevated', band: 'Band II', color: '#0ea5e9' };
  if (pm25 <= 250) return { label: 'High', band: 'Band III', color: '#f59e0b' };
  return { label: 'Very High', band: 'Band IV', color: '#ef4444' };
}

// Fallback snapshot data for Singapore in case network is down
const FALLBACK_SNAPSHOTS: Record<RegionName, RegionDataSnapshot> = {
  national: {
    region: 'national',
    displayName: 'Islandwide (National)',
    subLocation: 'All Singapore Sectors Average',
    coords: { lat: 1.3521, lng: 103.8198 },
    psi24h: 192,
    pm25OneHourly: 145,
    pm25TwentyFourHourly: 143,
    pm10TwentyFourHourly: 178,
    o3SubIndex: 7,
    no2OneHourMax: 34,
    so2TwentyFourHourly: 5,
    coEightHourMax: 2,
    band: 'Unhealthy',
    trend: 'rising',
  },
  central: {
    region: 'central',
    displayName: 'Central Region',
    subLocation: 'Bishan, Ang Mo Kio, Toa Payoh, Novena',
    coords: { lat: 1.35735, lng: 103.82 },
    psi24h: 225,
    pm25OneHourly: 168,
    pm25TwentyFourHourly: 175,
    pm10TwentyFourHourly: 211,
    o3SubIndex: 7,
    no2OneHourMax: 37,
    so2TwentyFourHourly: 7,
    coEightHourMax: 2,
    band: 'Very Unhealthy',
    trend: 'rising',
  },
  east: {
    region: 'east',
    displayName: 'East Region',
    subLocation: 'Tampines, Changi, Bedok, Pasir Ris',
    coords: { lat: 1.35735, lng: 103.94 },
    psi24h: 203,
    pm25OneHourly: 147,
    pm25TwentyFourHourly: 153,
    pm10TwentyFourHourly: 196,
    o3SubIndex: 7,
    no2OneHourMax: 33,
    so2TwentyFourHourly: 4,
    coEightHourMax: 2,
    band: 'Very Unhealthy',
    trend: 'rising',
  },
  west: {
    region: 'west',
    displayName: 'West Region',
    subLocation: 'Jurong, Tuas, Clementi, Bukit Batok',
    coords: { lat: 1.35735, lng: 103.7 },
    psi24h: 201,
    pm25OneHourly: 158,
    pm25TwentyFourHourly: 151,
    pm10TwentyFourHourly: 183,
    o3SubIndex: 4,
    no2OneHourMax: 39,
    so2TwentyFourHourly: 7,
    coEightHourMax: 2,
    band: 'Very Unhealthy',
    trend: 'steady',
  },
  north: {
    region: 'north',
    displayName: 'North Region',
    subLocation: 'Woodlands, Yishun, Sembawang, Mandai',
    coords: { lat: 1.41803, lng: 103.82 },
    psi24h: 151,
    pm25OneHourly: 117,
    pm25TwentyFourHourly: 104,
    pm10TwentyFourHourly: 133,
    o3SubIndex: 12,
    no2OneHourMax: 19,
    so2TwentyFourHourly: 7,
    coEightHourMax: 2,
    band: 'Unhealthy',
    trend: 'falling',
  },
  south: {
    region: 'south',
    displayName: 'South Region',
    subLocation: 'Marina Bay, Sentosa, Tanjong Pagar, Telok Blangah',
    coords: { lat: 1.29587, lng: 103.82 },
    psi24h: 182,
    pm25OneHourly: 133,
    pm25TwentyFourHourly: 133,
    pm10TwentyFourHourly: 167,
    o3SubIndex: 4,
    no2OneHourMax: 40,
    so2TwentyFourHourly: 5,
    coEightHourMax: 2,
    band: 'Unhealthy',
    trend: 'rising',
  },
};

export interface FetchResult {
  snapshots: Record<RegionName, RegionDataSnapshot>;
  updateTimestamp: string;
  source: 'live_nea' | 'fallback_cache';
  maxPsi: number;
  highestRegion: RegionName;
  unhealthyCount: number;
}

export async function fetchLiveSingaporePsi(): Promise<FetchResult> {
  try {
    const [psiRes, pm25Res] = await Promise.all([
      fetch('https://api.data.gov.sg/v1/environment/psi', { cache: 'no-store' }),
      fetch('https://api.data.gov.sg/v1/environment/pm25', { cache: 'no-store' }).catch(() => null),
    ]);

    if (!psiRes.ok) {
      throw new Error(`PSI API responded with ${psiRes.status}`);
    }

    const psiData: PsiApiResponse = await psiRes.json();
    const pm25Data: Pm25ApiResponse | null = pm25Res && pm25Res.ok ? await pm25Res.json() : null;

    if (!psiData.items || psiData.items.length === 0) {
      throw new Error('No items in PSI API payload');
    }

    const item = psiData.items[0];
    const readings = item.readings;
    const pm25HourlyReadings = pm25Data?.items?.[0]?.readings?.pm25_one_hourly;

    const regions: RegionName[] = ['north', 'south', 'east', 'west', 'central'];
    const snapshots: Partial<Record<RegionName, RegionDataSnapshot>> = {};

    let totalPsi = 0;
    let totalPm25_1h = 0;
    let totalPm25_24h = 0;
    let totalPm10 = 0;
    let totalO3 = 0;
    let totalNo2 = 0;
    let totalSo2 = 0;
    let totalCo = 0;

    let maxPsi = 0;
    let highestRegion: RegionName = 'central';
    let unhealthyCount = 0;

    for (const r of regions) {
      const psi24 = readings.psi_twenty_four_hourly?.[r] ?? readings.pm25_sub_index?.[r] ?? 100;
      const pm25_1h = pm25HourlyReadings?.[r] ?? readings.pm25_twenty_four_hourly?.[r] ?? 80;
      const pm25_24h = readings.pm25_twenty_four_hourly?.[r] ?? 80;
      const pm10_24h = readings.pm10_twenty_four_hourly?.[r] ?? 90;
      const o3 = readings.o3_sub_index?.[r] ?? 10;
      const no2 = readings.no2_one_hour_max?.[r] ?? 25;
      const so2 = readings.so2_twenty_four_hourly?.[r] ?? 5;
      const co = readings.co_eight_hour_max?.[r] ?? 1;

      totalPsi += psi24;
      totalPm25_1h += pm25_1h;
      totalPm25_24h += pm25_24h;
      totalPm10 += pm10_24h;
      totalO3 += o3;
      totalNo2 += no2;
      totalSo2 += so2;
      totalCo += co;

      if (psi24 > maxPsi) {
        maxPsi = psi24;
        highestRegion = r;
      }

      if (psi24 > 100) {
        unhealthyCount++;
      }

      const band = getAirQualityBand(psi24);

      snapshots[r] = {
        region: r,
        displayName: REGION_DETAILS[r].displayName,
        subLocation: REGION_DETAILS[r].subLocation,
        coords: REGION_DETAILS[r].coords,
        psi24h: psi24,
        pm25OneHourly: pm25_1h,
        pm25TwentyFourHourly: pm25_24h,
        pm10TwentyFourHourly: pm10_24h,
        o3SubIndex: o3,
        no2OneHourMax: no2,
        so2TwentyFourHourly: so2,
        coEightHourMax: co,
        band,
        trend: psi24 > 120 ? 'rising' : psi24 > 60 ? 'steady' : 'falling',
      };
    }

    // Islandwide National Average
    const avgPsi = Math.round(readings.psi_twenty_four_hourly?.national ?? (totalPsi / regions.length));
    const avgPm25_1h = Math.round(totalPm25_1h / regions.length);
    const avgPm25_24h = Math.round(readings.pm25_twenty_four_hourly?.national ?? (totalPm25_24h / regions.length));
    const avgPm10 = Math.round(readings.pm10_twenty_four_hourly?.national ?? (totalPm10 / regions.length));

    snapshots['national'] = {
      region: 'national',
      displayName: REGION_DETAILS['national'].displayName,
      subLocation: REGION_DETAILS['national'].subLocation,
      coords: REGION_DETAILS['national'].coords,
      psi24h: avgPsi,
      pm25OneHourly: avgPm25_1h,
      pm25TwentyFourHourly: avgPm25_24h,
      pm10TwentyFourHourly: avgPm10,
      o3SubIndex: Math.round(totalO3 / regions.length),
      no2OneHourMax: Math.round(totalNo2 / regions.length),
      so2TwentyFourHourly: Math.round(totalSo2 / regions.length),
      coEightHourMax: Math.round((totalCo / regions.length) * 10) / 10,
      band: getAirQualityBand(avgPsi),
      trend: avgPsi > 100 ? 'rising' : 'steady',
    };

    return {
      snapshots: snapshots as Record<RegionName, RegionDataSnapshot>,
      updateTimestamp: item.update_timestamp || item.timestamp,
      source: 'live_nea',
      maxPsi,
      highestRegion,
      unhealthyCount,
    };
  } catch (err) {
    console.warn('Failed to fetch live NEA PSI API, falling back to cached snapshot:', err);

    return {
      snapshots: FALLBACK_SNAPSHOTS,
      updateTimestamp: new Date().toISOString(),
      source: 'fallback_cache',
      maxPsi: 225,
      highestRegion: 'central',
      unhealthyCount: 5,
    };
  }
}

export async function fetchHistoricalPsi(): Promise<HistoricalDataPoint[]> {
  try {
    // Current date in SGT (Singapore UTC+8)
    const now = new Date();
    // Singapore date format YYYY-MM-DD
    const sgtOffset = 8 * 60; // in minutes
    const localOffset = now.getTimezoneOffset();
    const sgtTime = new Date(now.getTime() + (sgtOffset + localOffset) * 60000);
    const dateStr = sgtTime.toISOString().split('T')[0];

    const res = await fetch(`https://api.data.gov.sg/v1/environment/psi?date=${dateStr}`);
    if (!res.ok) throw new Error('Historical request failed');

    const data: PsiApiResponse = await res.json();
    if (!data.items || data.items.length === 0) {
      return generateFallbackHistory();
    }

    const points: HistoricalDataPoint[] = data.items.map((it) => {
      const d = new Date(it.timestamp);
      const hours = d.getHours().toString().padStart(2, '0');
      const timeLabel = `${hours}:00`;
      const psiObj = it.readings?.psi_twenty_four_hourly || {};

      const north = psiObj.north ?? 100;
      const south = psiObj.south ?? 100;
      const east = psiObj.east ?? 100;
      const west = psiObj.west ?? 100;
      const central = psiObj.central ?? 100;
      const national = psiObj.national ?? Math.round((north + south + east + west + central) / 5);

      return {
        timeLabel,
        timestamp: it.timestamp,
        national,
        north,
        south,
        east,
        west,
        central,
      };
    });

    return points;
  } catch (e) {
    console.warn('Error fetching historical PSI:', e);
    return generateFallbackHistory();
  }
}

function generateFallbackHistory(): HistoricalDataPoint[] {
  const points: HistoricalDataPoint[] = [];
  const hours = [
    '00:00', '02:00', '04:00', '06:00', '08:00', '10:00',
    '12:00', '14:00', '16:00', '18:00', '20:00', '22:00',
  ];

  hours.forEach((timeLabel, idx) => {
    // Simulated gradual rise due to afternoon haze drift
    const base = 90 + Math.sin((idx / 12) * Math.PI) * 110;
    points.push({
      timeLabel,
      timestamp: new Date().toISOString(),
      national: Math.round(base),
      central: Math.round(base * 1.15),
      east: Math.round(base * 1.05),
      west: Math.round(base * 1.03),
      north: Math.round(base * 0.85),
      south: Math.round(base * 0.98),
    });
  });

  return points;
}
