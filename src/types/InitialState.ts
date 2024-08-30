export type LoadingStatus = 'idle' | 'loading' | 'finish' | 'failed';
export type Error = string | null;

export type InitialState = {
  error: Error;
  loadingStatus: LoadingStatus;
};
