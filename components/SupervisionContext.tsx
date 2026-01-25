import React, { createContext, useState, useContext, ReactNode } from 'react';
import { SupervisionCategory } from '../types';

interface SupervisionContextType {
  category: SupervisionCategory;
  setCategory: (category: SupervisionCategory) => void;
  isExpanded: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
}

const SupervisionContext = createContext<SupervisionContextType | undefined>(undefined);

export const SupervisionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [category, setCategory] = useState<SupervisionCategory>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <SupervisionContext.Provider value={{ category, setCategory, isExpanded, setIsExpanded }}>
      {children}
    </SupervisionContext.Provider>
  );
};

export const useSupervision = (): SupervisionContextType => {
  const context = useContext(SupervisionContext);
  if (context === undefined) {
    throw new Error('useSupervision must be used within a SupervisionProvider');
  }
  return context;
};
