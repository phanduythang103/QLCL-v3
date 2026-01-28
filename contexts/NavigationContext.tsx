import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ModuleType } from '../types';

type SettingTab = 'USER' | 'DEPT' | 'POSITION' | 'RANK' | 'ROLE' | 'PERMISSIONS' | 'AUTHORITY' | 'THEME' | 'NOTI' | 'SCHEDULE';

interface NavigationContextType {
    currentModule: ModuleType;
    activeSettingsTab: SettingTab;
    navigateToModule: (module: ModuleType, settingsTab?: SettingTab) => void;
    setSettingsTab: (tab: SettingTab) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentModule, setCurrentModule] = useState<ModuleType>(ModuleType.DASHBOARD);
    const [activeSettingsTab, setActiveSettingsTab] = useState<SettingTab>('USER');

    const navigateToModule = (module: ModuleType, settingsTab?: SettingTab) => {
        setCurrentModule(module);
        if (settingsTab) {
            setActiveSettingsTab(settingsTab);
        }
    };

    return (
        <NavigationContext.Provider value={{
            currentModule,
            activeSettingsTab,
            navigateToModule,
            setSettingsTab: setActiveSettingsTab
        }}>
            {children}
        </NavigationContext.Provider>
    );
};

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};
