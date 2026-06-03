import { MapPin, Clock } from "lucide-react";
import { WhatsAppOutlined } from "@ant-design/icons";
import logo from "@/assets/logo.png";
import { SALON_CONFIG } from "@/config/brand";
import { useBusinessContact } from "@/hooks/useBusinessContact";

const Footer = () => {
  const { phone: businessPhone } = useBusinessContact();
  const whatsappNumber = businessPhone; 
  const displayPhone = businessPhone.length > 9 && businessPhone.startsWith('252') ? businessPhone.substring(3) : businessPhone;
  const email = SALON_CONFIG.email;
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

  return (
    <footer className="py-20 px-6 bg-foreground text-background/80">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12 mb-16">
          <div>
            <img src={logo} alt="Qurux Dumar Logo" className="h-24 w-auto mb-6 transition-transform hover:scale-105" />
            <h3 className="font-display text-2xl text-background mb-4">Qurux Dumar Beauty Salon</h3>
            <p className="font-body text-sm leading-relaxed">
              Professional beauty home in the heart of Mogadishu, where every detail is designed to make you feel special.
            </p>
          </div>
          <div className="space-y-4 font-body text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 mt-0.5 text-gold-light" />
              <span>Dabka, Banadir<br />Mogadishu, Somalia</span>
            </div>
            <a 
              href={whatsappUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-3 hover:text-white transition-colors group"
            >
              <div className="bg-[#25D366] p-1 rounded-full group-hover:scale-110 transition-transform">
                <WhatsAppOutlined className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">{SALON_CONFIG.displayPhone}</span>
            </a>
          </div>
          <div className="font-body text-sm">
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 mt-0.5 text-gold-light" />
              <div>
                <p>Saturday – Thursday: 9:00 AM – 7:00 PM</p>
                <p>Friday: 10:30 AM – 7:00 PM (After prayer)</p>
                <p className="mt-2 text-gold-light font-medium tracking-wide text-xs">ONLINE BOOKING: OPEN 24/7</p>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-background/10 pt-8 text-center font-body text-xs text-background/40">
          © 2024 Qurux Dumar Beauty Salon. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
