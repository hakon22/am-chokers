export interface ChartDataPointInterface {
  date: string;
  campaigns: {
    [campaignId: number]: {
      clicks: number;
      cost: number;
      failure: number;
      failurePercentage: number;
    }
  };
  total: {
    clicks: number;
    cost: number;
    failure: number;
    failurePercentage: number;
  };
}
