export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER'
export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'ERROR'
export type Severity = 'WARNING' | 'CRITICAL'
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'
export type AlertType = 'FIRE' | 'WARNING' | 'LOW_BATTERY' | 'WEAK_SIGNAL' | 'OFFLINE'


export interface User {
  id: string
  fullName: string
  email: string
  phone?: string 
  role: Role
  locationIds: string[]
}

export interface Building {
  id: string
  name: string
  address: string
  phone?: string
  floorCount: number
  deviceCount: number
  managers: Pick<User, 'id' | 'fullName' | 'email'>[]
}

export interface Floor {
  id: string
  floorNumber: number
  name: string
  roomCount: number
  rooms: Room[]
}

export interface Room {
  id: string
  name: string
  code: string
  deviceStatus: 'ok' | 'warning' | 'alert' | 'offline'
}

export interface DeviceStatusData {
  smokeLevel: number | null
  smokeUpdatedAt: string | null
  temperature: number | null
  temperatureUpdatedAt: string | null
  batteryLevel: number | null
  batteryUpdatedAt: string | null
  wifiSignal: number | null
  wifiUpdatedAt: string | null
  powerVoltage: number | null
  powerUpdatedAt: string | null
  state: number | null
  stateUpdatedAt: string | null
  lastSyncAt: string | null
}

export interface Device {
  id: string
  thingId: string
  extId: string
  name: string
  createdAt: string
  updatedAt: string
  status: DeviceStatusData | null
  location: {
    id: string
    name: string
    code: string | null
    parent: {
      id: string
      name: string
      parent: {
        id: string
        name: string
      } | null
    } | null
  }
}

export interface Alert {
  id: string
  alertType: AlertType
  state: number | null
  value: number | null
  status: AlertStatus
  triggeredAt: string
  resolvedAt: string | null
  device: { id: string; name: string }
  location: {
    id: string
    name: string
    path: string  
  }
}

export const STATE_LABELS: Record<number, { label: string; color: string }> = {
  [-1]: { label: 'Offline', color: 'default' },
  0: { label: 'Bình thường', color: 'success' },
  1: { label: 'Nguy hiểm', color: 'error' },
  2: { label: 'Cảnh báo', color: 'warning' },
}

export interface SensorLog {
  id: string
  deviceId: string
  value: number
  unit: string
  recordedAt: string
  metric: string 
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}