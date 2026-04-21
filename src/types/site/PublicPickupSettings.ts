export interface PickupBlockedDateRangeInterface {
  startDate: string;
  endDate: string;
}

export interface PublicPickupSettingsInterface {
  locationLabel: string;
  blockedDateRanges: PickupBlockedDateRangeInterface[];
}
