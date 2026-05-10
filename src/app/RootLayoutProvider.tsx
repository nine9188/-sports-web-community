'use client';

import { ThemeProvider } from '@/shared/context/ThemeContext';
import { AuthProvider } from '@/shared/context/AuthContext';
import { Toaster } from 'sonner';

export default function RootLayoutProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      disableTransitionOnChange
    >
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          duration={3000}
          visibleToasts={3}
          closeButton
          richColors
          toastOptions={{
            className: 'text-sm',
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}
