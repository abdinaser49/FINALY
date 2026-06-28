import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutUsSection from "@/components/AboutUsSection";
import ContactSection from "@/components/ContactSection";
import ServicesSection from "@/components/ServicesSection";
import StylistsSection from "@/components/StylistsSection";
import BridalRentalsSection from "@/components/BridalRentalsSection";
import BookingModal from "@/components/BookingModal";
import SupportSection from "@/components/SupportSection";
import Footer from "@/components/Footer";

const Index = () => {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [preselectedService, setPreselectedService] = useState<string>();
  const [selectedImage, setSelectedImage] = useState<string>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const openBooking = (service?: string, image?: string) => {
    if (loading) {
      toast.info("Please wait while we check your login status...");
      return;
    }
    
    // Removed mandatory login to allow Guest Booking
    /* if (!user) {
      toast.error("Please login or register to book an appointment.");
      navigate("/login");
      return;
    } */
    setPreselectedService(service);
    setSelectedImage(image);
    setBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onBookNow={() => openBooking()} />
      <HeroSection onBookNow={() => openBooking()} />
      <AboutUsSection />
      <ServicesSection onSelectService={(s) => openBooking(s)} />
      <BridalRentalsSection />
      <Footer />
      <BookingModal
        isOpen={bookingOpen}
        onClose={() => {
          setBookingOpen(false);
          setPreselectedService(undefined);
          setSelectedImage(undefined);
        }}
        preselectedService={preselectedService}
        selectedImage={selectedImage}
      />
    </div>
  );
};

export default Index;
