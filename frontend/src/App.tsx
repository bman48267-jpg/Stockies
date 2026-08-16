import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/hooks/useTheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AuthPage } from '@/pages/AuthPage';

import { AppLayout } from '@/layouts/AppLayout';
import { PortfolioLayout } from '@/layouts/PortfolioLayout';

import { HomePage } from '@/pages/HomePage';
import { StocksPage } from '@/pages/StocksPage';
import { StockDetailPage } from '@/pages/StockDetailPage';
import { ScreenerPage } from '@/pages/ScreenerPage';
import { MutualFundsPage } from '@/pages/MutualFundsPage';
import { MFDetailPage } from '@/pages/MFDetailPage';
import { MFComparePage } from '@/pages/MFComparePage';
import { MFOverlapPage } from '@/pages/MFOverlapPage';
import { SIPCalculatorPage } from '@/pages/SIPCalculatorPage';
import { PortfolioOverviewPage } from '@/pages/PortfolioOverviewPage';
import { PortfolioStocksPage } from '@/pages/PortfolioStocksPage';
import { PortfolioMFPage } from '@/pages/PortfolioMFPage';
import { PortfolioEmergencyPage } from '@/pages/PortfolioEmergencyPage';
import { PortfolioFDPage } from '@/pages/PortfolioFDPage';
import { PortfolioBondPage } from '@/pages/PortfolioBondPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function MainAppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          {/* Home */}
          <Route index element={<HomePage />} />

          {/* Stocks */}
          <Route path="stocks" element={<StocksPage />} />
          <Route path="stocks/screener" element={<ScreenerPage />} />
          <Route path="stocks/:symbol" element={<StockDetailPage />} />

          {/* Mutual Funds */}
          <Route path="mutual-funds" element={<MutualFundsPage />} />
          <Route path="mutual-funds/compare" element={<MFComparePage />} />
          <Route path="mutual-funds/overlap" element={<MFOverlapPage />} />
          <Route path="mutual-funds/sip-calculator" element={<SIPCalculatorPage />} />
          <Route path="mutual-funds/:schemeCode" element={<MFDetailPage />} />

          {/* Portfolio */}
          <Route path="portfolio" element={<PortfolioLayout />}>
            <Route index element={<PortfolioOverviewPage />} />
            <Route path="stocks" element={<PortfolioStocksPage />} />
            <Route path="mutual-funds" element={<PortfolioMFPage />} />
            <Route path="emergency-funds" element={<PortfolioEmergencyPage />} />
            <Route path="fixed-deposits" element={<PortfolioFDPage />} />
            <Route path="bonds" element={<PortfolioBondPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <MainAppContent />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
