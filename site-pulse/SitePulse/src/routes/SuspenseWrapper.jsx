import { Suspense } from 'react';
import LoadingScreen from '@/components/common/LoadingScreen';

/**
 * SuspenseWrapper.
 * Shared Suspense boundary for lazy-loaded route components,
 * showing a centered loading screen while a chunk is fetched.
 */
function SuspenseWrapper({ children }) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      {children}
    </Suspense>
  );
}

export default SuspenseWrapper;