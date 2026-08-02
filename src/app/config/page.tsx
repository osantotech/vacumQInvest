'use client';

import { useEffect, useState } from 'react';
/* eslint-disable @next/next/no-img-element */
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import GerenciarAcessos from '@/components/GerenciarAcessos';
import type { User } from '@supabase/supabase-js';

export default function Config() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    getUser();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="animate-in">
      <div className="page-header mb-6">
        <h1>Configurações</h1>
        <p className="page-subtitle">Gerencie suas preferências e conta</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header border-b border-border p-4">
            <h2 className="text-lg">Perfil</h2>
          </div>
          <div className="card-body p-6 space-y-6">
            {loading ? (
              <div className="flex gap-4">
                <div className="skeleton w-16 h-16 rounded-full"></div>
                <div className="flex-1 space-y-2 py-2">
                  <div className="skeleton h-4 w-1/2 rounded"></div>
                  <div className="skeleton h-4 w-1/3 rounded"></div>
                </div>
              </div>
            ) : user ? (
              <>
                <div className="flex items-center gap-4">
                  {user.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt="Avatar" 
                      className="w-16 h-16 rounded-full border-2 border-border" 
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center text-2xl font-bold">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{user.user_metadata?.full_name || 'Usuário'}</h3>
                    <p className="text-text-secondary">{user.email}</p>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Nome de Exibição</label>
                  <input type="text" value={user.user_metadata?.full_name || ''} readOnly className="opacity-70 bg-bg-primary" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="text" value={user.email || ''} readOnly className="opacity-70 bg-bg-primary" />
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header border-b border-border p-4">
              <h2 className="text-lg">Notificações</h2>
            </div>
            <div className="card-body p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white mb-1">Telegram Bot</h3>
                  <p className="text-sm text-text-secondary">Receber notificações no canal privado.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-accent uppercase tracking-wider bg-accent/10 px-2 py-1 rounded">Ativado no Servidor</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-red/30">
            <div className="card-header border-b border-border p-4">
              <h2 className="text-lg text-red">Sessão</h2>
            </div>
            <div className="card-body p-6">
              <p className="text-sm text-text-secondary mb-4">
                Encerrar sua sessão neste dispositivo. Você precisará fazer login com o Google novamente.
              </p>
              <button className="btn btn-danger" onClick={handleSignOut}>
                Sair da Plataforma
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Só renderiza para admin — o componente se esconde sozinho quando a
          rota responde 403. */}
      <GerenciarAcessos />
    </div>
  );
}
