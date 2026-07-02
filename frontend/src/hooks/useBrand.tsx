import React, { createContext, useContext, useState, useEffect } from "react";

interface BrandContextType {
  bizName: string;
  bizPhone: string;
  bizEmail: string;
  bizAddress: string;
  bizLogo: string;
  bizDescription: string;
  bizInstagram: string;
  bizTikTok: string;
  bizFacebook: string;
  bizWhatsApp: string;
  updateBrand: (updates: Partial<BrandContextType>) => void;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bizName, setBizName] = useState(localStorage.getItem('bizName') || "Qurux Dumar Salon");
  const [bizPhone, setBizPhone] = useState(localStorage.getItem('bizPhone') || "614498649");
  const [bizEmail, setBizEmail] = useState(localStorage.getItem('bizEmail') || "contact@quruxdumar.com");
  const [bizAddress, setBizAddress] = useState(localStorage.getItem('bizAddress') || "Mogadishu, Somalia");
  const [bizLogo, setBizLogo] = useState(localStorage.getItem('bizLogo') || "");
  const [bizDescription, setBizDescription] = useState(localStorage.getItem('bizDescription') || "Your premium destination for beauty and self-care in Mogadishu.");
  const [bizInstagram, setBizInstagram] = useState(localStorage.getItem('bizInstagram') || "");
  const [bizTikTok, setBizTikTok] = useState(localStorage.getItem('bizTikTok') || "");
  const [bizFacebook, setBizFacebook] = useState(localStorage.getItem('bizFacebook') || "");
  const [bizWhatsApp, setBizWhatsApp] = useState(localStorage.getItem('bizWhatsApp') || "617643394");

  useEffect(() => {
    document.title = bizName;
  }, [bizName]);

  const updateBrand = (updates: Partial<BrandContextType>) => {
    if (updates.bizName !== undefined) {
      setBizName(updates.bizName);
      localStorage.setItem('bizName', updates.bizName);
    }
    if (updates.bizPhone !== undefined) {
      setBizPhone(updates.bizPhone);
      localStorage.setItem('bizPhone', updates.bizPhone);
    }
    if (updates.bizEmail !== undefined) {
      setBizEmail(updates.bizEmail);
      localStorage.setItem('bizEmail', updates.bizEmail);
    }
    if (updates.bizAddress !== undefined) {
      setBizAddress(updates.bizAddress);
      localStorage.setItem('bizAddress', updates.bizAddress);
    }
    if (updates.bizLogo !== undefined) {
      setBizLogo(updates.bizLogo);
      localStorage.setItem('bizLogo', updates.bizLogo);
    }
    if (updates.bizDescription !== undefined) {
      setBizDescription(updates.bizDescription);
      localStorage.setItem('bizDescription', updates.bizDescription);
    }
    if (updates.bizInstagram !== undefined) {
      setBizInstagram(updates.bizInstagram);
      localStorage.setItem('bizInstagram', updates.bizInstagram);
    }
    if (updates.bizTikTok !== undefined) {
      setBizTikTok(updates.bizTikTok);
      localStorage.setItem('bizTikTok', updates.bizTikTok);
    }
    if (updates.bizFacebook !== undefined) {
      setBizFacebook(updates.bizFacebook);
      localStorage.setItem('bizFacebook', updates.bizFacebook);
    }
    if (updates.bizWhatsApp !== undefined) {
      setBizWhatsApp(updates.bizWhatsApp);
      localStorage.setItem('bizWhatsApp', updates.bizWhatsApp);
    }
  };

  return (
    <BrandContext.Provider value={{ 
      bizName, bizPhone, bizEmail, bizAddress, bizLogo, 
      bizDescription, bizInstagram, bizTikTok, bizFacebook, bizWhatsApp,
      updateBrand 
    }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  return context;
};
