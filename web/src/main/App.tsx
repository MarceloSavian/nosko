import { RouterProvider } from '@tanstack/react-router';
import { router } from '@/main/router';
import { AuthProvider } from '@/presentation/contexts/AuthContext';

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
