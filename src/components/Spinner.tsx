export const Spinner = ({ isLoaded }: { isLoaded: boolean }) => !isLoaded && (
  <div className="position-absolute start-0 top-0 vw-100 vh-100" style={{ zIndex: 555, background: 'radial-gradient(circle at top, #f7f1f2 37%, #f6eff1 45%, #c4b7af 100%)' }}>
    <div className="inner-circles-loader" />
  </div>
);
