/**
 * Hook personnalisé pour gérer la connexion WebSocket
 */

import { useEffect, useState, useCallback } from 'react';
import { socketService } from '@/services/socket.service';
import { useAuth } from '@/contexts/AuthContext';

export function useSocket() {
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connecter au démarrage si authentifié
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let mounted = true;

    const connect = async () => {
      try {
        const connected = await socketService.connect();
        if (mounted) {
          setIsConnected(connected);
          if (!connected) {
            setError('Impossible de se connecter au serveur de chat');
          }
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Erreur de connexion');
          setIsConnected(false);
        }
      }
    };

    connect();

    // Écouter les événements de connexion
    const unsubscribeConnected = socketService.on('socket:connected', () => {
      if (mounted) {
        setIsConnected(true);
        setError(null);
      }
    });

    const unsubscribeDisconnected = socketService.on('socket:disconnected', () => {
      if (mounted) {
        setIsConnected(false);
      }
    });

    const unsubscribeError = socketService.on('socket:error', (err: any) => {
      if (mounted) {
        setError(err.message || 'Erreur de connexion');
        setIsConnected(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeError();
    };
  }, [isAuthenticated]);

  // Déconnecter quand l'utilisateur se déconnecte
  useEffect(() => {
    if (!isAuthenticated) {
      socketService.disconnect();
      setIsConnected(false);
    }
  }, [isAuthenticated]);

  const reconnect = useCallback(async () => {
    setError(null);
    const connected = await socketService.connect();
    setIsConnected(connected);
    return connected;
  }, []);

  return {
    isConnected,
    error,
    reconnect,
    socket: socketService,
  };
}
