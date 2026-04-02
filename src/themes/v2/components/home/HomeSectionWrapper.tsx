import cn from 'classnames';
import type { ReactNode } from 'react';

import styles from '@/themes/v2/components/home/HomeSectionWrapper.module.scss';

interface HomeSectionWrapperProps {
  children: ReactNode;
  alt?: boolean;
  noPad?: boolean;
  className?: string;
}

export const HomeSectionWrapper = ({ children, alt, noPad, className }: HomeSectionWrapperProps) => (
  <section className={cn(styles.section, { [styles.alt]: alt, [styles.noPad]: noPad }, className)}>
    <div className={styles.inner}>
      {children}
    </div>
  </section>
);
