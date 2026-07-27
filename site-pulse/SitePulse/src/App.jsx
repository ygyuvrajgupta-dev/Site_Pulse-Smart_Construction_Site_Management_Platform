import { Helmet } from 'react-helmet-async';
import AppRoutes from '@/routes/AppRoutes';

/**
 * Root application component.
 * Provides global metadata and renders the router.
 */
function App() {
  return (
    <>
      <Helmet>
        <title>Site Pulse</title>
        <meta name="description" content="Site Pulse - Monitor your sites with confidence" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>
      <AppRoutes />
    </>
  );
}

export default App;