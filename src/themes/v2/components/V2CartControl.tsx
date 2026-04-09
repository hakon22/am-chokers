import { useCartItem } from '@/themes/v2/hooks/useCartItem';
import styles from '@/themes/v2/components/V2CartControl.module.scss';

interface V2CartControlProps {
  itemId: number;
  variant: 'page' | 'card';
  inCartLabel: string;
  addLabel: string;
  removeAriaLabel: string;
  addAriaLabel: string;
  /** Page variant only: qty to add on first click */
  qty?: number;
  onQtyChange?: (qty: number) => void;
}

export const V2CartControl = ({
  itemId,
  variant,
  inCartLabel,
  addLabel,
  removeAriaLabel,
  addAriaLabel,
  qty = 1,
  onQtyChange,
}: V2CartControlProps) => {
  const { inCart, handleAdd, handleIncrement, handleDecrement } = useCartItem(itemId);

  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    if (variant === 'card') {
      e.preventDefault();
      e.stopPropagation();
    }
    fn();
  };

  if (variant === 'card') {
    return (
      <div className={styles.cardRoot}>
        {inCart ? (
          <div className={styles.control}>
            <button className={styles.controlBtn} onClick={stop(handleDecrement)} aria-label={removeAriaLabel} type="button">−</button>
            <div className={styles.controlCenter}>
              <span className={styles.controlLabel}>{inCartLabel}</span>
              <span className={styles.controlCount}>{inCart.count}</span>
            </div>
            <button className={styles.controlBtn} onClick={stop(handleIncrement)} aria-label={addAriaLabel} type="button">+</button>
          </div>
        ) : (
          <button className={styles.addBtn} onClick={stop(() => handleAdd(1))} type="button">
            {addLabel}
          </button>
        )}
      </div>
    );
  }

  // page variant
  return (
    <div className={styles.pageRoot}>
      {inCart ? (
        <div className={styles.control}>
          <button className={styles.controlBtn} onClick={handleDecrement} type="button">−</button>
          <div className={styles.controlCenter}>
            <span className={styles.controlLabel}>{inCartLabel}</span>
            <span className={styles.controlCount}>{inCart.count}</span>
          </div>
          <button className={styles.controlBtn} onClick={handleIncrement} type="button">+</button>
        </div>
      ) : (
        <>
          {onQtyChange && (
            <div className={styles.qtyControl}>
              <button className={styles.qtyBtn} onClick={() => onQtyChange(Math.max(1, qty - 1))} type="button" disabled={qty <= 1}>−</button>
              <span className={styles.qtyVal}>{qty}</span>
              <button className={styles.qtyBtn} onClick={() => onQtyChange(qty + 1)} type="button">+</button>
            </div>
          )}
          <button className={styles.addBtn} onClick={() => handleAdd(qty)} type="button">
            {addLabel}
          </button>
        </>
      )}
    </div>
  );
};
