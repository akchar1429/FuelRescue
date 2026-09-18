export type FuelType = 'Petrol 91' | 'Petrol 95' | 'Premium Unleaded' | 'Diesel' | 'Electric EV';

export type AlertSeverity = 'critical_dry' | 'low_reserve' | 'refueled' | 'resolved';

export type DispatchStatus = 
  | 'idle'
  | 'alert_sent'
  | 'acknowledged_by_station'
  | 'dispatch_assigned'
  | 'en_route'
  | 'arrived'
  | 'refueling_in_progress'
  | 'completed'
  | 'cancelled';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address: string;
  landmark?: string;
  roadName?: string;
  heading?: number;
  speed?: number;
}

export interface BikeTelemetry {
  bikeId: string;
  model: string;
  licensePlate: string;
  ownerName: string;
  ownerPhone: string;
  fuelType: FuelType;
  tankCapacityLiters: number;
  currentFuelLiters: number;
  fuelPercentage: number;
  isDry: boolean;
  isReserve: boolean;
  batteryLevel: number;
  odometerKm: number;
  engineRunning: boolean;
  location: LocationData;
}

export interface DispatchUnit {
  id: string;
  driverName: string;
  driverPhone: string;
  vehicleType: 'Emergency Fuel Bike' | 'Mobile Bowser Van' | 'Service Truck';
  vehiclePlate: string;
  fuelCarriedLiters: number;
  fuelType: FuelType;
  currentLat: number;
  currentLng: number;
  etaMinutes: number;
}

export interface PetrolStation {
  id: string;
  name: string;
  brand: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  availableCans: {
    '2L': number;
    '5L': number;
    '10L': number;
  };
  fuelPrices: {
    [key in FuelType]?: number;
  };
  isOpen: boolean;
  dispatchUnits: DispatchUnit[];
  responseTimeAvgMin: number;
}

export interface StationMessage {
  id: string;
  sender: 'rider' | 'station' | 'system';
  senderName: string;
  text: string;
  timestamp: string;
}

export interface FuelAlert {
  id: string;
  bikeId: string;
  riderName: string;
  riderPhone: string;
  bikeModel: string;
  licensePlate: string;
  fuelType: FuelType;
  requestedFuelLiters: number;
  location: LocationData;
  timestamp: string;
  severity: AlertSeverity;
  status: DispatchStatus;
  targetStationId: string;
  assignedUnit?: DispatchUnit;
  operatorNotes?: string;
  messages: StationMessage[];
  acknowledgedAt?: string;
  dispatchedAt?: string;
  resolvedAt?: string;
}
