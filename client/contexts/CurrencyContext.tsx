import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '@/services/api.service';
import { useAuth } from '@/hooks/useAuth';

// Définir les types
type ExchangeRates = { [key: string]: number };

interface CurrencyContextProps {
  currency: string;
  setCurrency: (currency: string) => Promise<void>;
  rates: ExchangeRates;
  loadingRates: boolean;
  convertPrice: (amount: number, fromCurrency?: string) => number;
  formatPrice: (amount: number | string, fromCurrency?: string) => string;
}

const CurrencyContext = createContext<CurrencyContextProps | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>('XOF');
  const [rates, setRates] = useState<ExchangeRates>({ XAF: 1, XOF: 1, EUR: 0.00152, USD: 0.00165 });
  const [loadingRates, setLoadingRates] = useState<boolean>(true);
  const { user } = useAuth();

  // Charger la devise au démarrage
  useEffect(() => {
    const loadSavedCurrency = async () => {
      try {
        const savedCurrency = await AsyncStorage.getItem('currency');
        // Si l'utilisateur est connecté et a une devise préférée dans son profil, on pourrait l'utiliser en priorité,
        // mais pour l'instant AsyncStorage prend la précédence sur l'appareil.
        if (savedCurrency) {
          setCurrencyState(savedCurrency);
        } else if (user?.country) {
            // Déduction basique selon pays si non défini (ex: Cameroun -> XAF, Sénégal -> XOF, France -> EUR)
            // C'est juste un fallback simple
            const defaultCurrency = user.country.toLowerCase() === 'france' ? 'EUR' : 'XOF';
            setCurrencyState(defaultCurrency);
        }
      } catch (error) {
        console.error('Erreur lecture AsyncStorage currency', error);
      }
    };
    
    loadSavedCurrency();
  }, [user]);

  // Charger les taux de change depuis le backend
  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoadingRates(true);
        // Exécution via le Backend
        const response = await apiService.get('/api/config/currency-rates');
        
        if (response && response.success && response.data) {
          setRates(response.data as ExchangeRates);
        }
      } catch (error) {
        console.error('Erreur chargement des taux de change:', error);
      } finally {
        setLoadingRates(false);
      }
    };

    fetchRates();
    // Recharger toutes les heures (si besoin) ou optionnellement par jour
  }, []);

  const setCurrency = async (newCurrency: string) => {
    try {
      setCurrencyState(newCurrency);
      
      // 1) Sauvegarde locale
      await AsyncStorage.setItem('currency', newCurrency);
      
      // 2) Si utilisateur connecté, sauvegarde backend pour cohérence
      if (user && user.accountType === 'BUYER') {
        // Optionnel : ne pas bloquer l'UI pour la mise à jour backend
        apiService.patch('/api/buyer/profile', { preferredCurrency: newCurrency })
          .catch(err => console.error('Erreur MAJ devise backend:', err));
      }
    } catch (error) {
      console.error('Erreur modification devise', error);
    }
  };

  /**
   * Convertit un montant (originellement en XOF par défaut) vers la devise globale.
   * L'API renvoie les taux en base XAF (qui équivaut au XOF : 1 XAF = 1 XOF). 
   */
  const convertPrice = useCallback((amount: number, fromCurrency: string = 'XOF'): number => {
    // Si la devise d'origine et la cible sont identiques, on retourne le montant normal
    if (fromCurrency === currency) return amount;
    
    // Convertir depuis la devise d'origine vers la base (XAF/XOF)
    const rateFromBase = rates[fromCurrency] || 1;
    const amountInBase = amount / rateFromBase;
    
    // Puis convertir de la base vers la devise choisie
    const targetRate = rates[currency] || 1;
    return amountInBase * targetRate;
  }, [rates, currency]);

  /**
   * Formate le montant selon la devise cible avec la bonne conversion
   */
  const formatPrice = useCallback((amount: number | string, fromCurrency: string = 'XOF'): string => {
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount)) return `${amount} ${currency}`;

    const convertedAmount = convertPrice(numAmount, fromCurrency);

    // Formater selon la devise : 
    // - Pour XOF, XAF on n'a généralement pas de décimales (hormis 00)
    // - Pour EUR, USD on a des décimales
    const isCryptoOrForeign = ['USD', 'EUR', 'GBP'].includes(currency);
    const fractionDigits = isCryptoOrForeign ? 2 : 0;

    return `${convertedAmount.toLocaleString('fr-FR', { 
        minimumFractionDigits: fractionDigits, 
        maximumFractionDigits: fractionDigits 
    })} ${currency}`;
  }, [convertPrice, currency]);

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      rates,
      loadingRates,
      convertPrice,
      formatPrice
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextProps => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
