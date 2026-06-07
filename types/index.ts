export interface Device {
  id: string;
  hostname: string;
  os: string;
  macAddress: string;
  lastIp: string;
  location: string;
  isActive: boolean;
  activeApp: string | null;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string | null;
  devices: Device[];
  createdAt: string;
}
