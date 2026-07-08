import React, { createContext, useContext, useState } from 'react';
import { ActiveTab } from './Assessment/types';

interface AssessmentContextType {
  activeTab: ActiveTab | null;
  setActiveTab: (tab: ActiveTab | null) => void;
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export const AssessmentProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <AssessmentContext.Provider value={{ activeTab, setActiveTab, isExpanded, setIsExpanded }}>
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessmentContext = () => {
  const context = useContext(AssessmentContext);
  if (context === undefined) {
    throw new Error('useAssessmentContext must be used within an AssessmentProvider');
  }
  return context;
};
