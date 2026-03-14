import React, { createContext, useContext, useState } from 'react';
import { IndicatorCategory } from '../types';

interface IndicatorsContextType {
  category: IndicatorCategory;
  setCategory: (category: IndicatorCategory) => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

const IndicatorsContext = createContext<IndicatorsContextType | undefined>(undefined);

export const IndicatorsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [category, setCategory] = useState<IndicatorCategory>('OVERVIEW');
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <IndicatorsContext.Provider value={{ category, setCategory, isExpanded, setIsExpanded }}>
      {children}
    </IndicatorsContext.Provider>
  );
};

export const useIndicators = () => {
  const context = useContext(IndicatorsContext);
  if (context === undefined) {
    throw new Error('useIndicators must be used within an IndicatorsProvider');
  }
  return context;
};
