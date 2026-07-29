'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/Sidebar';

interface UserData {
  name: string;
  avatar_url: string;
  email: string;
}

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    const supabase = createClient();

    async function getUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (authUser) {
          setUser({
            name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário',
            avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '',
            email: authUser.email || '',
          });
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
          avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '',
          email: session.user.email || '',
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login page: no sidebar, just render children directly
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Authenticated layout with sidebar
  return (
    <>
      {!loading && user && <Sidebar user={user} />}
      <main className={!loading && user ? 'page-container' : ''}>
        {children}
      </main>
    </>
  );
}
