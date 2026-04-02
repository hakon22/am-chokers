import { useContext } from 'react';

import { Layout as v1Layout } from '@/themes/v1';
import { Layout as v2Layout } from '@/themes/v2';
import { Layout as v3Layout } from '@/themes/v3';
import { VersionContext } from '@/components/Context';
import type { SiteVersion } from '@/types/SiteVersion';
import type { VersionedComponents } from '@/components/version-resolver/types';

const componentMap: Record<SiteVersion, VersionedComponents> = {
  v1: { Layout: v1Layout },
  v2: { Layout: v2Layout },
  v3: { Layout: v3Layout },
};

export const useVersionedComponents = (): VersionedComponents => {
  const { version } = useContext(VersionContext);
  return componentMap[version];
};
