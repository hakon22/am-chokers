export interface ChartDataPointInterface {
  date: string;
  campaigns: {
    [campaignId: number]: {
      clicks: number;
      cost: number;
    }
  };
  total: {
    clicks: number;
    cost: number;
  };
}
