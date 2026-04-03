import { RouterProvider } from '@tanstack/react-router';
import { router } from '@/main/router';

export function App() {
  return <RouterProvider router={router} />;
}
