export type RegionName = 'national' | 'north' | 'south' | 'east' | 'west' | 'central';

export interface RegionMetadata {
  name: RegionName;
  label_location: {
    latitude: number;
    longitude: number;
  };
}

export interface ReadingValue {
  central: number;
  east: number;
  north: number;
  south: number;
  west: number;
  national?: number;
}

export interface PsiReadings {
  pm10_twenty_four_hourly: ReadingValue;
  pm10_sub_index: ReadingValue;
  pm25_twenty_four_hourly: ReadingValue;
  pm25_sub_index: ReadingValue;
  pm25_one_hourly?: ReadingValue;
  psi_twenty_four_hourly: ReadingValue;
  so2_twenty_four_hourly: ReadingValue;
  so2_sub_index: ReadingValue;
  o3_eight_hour_max: ReadingValue;
  o3_sub_index: ReadingValue;
  no2_one_hour_max: ReadingValue;
  co_eight_hour_max: ReadingValue;
  co_sub_index: ReadingValue;
}

export interface PsiApiResponseItem {
  timestamp: string;
  update_timestamp: string;
  readings: PsiReadings;
}

export interface PsiApiResponse {
  region_metadata: RegionMetadata[];
  items: PsiApiResponseItem[];
  api_info: {
    status: string;
  };
}

export interface Pm25ApiResponse {
  region_metadata: RegionMetadata[];
  items: Array<{
    timestamp: string;
    update_timestamp: string;
    readings: {
      pm25_one_hourly: ReadingValue;
    };
  }>;
  api_info: {
    status: string;
  };
}

export type AirQualityBand = 'Good' | 'Moderate' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';

export interface AirQualityInfo {
  band: AirQualityBand;
  label: string;
  rangeText: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  lightBg: string;
  description: string;
  actionGuidance: string;
}

export interface RegionDataSnapshot {
  region: RegionName;
  displayName: string;
  subLocation: string;
  coords: { lat: number; lng: number };
  psi24h: number;
  pm25OneHourly: number;
  pm25TwentyFourHourly: number;
  pm10TwentyFourHourly: number;
  o3SubIndex: number;
  no2OneHourMax: number;
  so2TwentyFourHourly: number;
  coEightHourMax: number;
  band: AirQualityBand;
  trend: 'rising' | 'steady' | 'falling';
  previousPsi?: number;
}

export interface HistoricalDataPoint {
  timeLabel: string;
  timestamp: string;
  national: number;
  north: number;
  south: number;
  east: number;
  west: number;
  central: number;
}

export interface AlertNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'alert' | 'danger';
  region?: RegionName;
  psiValue: number;
  isRead: boolean;
}

export interface UserAlertSettings {
  enabled: boolean;
  thresholdPsi: number; // e.g. 100 for unhealthy
  monitoredRegions: RegionName[];
  soundEnabled: boolean;
  notifyOnRecovery: boolean;
  dailyBriefing: boolean;
  serverlessWebhookUrl?: string;
  serverlessSecret?: string;
}
