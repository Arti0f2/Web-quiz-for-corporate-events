import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('organizer' | 'participant')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      toast.error('Please login to continue');
      router.push('/login');
      return;
    }

    // Verify token and check role if needed
    const verifyToken = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Invalid token');
        }

        const { data } = await response.json();

        if (allowedRoles && !allowedRoles.includes(data.role)) {
          toast.error('Unauthorized access');
          router.push('/dashboard');
          return;
        }

        setIsLoading(false);
      } catch (error) {
        localStorage.removeItem('token');
        toast.error('Session expired. Please login again');
        router.push('/login');
      }
    };

    verifyToken();
  }, [router, allowedRoles]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return <>{children}</>;
} 