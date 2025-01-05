import { useEffect } from 'react';

export const Spinner = ({ isLoaded }: { isLoaded: boolean }) => {
  useEffect(() => {
    const body = document.getElementById('__next');

    if (body) {
      document.body.style.overflowY = 'hidden';
      body.style.overflowY = 'hidden';

      return () => {
        document.body.style.overflowY = '';
        body.style.overflowY = '';
      };
    }
    return undefined;
  }, []);

  return !isLoaded && (
    <div className="position-fixed start-0 top-0 end-0 bottom-0 vw-100 vh-100" style={{ zIndex: 9999, background: 'radial-gradient(circle at top, #f7f1f2 37%, #f6eff1 45%, #c4b7af 100%)' }}>
      <div className="inner-circles-loader" />
    </div>
  );
};
