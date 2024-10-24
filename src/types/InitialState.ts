export type LoadingStatus = 'idle' | 'loading' | 'finish' | 'failed';
export type Error = string | null;

export interface InitialState {
  error: Error;
  loadingStatus: LoadingStatus;
}
