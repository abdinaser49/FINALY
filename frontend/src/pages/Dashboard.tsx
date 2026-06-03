import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Calendar, Users, Settings, LogOut, Menu, X,
  ChevronDown, Bell, Search, Plus, MoreHorizontal, Edit, Trash2, Copy, MoreVertical, ChevronLeft, ChevronRight,
  Phone, CheckCircle2, Check, Clock, DollarSign, Briefcase, TrendingUp,
  ArrowUpRight, ArrowDownRight, CreditCard, Sparkles, Scissors, Box, Shirt, UserPlus,
  Upload, Loader2, ImagePlus, ShoppingBag, Store, AlertTriangle, Download, XCircle, ShieldCheck, CalendarCheck,
  Globe, Palette, CloudUpload, FileText, ArrowRight, Info
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { cn, resolveBookingServiceId } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";
import { translations } from "@/utils/translations";
import hairImg from "@/assets/hair.jpg";
import nailImg from "@/assets/Nail Art1.jpg";
import facialImg from "@/assets/makeup.jpg";
import bodyImg from "@/assets/service-massage.png";
import aromaticHenna from "@/assets/henna.jpg";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LineChart, Line, PieChart, Pie
} from 'recharts';

// Static charts data removed. Replaced with dynamic data linked to DB.

const statusColors: Record<string, string> = {
  "confirmed": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "pending": "bg-sky-100 text-sky-800 border-sky-200",
  "cancelled": "bg-rose-100 text-rose-800 border-rose-200",
};

type Tab = "overview" | "appointments" | "finance" | "jobs" | "clients" | "settings" | "rentals" | "reports" | "walkin" | "products" | "pos" | "staff" | "users" | "calendar";

const addHour = (timeStr: string) => {
  if (!timeStr) return "00:00";
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10);
  const m = parts[1] || "00";
  const newH = (h + 1) % 24;
  return `${newH.toString().padStart(2, '0')}:${m}`;
};

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  // State Declarations FIRST
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<"appointment" | "client" | "service" | "staff" | "payment" | "rental" | "expense" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reportsSortLatest, setReportsSortLatest] = useState(true);
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsDateFilter, setReportsDateFilter] = useState<'all' | 'today' | 'month'>('all');
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [wiAmount, setWiAmount] = useState(""); // New state for POS amount handling
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lang, setLang] = useState<'en' | 'so'>('en');
  const t = translations[lang];
  const [expenses, setExpenses] = useState<any[]>([]);

  // Role Logic SECOND
  const activeEmail = user?.email || "";
  const isAdmin = activeEmail && import.meta.env.VITE_ADMIN_EMAILS?.includes(activeEmail);
  const userProfile = profiles.find(p => p.email?.toLowerCase() === activeEmail.toLowerCase());
  const isCashier = userProfile?.role?.toLowerCase() === "cashier";

  const [activeTab, setActiveTab] = useState<Tab>(isAdmin ? "overview" : "appointments");

  useEffect(() => {
    if (!isAdmin && !isCashier && ["overview", "jobs", "settings", "reports", "users", "staff", "finance"].includes(activeTab)) {
      setActiveTab("appointments");
    } else if (isCashier && ["jobs", "settings", "reports", "users", "staff", "finance"].includes(activeTab)) {
      setActiveTab("walkin");
    }
  }, [isAdmin, isCashier, activeTab]);

  // Walk-in state
  const [wiName, setWiName] = useState("");
  const [wiPhone, setWiPhone] = useState("");
  const [wiCart, setWiCart] = useState<any[]>([]);
  const [wiSaving, setWiSaving] = useState(false);
  const [wiToday, setWiToday] = useState<any[]>([]);
  const [posCart, setPosCart] = useState<any[]>([]);
  const [posPaymentMethod, setPosPaymentMethod] = useState("Cash");
  const [posDiscount, setPosDiscount] = useState(0);
  const [settingsSubTab, setSettingsSubTab] = useState<string>('grid');

  const [dbClearBookings, setDbClearBookings] = useState(false);
  const [dbClearExpenses, setDbClearExpenses] = useState(false);
  const [dbClearCustomers, setDbClearCustomers] = useState(false);
  const [dbClearServices, setDbClearServices] = useState(false);
  const [dbConfirmationText, setDbConfirmationText] = useState("");
  const [dbIsClearing, setDbIsClearing] = useState(false);
  const [financeTab, setFinanceTab] = useState<'sales' | 'expenses'>(isAdmin ? 'sales' : 'expenses');
  const [financeSubTab, setFinanceSubTab] = useState<'sales' | 'expenses'>(isAdmin ? 'sales' : 'expenses');
  const [financeDateFilter, setFinanceDateFilter] = useState<'all' | 'today' | 'month'>('all');
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    service: "", // kept for fallback
    selectedServices: [] as any[],
    date: "",
    time: "",
    amount: "",
    description: "",
    duration: "",
    image: "",
    color: "",
    size: "",
    weight_kg: "",
    height_cm: "",
    serviceId: "",
    email: "",
    password: "",
    category: ""
  });
  const [bizName, setBizName] = useState(localStorage.getItem('bizName') || "Qurux Dumar Salon");
  const [bizPhone, setBizPhone] = useState(localStorage.getItem('bizPhone') || "+252 61 7643394");
  const [bizEmail, setBizEmail] = useState(localStorage.getItem('bizEmail') || "contact@quruxdumar.com");
  const [bizAddress, setBizAddress] = useState(localStorage.getItem('bizAddress') || "Mogadishu, Somalia");
  const [bizHoursStart, setBizHoursStart] = useState(localStorage.getItem('bizHoursStart') || "08:00");
  const [bizHoursEnd, setBizHoursEnd] = useState(localStorage.getItem('bizHoursEnd') || "20:00");
  const [maxBookingsPerSlot, setMaxBookingsPerSlot] = useState(parseInt(localStorage.getItem('maxBookingsPerSlot') || "3", 10));
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const [bookingSettings, setBookingSettings] = useState({ autoApprove: true, requireDeposit: false });
  const [paymentMethods, setPaymentMethods] = useState<Record<string, boolean>>({
    'Cash': true, 'Credit Card': true, 'Zaad Service': true, 'EVC Plus': true, 'eDahab': false, 'Premier Wallet': false
  });
  const [notifSettings, setNotifSettings] = useState({
    'Email Appointment Reminders': true,
    'SMS Notifications to Clients': true,
    'Daily Report Summaries': false,
    'Low Inventory Alerts': false
  });
  const [themeMode, setThemeMode] = useState<'light'|'dark'>('light');
  const [sysCurrency, setSysCurrency] = useState('USD ($)');
  const [sysTimezone, setSysTimezone] = useState('Africa/Mogadishu (GMT+3)');

  useEffect(() => {
    fetchBookings();
    fetchServices();
    fetchStaff();
    fetchCustomers();
    fetchExpenses();

    // Real-time subscription — instantly shows new bookings without page refresh
    const channel = supabase
      .channel('bookings-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        (payload) => {
          // Add new booking to top of list immediately
          setBookings(prev => [payload.new as any, ...prev]);
          toast.success("🔔 New booking received!", {
            description: `${(payload.new as any).name} — ${(payload.new as any).service}`,
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings' },
        (payload) => {
          setBookings(prev => prev.map(b => b.id === (payload.new as any).id ? payload.new as any : b));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'bookings' },
        (payload) => {
          setBookings(prev => prev.filter(b => b.id !== (payload.old as any).id));
        }
      )
      .subscribe();

    const servicesChannel = supabase
      .channel('services-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'services' },
        () => fetchServices()
      )
      .subscribe();

    const staffChannel = supabase
      .channel('staff-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff' },
        () => fetchStaff()
      )
      .subscribe();

    const customersChannel = supabase
      .channel('customers-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        () => fetchCustomers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(servicesChannel);
      supabase.removeChannel(staffChannel);
      supabase.removeChannel(customersChannel);
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileName = `${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('services')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('services')
        .getPublicUrl(fileName);

      setFormData({ ...formData, image: publicUrl });
      toast.success("Image uploaded successfully!");
    } catch (error: any) {
      toast.error("Unable to upload image: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log("Current Staff Data Sample:", data?.[0]);
      setProfiles(data || []);
    } catch (error: any) {
      console.error("Error loading staff:", error.message);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      console.error("Error loading customers:", error.message);
    }
  };

  const fetchExpenses = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });
      if (!error) setExpenses(data || []);
    } catch (err) {
      console.error("Error loading expenses:", err);
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDbServices(data || []);
    } catch (error: any) {
      console.error("Error loading services:", error.message);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*');

      if (error) throw error;

      // Sort: Pending first, then by created_at descending
      const sortedByStatus = (data || []).sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      });

      // For Staff (not admin or cashier), filter only their assigned bookings
      let filteredData = sortedByStatus;
      if (!isAdmin && !isCashier && userProfile?.name) {
         filteredData = filteredData.filter(b => 
           (b as any).notes?.includes(`Assigned to: ${userProfile.name}`) || 
           b.service?.includes(userProfile.name)
         );
      }

      setBookings(filteredData);
    } catch (error: any) {
      toast.error("Error loading appointments: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWalkinToday = async () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - (offset * 60 * 1000));
    const todayStr = localDate.toISOString().split('T')[0];
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_date', todayStr)
      .eq('status', 'pending')
      .like('start_time', '%(Walk-in)%')
      .order('created_at', { ascending: false });
    setWiToday(data || []);
  };

  const deleteBooking = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBookings(prev => prev.filter(b => b.id !== id));
      toast.success("Appointment deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete appointment: " + error.message);
    }
  };
  const deleteService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setDbServices(prev => prev.filter(s => s.id !== id));
      toast.success("Service deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete service: " + error.message);
    }
  };

  const deleteStaff = async (id: string) => {
    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProfiles(prev => prev.filter(s => s.id !== id));
      toast.success("Staff member deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete staff: " + error.message);
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCustomers(prev => prev.filter(c => c.id !== id));
      toast.success("Customer deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete customer: " + error.message);
    }
  };

  const handleClearDatabase = async () => {
    if (dbConfirmationText.toUpperCase() !== 'CLEAR') {
      toast.error("Please type the word 'CLEAR' to confirm deletion!");
      return;
    }
    
    if (!dbClearBookings && !dbClearExpenses && !dbClearCustomers && !dbClearServices) {
      toast.error("Please select at least one type of data to delete!");
      return;
    }
    
    setDbIsClearing(true);
    try {
      if (dbClearBookings) {
        // Delete all bookings
        const { error } = await supabase.from('bookings').delete().neq('name', '___non_existent_name___');
        if (error) throw new Error("Error clearing bookings: " + error.message);
      }
      
      if (dbClearExpenses) {
        // Delete all expenses
        const { error } = await (supabase as any).from('expenses').delete().neq('title', '___non_existent_title___');
        if (error) throw new Error("Error clearing expenses: " + error.message);
      }
      
      if (dbClearCustomers) {
        // Delete all customers
        const { error } = await supabase.from('customers').delete().neq('name', '___non_existent_name___');
        if (error) throw new Error("Error clearing customers: " + error.message);
      }
      
      if (dbClearServices) {
        // Delete all services
        const { error } = await supabase.from('services').delete().neq('name', '___non_existent_name___');
        if (error) throw new Error("Error clearing services: " + error.message);
      }
      
      toast.success("The selected data was successfully deleted! 🧹");
      
      // Reset checkboxes and text
      setDbClearBookings(false);
      setDbClearExpenses(false);
      setDbClearCustomers(false);
      setDbClearServices(false);
      setDbConfirmationText("");
      
      // Refresh all state from Supabase
      fetchBookings();
      fetchExpenses();
      fetchCustomers();
      fetchServices();
    } catch (err: any) {
      toast.error(err.message || "An error occurred during data deletion.");
    } finally {
      setDbIsClearing(false);
    }
  };

  const downloadTransactionsCSV = () => {
    const headers = ["Client Name", "Date", "Service", "Amount", "Status"];
    const rows = allBookings
      .filter(b => b.status === 'confirmed')
      .map(b => [
        `"${b.name || 'Guest'}"`,
        `"${new Date(b.created_at || b.booking_date).toLocaleDateString()}"`,
        `"${b.service || ''}"`,
        Number(b.amount || 0).toFixed(2),
        b.status === 'completed' || b.status === 'confirmed' ? 'Completed' : b.status === 'pending' ? 'Pending' : 'Cancelled'
      ]);
      
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "transaction_history.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success("CSV Downloaded!");
  };

  const openEditClient = (item: any) => {
    setEditingId(item.id);
    setFormData({ ...formData, name: item.name, phone: item.phone, description: item.email || "" });
    setModalType('client');
  };

  const openEditStaff = (item: any) => {
    setEditingId(item.id);
    setFormData({ 
      ...formData, 
      name: item.full_name || item.name || "", 
      phone: item.phone || "", 
      description: item.role || "", 
      amount: item.salary?.toString() || "", 
      image: item.avatar_url || "",
      email: item.email || ""
    });
    setModalType('staff');
  };

  const openEditService = (item: any, isRental: boolean = false) => {
    setEditingId(item.id);
    setFormData({ ...formData, name: isRental ? item.name : "", service: isRental ? "" : item.name, description: item.description || "", amount: item.price.toString(), duration: item.duration || "", image: item.image_url || "", color: item.color || "", size: item.size || "", weight_kg: item.weight_kg || "", height_cm: item.height_cm || "", category: item.category || "" });
    setModalType(isRental ? 'rental' : 'service');
  };

  const openEditBooking = (item: any) => {
    setEditingId(item.id);
    const serviceNames = (item.service || "").split(",").map((s: string) => s.trim());
    const matchedServices = dbServices.filter((srv: any) => serviceNames.includes(srv.name));
    
    const selected = matchedServices.length > 0
      ? matchedServices.map((srv: any) => ({ id: srv.id, name: srv.name, price: srv.price, image_url: srv.image_url }))
      : [{ id: item.service_id, name: item.service, price: item.amount, image_url: item.image_url }];

    setFormData({ 
      ...formData, 
      name: item.name, 
      phone: item.phone, 
      service: item.service, 
      serviceId: item.service_id, 
      selectedServices: selected,
      date: item.booking_date, 
      time: item.start_time, 
      amount: item.amount.toString() 
    });
    setModalType('appointment');
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      toast.success(`Status updated: ${status}`);
    } catch (error: any) {
      toast.error("Failed to update status: " + error.message);
    }
  };

  // Handle Modal Form Submission
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalType === 'appointment' || modalType === 'payment') {
        const slotDate = formData.date || new Date().toISOString().split('T')[0];
        const slotTime = formData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // VALIDATION: Triple Name & Phone are now MANDATORY
        const nameParts = formData.name.trim().split(/\s+/);
        if (nameParts.length < 3) {
          toast.error("Fadlan geli magaca oo saddexan (Magacaaga, Magaca Aabbahaa & Kan Awoowahaa)!");
          return;
        }
        if (!formData.phone.trim() || formData.phone.trim().length < 6) {
          toast.error("Fadlan geli lambarka taleefanka oo sax ah!");
          return;
        }

        // Check if the slot already has 3 or more bookings (excluding current one if editing)
        const concurrentBookings = allBookings.filter(b =>
          b.booking_date === slotDate &&
          b.start_time === slotTime &&
          b.id !== editingId
        );

        if (concurrentBookings.length >= 3) {
          toast.error("This slot is full! (Max 3 people at a time). Please choose another slot.");
          return;
        }

        if (!formData.selectedServices || formData.selectedServices.length === 0) {
          toast.error("Please select at least one service!");
          return;
        }

        const totalAmount = formData.selectedServices.reduce((sum, srv) => sum + (parseFloat(srv.price) || 0), 0);
        const combinedServiceNames = formData.selectedServices.map(srv => srv.name).join(", ");
        const firstServiceName = formData.selectedServices[0]?.name || combinedServiceNames;
        const firstServiceId = formData.selectedServices[0]?.id?.toString?.() || null;
        const firstImageUrl = formData.selectedServices[0]?.image_url || null;
        const resolvedServiceId = await resolveBookingServiceId(supabase, firstServiceId, firstServiceName, {
          price: totalAmount,
          image_url: firstImageUrl,
          category: modalType === 'payment' ? 'Payment' : 'Appointment',
        });
        if (!resolvedServiceId) throw new Error('Unable to resolve a valid service id for booking.');

        const payload = {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          service: combinedServiceNames,
          service_id: resolvedServiceId,
          customer_id: user?.id,
          booking_date: slotDate,
          start_time: slotTime,
          end_time: addHour(slotTime),
          amount: totalAmount,
          image_url: firstImageUrl,
          status: 'pending'
        };

        if (editingId) {
          const { error } = await supabase.from('bookings').update(payload).eq('id', editingId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('bookings').insert([payload]);
          if (error) throw error;
        }

        toast.success(editingId ? "Appointment updated." : "Appointment booked successfully!");
      } else if (modalType === 'service') {
        const payload: any = {
          name: formData.service || formData.name,
          price: parseFloat(formData.amount) || 0,
          image_url: formData.image || null,
          category: formData.category || 'General'
        };
        if (formData.description) payload.description = formData.description;
        const { error } = editingId
          ? await supabase.from('services').update(payload).eq('id', editingId)
          : await supabase.from('services').insert([payload]);

        if (error) throw error;
        toast.success(editingId ? "Service updated." : "Service created successfully!");
      } else if (modalType === 'rental') {
        const payload: any = {
          name: formData.name,
          price: parseFloat(formData.amount) || 0,
          image_url: formData.image || null,
          category: 'Dress' // EXTREMELY IMPORTANT
        };
        if (formData.description) payload.description = formData.description;
        const { error } = editingId
          ? await supabase.from('services').update(payload).eq('id', editingId)
          : await supabase.from('services').insert([payload]);

        if (error) throw error;
        toast.success(editingId ? "Rental item updated." : "Rental item created successfully!");
      } else if (modalType === 'staff') {
        const payload: any = {
          full_name: formData.name, // Use full_name to match DB constraint
          name: formData.name,      // Keep name for compatibility
          phone: formData.phone,
          role: formData.description || "Stylist",
          avatar_url: formData.image || null,
          email: formData.email || null,
        };

        // If creating a new user with email and password from 'User Access' tab
        if (!editingId && formData.email && formData.password) {
          const secondaryAuthClient = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            { auth: { persistSession: false, autoRefreshToken: false } }
          );
          
          const { error: signUpError } = await secondaryAuthClient.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: { data: { full_name: formData.name, phone: formData.phone } }
          });
          
          if (signUpError) {
             toast.error("Login registration failed: " + signUpError.message);
             return;
          }
        }

        const { error } = editingId
          ? await supabase.from('staff').update(payload).eq('id', editingId)
          : await supabase.from('staff').insert([payload]);

        if (error) {
          console.error("Staff Error:", error);
          throw new Error(`${error.message} ${error.details || ""}`);
        }
        toast.success(editingId ? "Staff member updated." : "Staff member added successfully.");
        fetchStaff();
      } else if (modalType === 'client') {
        const payload = {
          name: formData.name,
          phone: formData.phone,
          email: formData.description
        };
        const { error } = editingId
          ? await supabase.from('customers').update(payload).eq('id', editingId)
          : await supabase.from('customers').insert([payload]);

        if (error) throw error;
        toast.success(editingId ? "Customer updated." : "Congratulations! Customer successfully registered.");
        fetchCustomers();
      } else if (modalType === 'expense') {
        const payload = {
          title: formData.name,
          category: formData.description || 'General',
          amount: parseFloat(formData.amount) || 0,
          date: formData.date || getLocalDateString()
        };
        const { error } = await (supabase as any).from('expenses').insert([payload]);
        if (error) throw error;
        toast.success("Expense recorded successfully!");
        fetchExpenses();
      }

      setModalType(null);
      setEditingId(null);
      setFormData({ name: "", phone: "", service: "", selectedServices: [], date: "", time: "", amount: "", description: "", duration: "", image: "", color: "", size: "", weight_kg: "", height_cm: "", serviceId: "", email: "", password: "" });
      fetchBookings();
      fetchServices();
      fetchStaff();
      fetchCustomers();
    } catch (error: any) {
      toast.error("Unable to save data: " + error.message);
    }
  };

  const handleSeedDefaults = async () => {
    const defaultServicesToSeed = [
      { name: "Haircut & Styling", price: 35, description: "Professional cutting, coloring, and styling services tailored to your face shape and personal style.", category: "General" },
      { name: "Makeup", price: 50, description: "Expert makeup application for weddings, parties, and special events using premium products.", category: "General" },
      { name: "Manicure & Pedicure", price: 30, description: "Complete hand and foot care including nail shaping, cuticle treatment, and artistic polishing.", category: "General" },
      { name: "Skin Care", price: 45, description: "Rejuvenating facial treatments designed to restore your skin's natural glow and hydration.", category: "General" },
      { name: "Body Treatment", price: 60, description: "Full body exfoliation and nourishment for smooth, healthy-looking skin all year round.", category: "General" },
      { name: "Massage", price: 65, description: "Relaxing body therapy to reduce stress, tension, and promote overall physical well-being.", category: "General" },
    ];

    try {
      setLoading(true);
      const { error } = await supabase.from('services').insert(defaultServicesToSeed);
      if (error) throw error;
      toast.success("Default services added to dashboard!");
      fetchServices();
    } catch (err: any) {
      toast.error("Error seeding services: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePOSComplete = async () => {
    if (posCart.length === 0) { toast.error("Please add items to the cart!"); return; }
    
    const posTotal = posCart.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

    setWiSaving(true);
    const customerName = wiName.trim() || "Guest Customer";

    try {
      let finalCustomerId = user?.id;
      if (!finalCustomerId) {
        const { data: p } = await supabase.from('profiles').select('id').limit(1).single();
        if (p) finalCustomerId = p.id;
      }

      const posServiceId = posCart[0]?.id?.toString?.();
      const resolvedPosServiceId = await resolveBookingServiceId(supabase, posServiceId, posCart[0]?.name, {
        price: posTotal,
        image_url: posCart[0]?.image_url || null,
        category: 'POS',
      });
      if (!resolvedPosServiceId) throw new Error('Unable to resolve a valid service id for POS booking.');

      const payload = {
        name: customerName,
        phone: wiPhone || "N/A",
        service: posCart.map(i => i.name).join(", "),
        service_id: resolvedPosServiceId,
        amount: posTotal,
        status: 'pending',
        booking_date: getLocalDateString(),
        start_time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        end_time: addHour(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })),
        customer_id: finalCustomerId,
        image_url: posCart[0]?.image_url || null,
        category: 'POS',
        notes: `Payment Method: ${posPaymentMethod}`
      };

      const { error } = await supabase.from('bookings').insert([payload]);
      if (error) throw error;

      // DECREMENT STOCK for Products
      for (const item of posCart) {
        if (item.category === 'Product') {
          const currentStock = parseInt(item.duration) || 0;
          if (currentStock > 0) {
            await supabase.from('services')
              .update({ duration: (currentStock - 1).toString() })
              .eq('id', item.id);
          }
        }
      }

      setReceiptData({
        bizName, bizPhone,
        customerName: customerName,
        phone: wiPhone || "N/A",
        date: getLocalDateString(),
        time: new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' }),
        items: [...posCart],
        total: posTotal.toFixed(2),
        paymentMethod: posPaymentMethod
      });
      setTimeout(() => { try { window.print(); } catch(e) { console.warn("Print skipped", e); } }, 500);

      toast.success(`✅ Order Checked Out! (${posCart.length} items)`);
      setWiName(""); setWiPhone(""); setPosCart([]); setWiAmount("");
      fetchBookings();
      fetchServices();
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setWiSaving(false);
    }
  };

  // Only show real data — no fake/fallback data
  // Filter arrays based on the global search query
  const query = searchQuery.trim().toLowerCase();

  const filteredBookings = query === "" 
    ? bookings 
    : bookings.filter(b => 
        (b.name || "").toLowerCase().includes(query) ||
        (b.phone || "").toLowerCase().includes(query) ||
        (b.service || "").toLowerCase().includes(query) ||
        (b.status || "").toLowerCase().includes(query)
      );

  const filteredServices = query === ""
    ? dbServices
    : dbServices.filter(s =>
        (s.name || "").toLowerCase().includes(query) ||
        (s.category || "").toLowerCase().includes(query) ||
        (s.description || "").toLowerCase().includes(query)
      );

  const filteredStaff = query === ""
    ? profiles
    : profiles.filter(p =>
        (p.full_name || p.name || "").toLowerCase().includes(query) ||
        (p.email || "").toLowerCase().includes(query) ||
        (p.role || "").toLowerCase().includes(query) ||
        (p.phone || "").toLowerCase().includes(query)
      );

  const allBookings = filteredBookings;
  // Rentals overdue 24h
  const overdueRentals = bookings.filter(b => b.category === 'Dress' && (b.created_at ? new Date(b.created_at).getTime() : new Date(b.booking_date).getTime()) <= Date.now() - 24 * 60 * 60 * 1000);

  // Notify admin about overdue rentals
  useEffect(() => {
    if (overdueRentals.length > 0) {
      toast.error(`⏰ ${overdueRentals.length} rental(s) have exceeded 24 hours!`);
    }
  }, [overdueRentals]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Logout error:", err);
    }
    navigate("/", { replace: true });
  };

  // Dynamic Navigation Items based on Role
  const navItems: { id: Tab; label: string; icon: any }[] = isAdmin ? [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "appointments", label: "Appointments", icon: CalendarCheck },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "clients", label: "Clients", icon: Users },
    { id: "jobs", label: "Services", icon: Scissors },
    { id: "rentals", label: "Rentals", icon: Box },
    { id: "staff", label: "Staff", icon: Users },
    { id: "finance", label: "Finance", icon: CreditCard },
    { id: "reports", label: "Reports", icon: ShoppingBag },
    { id: "settings", label: "Settings", icon: Settings },
  ] : isCashier ? [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "appointments", label: "Appointments", icon: CalendarCheck },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "clients", label: "Clients", icon: Users },
    { id: "jobs", label: "Services", icon: Scissors },
    { id: "rentals", label: "Rentals", icon: Box },
    { id: "reports", label: "Reports", icon: ShoppingBag },
  ] : [
    { id: "appointments", label: "My Bookings", icon: CalendarCheck },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "rentals", label: "Rentals", icon: Box },
  ];

  const sidebarStyles = "fixed lg:static inset-y-0 left-0 z-50 w-56 bg-gradient-to-b from-[#6D1B4B] to-[#4A0E32] text-white transform transition-transform duration-500 ease-in-out lg:translate-x-0 shadow-xl overflow-hidden";
  const cardStyles = "bg-white border border-zinc-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl overflow-hidden relative transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:-translate-y-0.5";

  // Unified Local Date Helper (YYYY-MM-DD)
  const getLocalDateString = (date = new Date()) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const todayStr = getLocalDateString();

  const [aptViewMode, setAptViewMode] = useState<'list' | 'calendar'>('list');
  const [appointmentsLayout, setAppointmentsLayout] = useState<'table' | 'cards'>('table');
  const [calendarCurrentDate, setCalendarCurrentDate] = useState(new Date());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(todayStr);

  const handlePrevMonth = () => {
    setCalendarCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getCalendarDays = () => {
    const year = calendarCurrentDate.getFullYear();
    const month = calendarCurrentDate.getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();
    
    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];
    
    // Previous month leading days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevTotalDays - i);
      days.push({
        dateStr: getLocalDateString(prevDate),
        dayNum: prevTotalDays - i,
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const currDate = new Date(year, month, i);
      days.push({
        dateStr: getLocalDateString(currDate),
        dayNum: i,
        isCurrentMonth: true
      });
    }
    
    // Next month trailing days to fill the grid (multiple of 7, up to 42)
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        dateStr: getLocalDateString(nextDate),
        dayNum: i,
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  // Stats calculation
  let todayRevenue = 0;
  let weekRevenue = 0;
  let monthRevenue = 0;
  let totalRevenue = 0;
  let todaysAptCount = 0;

  const revenueByDay: Record<string, number> = {};
  const serviceCount: Record<string, number> = {};

  // For weekly/monthly ranges
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let cashierTodayRevenue = 0;
  let cashierTodayOrders = 0;

  allBookings.forEach(b => {
    const amt = Number(b.amount) || 0;
    const dateStr = b.booking_date; // YYYY-MM-DD
    if (!dateStr) return; // Skip entries without a valid date

    const createdAt = b.created_at ? b.created_at.split('T')[0] : null;
    const bookingDate = new Date(dateStr);
    
    // Only count CONFIRMED bookings in Finance calculations (today, week, month, total, cashier, and daily chart)
    if (b.status === 'confirmed') {
      totalRevenue += amt;
      
      // Revenue is counted for "Today" if either it's scheduled for today OR was created/paid today
      if (dateStr === todayStr || createdAt === todayStr) {
        todayRevenue += amt;
      }

      if (b.customer_id === user?.id && (dateStr === todayStr || createdAt === todayStr)) {
        cashierTodayRevenue += amt;
        cashierTodayOrders++;
      }
      
      if (bookingDate >= startOfWeek) weekRevenue += amt;
      if (bookingDate >= startOfMonth) monthRevenue += amt;

      revenueByDay[dateStr] = (revenueByDay[dateStr] || 0) + amt;
    }

    if (dateStr === todayStr) {
      todaysAptCount++;
    }
    
    const srv = b.service || "Other";
    serviceCount[srv] = (serviceCount[srv] || 0) + 1;
  });

  const financeStats = [todayRevenue, weekRevenue, monthRevenue, totalRevenue];

  const revenueData = Object.entries(revenueByDay)
    .filter(([date]) => date && date !== 'null' && !isNaN(new Date(date).getTime()))
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .slice(-7)
    .map(([date, val]) => ({
      name: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
      value: val
    }));

  const pastelColors = ['#C66C7A', '#DEAB20', '#449D71', '#5792BC', '#9A63D4', '#E67E22'];
  const serviceData = Object.entries(serviceCount).map(([name, val], idx) => ({
    name,
    value: val,
    color: pastelColors[idx % pastelColors.length]
  }));

  const uniqueServices = Array.from(new Set(allBookings.map((b: any) => b.service).filter(Boolean))).map(srv => {
    const srvBookings = allBookings.filter(b => b.service === srv);
    return {
      name: srv,
      category: "Online",
      duration: "-",
      price: srvBookings[0]?.amount || 0
    };
  });

  const allClientsRaw = customers.length > 0 ? customers : Array.from(new Set(bookings.filter(b => b.name).map(b => b.name))).map((name, i) => {
    const userBookings = bookings.filter(b => b.name === name);
    const lastBooking = userBookings[0];
    return {
      id: i + 1,
      name: name,
      email: lastBooking?.email || `${name.toLowerCase().replace(/\s/g, '')}@example.com`,
      phone: lastBooking?.phone || "061XXXXXXX",
      visits: userBookings.filter(b => b.status === 'confirmed').length,
      spent: userBookings.filter(b => b.status === 'confirmed').reduce((acc, b) => acc + (Number(b.amount) || 0), 0)
    };
  });

  const filteredClients = query === ""
    ? allClientsRaw
    : allClientsRaw.filter(c =>
        (c.name || "").toLowerCase().includes(query) ||
        (c.phone || "").toLowerCase().includes(query) ||
        (c.email || "").toLowerCase().includes(query)
      );
  
  const allClients = filteredClients;

  return (
    <>
      {/* ─── Hidden Printable Receipt ───────────────────────────────────── */}
      {receiptData && (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-10 text-black font-body antialiased">
          <div className="max-w-[400px] mx-auto bg-white border border-zinc-200 p-8 shadow-sm">
            {/* Minimalist International Header with Official Logo */}
            <div className="flex flex-col items-center mb-12 text-center">
               <div className="w-24 h-24 mb-6">
                  <img src={logo} alt="Logo" className="w-full h-full object-contain" />
               </div>
               <h2 className="text-3xl font-black tracking-tighter text-zinc-900 leading-none">QURUX<span className="text-primary">•</span>DUMAR</h2>
               <p className="text-[8px] font-black uppercase text-zinc-400 tracking-[0.4em] mt-2">Professional Excellence</p>
            </div>

            {/* Business Contacts Section */}
            <div className="grid grid-cols-2 gap-4 mb-10 pb-10 border-b border-zinc-100">
               <div className="space-y-1 text-left">
                  <p className="text-[7px] font-black uppercase text-zinc-400 tracking-widest">Business</p>
                  <p className="text-[10px] font-black text-zinc-900">Qurux - Dumar Salon</p>
                  <p className="text-[9px] font-medium text-zinc-500">+252 61 7643394</p>
               </div>
               <div className="text-right space-y-1">
                  <p className="text-[7px] font-black uppercase text-zinc-400 tracking-widest">Date / Time</p>
                  <p className="text-[9px] font-black text-zinc-900 uppercase">{receiptData.date}</p>
                  <p className="text-[9px] font-medium text-zinc-400 uppercase">{receiptData.time}</p>
                  <p className="text-[7px] font-black uppercase text-zinc-400 tracking-widest mt-1">Method</p>
                  <p className="text-[9px] font-black text-emerald-600 uppercase">{receiptData.paymentMethod || 'Cash'}</p>
               </div>
            </div>

            {/* Customer Details */}
            <div className="mb-10 text-left">
               <p className="text-[7px] font-black uppercase text-zinc-400 tracking-widest mb-2">Billed To</p>
               <h3 className="text-xs font-black text-zinc-900 uppercase">{receiptData.customer_name}</h3>
               {receiptData.customer_phone && <p className="text-[9px] font-bold text-zinc-500 mt-1">{receiptData.customer_phone}</p>}
            </div>

            {/* Itemized Table */}
            <div className="mb-10">
               <div className="flex justify-between items-center pb-2 border-b border-zinc-900 mb-4">
                  <span className="text-[8px] font-black uppercase tracking-widest">Description</span>
                  <span className="text-[8px] font-black uppercase tracking-widest">Amount</span>
               </div>
               <div className="space-y-4">
                  {receiptData.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-baseline">
                       <div className="flex-1 min-w-0 pr-4 text-left">
                          <p className="text-[10px] font-black text-zinc-900 uppercase">{item.name}</p>
                          <p className="text-[8px] font-medium text-zinc-400 mt-0.5">Professional Beauty Service</p>
                       </div>
                       <span className="text-[10px] font-black text-zinc-900">${parseFloat(item.price).toFixed(2)}</span>
                    </div>
                  ))}
               </div>
            </div>

            {/* Summary Grid */}
            <div className="space-y-2 mb-10 pt-4 border-t border-zinc-50">
               <div className="flex justify-between items-center text-[9px] font-bold text-zinc-400">
                  <span className="uppercase">Net Amount</span>
                  <span>${parseFloat(receiptData.total).toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center pt-4 mt-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900">Total Payable</span>
                  <span className="text-2xl font-black text-zinc-900 tracking-tighter">${parseFloat(receiptData.total).toFixed(2)}</span>
               </div>
            </div>

            {/* Simple Final Footer */}
            <div className="mt-8 text-center pt-8 border-t border-dashed border-zinc-100">
               <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Waad ku mahadsantahay booqashadaada</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Application (Hidden during print) ─────────────────────── */}
      <div className="print:hidden min-h-screen bg-[#FAFAFA] flex font-body">
        {/* Sidebar */}
        <aside className={cn(sidebarStyles, sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0", "bg-[#4B0E3D] border-r-0 shadow-[10px_0_40px_rgba(0,0,0,0.1)] z-[60]")}>
        <div className="h-full flex flex-col py-6">
          <div className="px-6 mb-8">
            <Link to="/" className="flex items-center gap-3 group transition-transform active:scale-95">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-lg backdrop-blur-xl shrink-0 group-hover:rotate-12 transition-transform">
                <img src={logo} alt="Logo" className="w-full h-full object-contain p-1.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-sm font-black tracking-tighter text-white leading-none uppercase">{bizName}</h2>
                <p className="font-body text-[6px] text-zinc-400 tracking-[0.4em] font-black uppercase mt-0.5">Management</p>
              </div>
            </Link>
          </div>
 
          <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto custom-scrollbar-light">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-4 py-2 font-body text-[9px] font-black uppercase tracking-widest rounded-xl transition-all group relative",
                  activeTab === item.id
                    ? "bg-white/10 text-white shadow-lg shadow-black/10"
                    : "text-white/40 hover:bg-white/5 hover:text-white"
                )}
              >
                {activeTab === item.id && (
                  <motion.div layoutId="nav-active" className="absolute inset-0 bg-white/10 rounded-xl border-l-[3px] border-white" />
                )}
                <item.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110 relative z-10", activeTab === item.id ? "text-white opacity-100" : "opacity-30")} />
                <span className="relative z-10">{(t as any)[item.id] || item.label}</span>
{item.id === 'rentals' && overdueRentals.length > 0 && (
  <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[8px] font-black">
    {overdueRentals.length}
  </span>
)}
</button>
            ))}
          </nav>
 
          <div className="mt-auto p-4 space-y-4">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-4 px-4 py-2.5 text-white/40 hover:text-white hover:bg-white/5 transition-all group rounded-xl"
            >
              <LogOut className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col max-h-screen overflow-y-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md px-6 py-3 flex items-center justify-between border-b border-zinc-100">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-zinc-400 hover:text-primary p-2 bg-white rounded-lg border border-zinc-100 shadow-sm">
              <Menu className="w-4 h-4" />
            </button>
            <div className="relative max-w-sm w-full hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-100 font-body text-[10px] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/5 focus:border-primary/20 transition-all text-zinc-700"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Premium Language Switcher */}
            <button
              onClick={() => {
                const nextLang = lang === 'en' ? 'so' : 'en';
                setLang(nextLang);
                toast.success(nextLang === 'so' ? "Nidaamka waxaa loo beddelay Soomaali! 🇸🇴" : "System switched to English! 🇬🇧");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-100 hover:bg-zinc-50 hover:border-zinc-200 transition-all font-display text-[9px] font-black uppercase tracking-widest text-[#5D1B54] bg-[#5D1B54]/5 active:scale-95 shadow-sm shrink-0"
              title="Change Language / Luqadda Beddel"
            >
              <span className="text-[11px] leading-none shrink-0">{lang === 'en' ? '🇬🇧' : '🇸🇴'}</span>
              <span>{lang === 'en' ? 'EN' : 'SO'}</span>
            </button>

            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative text-zinc-400 hover:text-primary transition-colors p-2 rounded-lg hover:bg-zinc-50 border border-transparent active:scale-95"
            >
              <Bell className="w-4 h-4" />
              {bookings.filter(b => b.status === 'pending').length > 0 && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 border border-white rounded-full animate-pulse" />
              )}
            </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} 
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-zinc-100 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/50">
                        <h3 className="font-display text-[10px] font-black uppercase tracking-widest text-zinc-900">Recent Bookings</h3>
                        <span className="bg-primary/10 text-primary text-[8px] font-black px-2 py-0.5 rounded-full">{bookings.filter(b => b.status === 'pending').length} Pending</span>
                      </div>
                      <div className="max-h-[350px] overflow-y-auto">
                        {bookings.length === 0 ? (
                          <div className="p-10 text-center space-y-2">
                             <div className="p-3 bg-zinc-50 rounded-full w-fit mx-auto"><Bell className="w-4 h-4 text-zinc-300" /></div>
                             <p className="text-[10px] font-bold text-zinc-400">No new notifications</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-zinc-50">
                            {bookings.slice(0, 5).map((b) => (
                              <button 
                                key={b.id} 
                                onClick={() => { setActiveTab('appointments'); setNotificationsOpen(false); }}
                                className="w-full p-4 flex items-start gap-3 hover:bg-zinc-50 transition-colors text-left"
                              >
                                <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
                                  <Calendar className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-[10px] font-black text-zinc-900 truncate uppercase mt-0.5">{b.name}</p>
                                    <span className="text-[7px] font-bold text-zinc-400 shrink-0">{b.start_time}</span>
                                  </div>
                                  <p className="text-[9px] font-bold text-zinc-400 truncate">{b.service}</p>
                                  <div className="mt-1 flex items-center gap-1.5">
                                    <span className={cn(
                                      "w-1.5 h-1.5 rounded-full",
                                      b.status === 'pending' ? "bg-amber-500" : "bg-emerald-500"
                                    )} />
                                    <span className="text-[7px] font-black uppercase tracking-widest text-zinc-500">{b.status}</span>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => { setActiveTab('appointments'); setNotificationsOpen(false); }}
                        className="w-full p-3 bg-zinc-50 text-[8px] font-black text-zinc-500 uppercase tracking-widest hover:bg-zinc-100 transition-all border-t border-zinc-100"
                      >
                        View All Appointments
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            <div className="flex items-center gap-2 pl-3 border-l border-zinc-100 ml-1">
              <div className="text-right hidden md:block leading-tight">
                <p className="text-[10px] font-bold text-zinc-900 leading-none capitalize">
                  {userProfile?.full_name || userProfile?.name || (isAdmin ? "Admin" : "Staff")}
                </p>
                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mt-0.5">
                  {isAdmin ? "MANAGER" : isCashier ? "CASHIER" : "STAFF"}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-black text-[10px] shadow-md border border-white uppercase">
                {(userProfile?.full_name || userProfile?.name || (isAdmin ? "A" : "S"))[0]}
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 pt-1 flex-1 relative">
          <div key={activeTab}>
            {/* Overview */}
            {activeTab === "overview" && (
              <div className="space-y-5 pb-10">

                {/* ── HERO BANNER ─────────────────────────────────────────── */}
                <div className="relative mx-2 rounded-[28px] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#4B0E3D] via-[#6D1B4B] to-[#2D0827]" />
                  <div className="absolute -top-10 -right-10 w-56 h-56 bg-[#EE2A7B]/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-[#AB92FF]/15 rounded-full blur-2xl pointer-events-none" />
                  <div className="relative z-10 p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">
                        {new Date().toLocaleDateString('en-US', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                      </p>
                      <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                        Welcome back, <span className="text-[#F4B4D4]">{userProfile?.full_name?.split(' ')[0] || (isAdmin ? 'Admin' : 'Staff')}! 👋</span>
                      </h1>
                      <p className="text-[11px] font-medium text-white/50">{bizName} · All systems running smoothly</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 shrink-0">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300">Live · Online</span>
                    </div>
                  </div>
                </div>

                {/* Low Stock Alert */}
                {dbServices.filter(s => s.category === 'Product' && parseInt(s.duration) < 5).length > 0 && (
                  <div className="mx-2 p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-rose-500 text-white rounded-lg"><AlertTriangle className="w-3 h-3" /></div>
                      <div>
                        <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest">Inventory Alert</p>
                        <p className="text-[10px] font-bold text-rose-900 mt-0.5">Some products are running low on stock!</p>
                      </div>
                    </div>
                    <button onClick={() => setActiveTab('products')} className="text-[8px] font-black uppercase tracking-widest text-rose-500 hover:underline">View</button>
                  </div>
                )}

                {/* ── STAT CARDS ─────────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-2">
                  {(isCashier ? [
                    { label: "My Sales Today", value: '$' + cashierTodayRevenue.toLocaleString(), grad: 'from-emerald-500 to-teal-400', bg: 'bg-emerald-50', clr: 'text-emerald-600', icon: DollarSign },
                    { label: 'My Orders', value: cashierTodayOrders, grad: 'from-[#EE2A7B] to-[#C0185E]', bg: 'bg-rose-50', clr: 'text-rose-500', icon: CheckCircle2 },
                  ] : [
                    { label: 'Total Clients', value: allClients.length, grad: 'from-[#EE2A7B] to-[#A0178A]', bg: 'bg-rose-50', clr: 'text-rose-500', icon: Users },
                    { label: 'Total Appointments', value: allBookings.filter(b => b.status === 'confirmed').length, grad: 'from-violet-500 to-purple-400', bg: 'bg-violet-50', clr: 'text-violet-500', icon: Calendar },
                    { label: 'Total Revenue', value: '$' + allBookings.filter(b => b.status === 'confirmed').reduce((acc, b) => acc + (b.amount || 0), 0).toLocaleString(), grad: 'from-emerald-500 to-teal-400', bg: 'bg-emerald-50', clr: 'text-emerald-600', icon: DollarSign },
                    { label: 'Active Rentals', value: dbServices.filter(s => s.category === 'Dress').length, grad: 'from-[#AB92FF] to-indigo-400', bg: 'bg-indigo-50', clr: 'text-indigo-500', icon: Shirt },
                  ]).map((stat, i) => (
                    <div key={i} className="group relative bg-white rounded-[22px] border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 overflow-hidden p-5">
                      <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${stat.grad}`} />
                      <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br ${stat.grad} opacity-[0.07] blur-xl pointer-events-none`} />
                      <div className={`w-11 h-11 ${stat.bg} rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300`}>
                        <stat.icon className={`w-5 h-5 ${stat.clr} stroke-[2px]`} />
                      </div>
                      <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
                      <h3 className="font-display text-[30px] font-black text-zinc-900 tracking-tight leading-none">{stat.value}</h3>
                    </div>
                  ))}
                </div>

                {/* ── QUICK ACTIONS ──────────────────────────────────────── */}
                <div className="px-2">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.25em] mb-3">Quick Actions</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Walk-in Desk', sub: 'Register walk-in client', icon: UserPlus, tab: 'walkin', from: 'from-[#FFF0F6]', border: 'border-rose-100 hover:border-rose-200', bg: 'bg-[#EE2A7B]/10', clr: 'text-[#EE2A7B]', hbg: 'group-hover:bg-[#EE2A7B]/20', glow: 'hover:shadow-[0_8px_30px_rgba(238,42,123,0.12)]', blob: 'bg-[#EE2A7B]/5' },
                      { label: 'POS Billing', sub: 'Sell products & checkout', icon: Store, tab: 'pos', from: 'from-[#F0FFF8]', border: 'border-emerald-100 hover:border-emerald-200', bg: 'bg-emerald-500/10', clr: 'text-emerald-600', hbg: 'group-hover:bg-emerald-500/20', glow: 'hover:shadow-[0_8px_30px_rgba(16,200,113,0.12)]', blob: 'bg-emerald-500/5' },
                      ...(isAdmin ? [
                        { label: 'Products', sub: 'Manage inventory', icon: ShoppingBag, tab: 'products', from: 'from-[#FFFBF0]', border: 'border-amber-100 hover:border-amber-200', bg: 'bg-amber-500/10', clr: 'text-amber-600', hbg: 'group-hover:bg-amber-500/20', glow: 'hover:shadow-[0_8px_30px_rgba(245,158,11,0.12)]', blob: 'bg-amber-500/5' },
                        { label: 'Finance', sub: 'Revenue & Expenses', icon: TrendingUp, tab: 'finance', from: 'from-[#F3F0FF]', border: 'border-indigo-100 hover:border-indigo-200', bg: 'bg-indigo-500/10', clr: 'text-indigo-600', hbg: 'group-hover:bg-indigo-500/20', glow: 'hover:shadow-[0_8px_30px_rgba(99,102,241,0.12)]', blob: 'bg-indigo-500/5' },
                      ] : []),
                    ].map((a, i) => (
                      <button key={i} onClick={() => setActiveTab(a.tab as Tab)}
                        className={`group relative bg-gradient-to-br ${a.from} to-white border ${a.border} p-5 rounded-[20px] flex flex-col gap-3 text-left transition-all ${a.glow} hover:-translate-y-0.5 overflow-hidden`}>
                        <div className={`absolute top-0 right-0 w-20 h-20 ${a.blob} rounded-full -mr-6 -mt-6 pointer-events-none`} />
                        <div className={`w-10 h-10 ${a.bg} ${a.clr} rounded-xl flex items-center justify-center ${a.hbg} transition-colors`}>
                          <a.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-black text-[#5D1B54] uppercase tracking-tight">{a.label}</h4>
                          <p className="text-[9px] font-bold text-zinc-400 mt-0.5">{a.sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── RECENT BOOKINGS FEED ───────────────────────────────── */}
                <div className="mx-2 bg-white rounded-[24px] border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-50">
                    <div>
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-900">Recent Bookings</h3>
                      <p className="text-[9px] font-bold text-zinc-400 mt-0.5 uppercase tracking-widest">Latest system activity</p>
                    </div>
                    <button onClick={() => setActiveTab('appointments')} className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">View All →</button>
                  </div>
                  {allBookings.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">No bookings found</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-50">
                      {allBookings.slice(0, 5).map((b, i) => (
                        <div key={i} className="flex items-center gap-4 px-6 py-3.5 hover:bg-zinc-50/50 transition-colors">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-black text-[11px] uppercase shrink-0">
                            {b.name?.[0] || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black text-zinc-900 truncate uppercase">{b.name}</p>
                            <p className="text-[9px] font-bold text-zinc-400 truncate">{b.service} · {b.booking_date}</p>
                          </div>
                          <div className="text-right shrink-0 space-y-1">
                            <p className="text-[12px] font-black text-zinc-900">${b.amount || 0}</p>
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                              b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' :
                              b.status === 'cancelled' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-600'
                            )}>{b.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Walk-in Registration */}
            {activeTab === "walkin" && (
              <WalkinTab
                user={user}
                allBookings={bookings}
                dbServices={dbServices}
                facialImg={facialImg}
                hairImg={hairImg}
                nailImg={nailImg}
                bodyImg={bodyImg}
                aromaticHenna={aromaticHenna}
                wiName={wiName} setWiName={setWiName}
                wiPhone={wiPhone} setWiPhone={setWiPhone}
                wiCart={wiCart} setWiCart={setWiCart}
                wiSaving={wiSaving} setWiSaving={setWiSaving}
                wiToday={wiToday}
                setReceiptData={setReceiptData} bizName={bizName} bizPhone={bizPhone}
                fetchWalkinToday={fetchWalkinToday}
                fetchBookings={fetchBookings}
                fetchServices={fetchServices}
                getLocalDateString={getLocalDateString}
                supabase={supabase}
                toast={toast}
              />
            )}
            {/* Appointments */}
            {activeTab === "appointments" && (
              <div className="space-y-4 pb-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-2">
                  <div>
                    <h1 className="font-display text-lg font-black tracking-tight text-[#5D1B54] leading-none uppercase">{t.appointments}</h1>
                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">{t.salesHistory}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Beautiful Layout Switcher Toggle */}
                    <div className="bg-zinc-100/80 p-0.5 rounded-xl border border-zinc-200/50 flex items-center shadow-inner mr-1.5 animate-in fade-in zoom-in-95 duration-200">
                      <button
                        onClick={() => setAppointmentsLayout('table')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200",
                          appointmentsLayout === 'table'
                            ? "bg-white text-[#83215D] shadow-sm font-black"
                            : "text-zinc-400 hover:text-zinc-600"
                        )}
                      >
                        Table
                      </button>
                      <button
                        onClick={() => setAppointmentsLayout('cards')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200",
                          appointmentsLayout === 'cards'
                            ? "bg-white text-[#83215D] shadow-sm font-black"
                            : "text-zinc-400 hover:text-zinc-600"
                        )}
                      >
                        Cards
                      </button>
                    </div>

                    <button 
                      onClick={downloadTransactionsCSV}
                      className="flex items-center gap-1.5 bg-white border border-zinc-200 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 transition-all shadow-sm duration-200"
                    >
                      <Download className="w-3 h-3 text-zinc-400" /> Export
                    </button>
                    <button
                      onClick={() => {
                        setFormData({
                          ...formData,
                          date: getLocalDateString()
                        });
                        setModalType("appointment");
                      }}
                      className="bg-gradient-to-r from-[#83215D] to-[#5D1B54] text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 hover:shadow-[0_8px_20px_rgba(131,33,93,0.25)] hover:scale-[1.02] active:scale-95 transition-all duration-200"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3px]" /> Add Booking
                    </button>
                  </div>
                </div>

                {appointmentsLayout === 'table' ? (
                  <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-zinc-150/50 shadow-[0_12px_40px_rgba(93,27,84,0.03)] overflow-hidden transition-all duration-300 animate-in fade-in-30 duration-200">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gradient-to-r from-zinc-50/60 to-zinc-50/20 border-b border-zinc-100">
                            <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#5D1B54]/75">Client</th>
                            <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#5D1B54]/75">Service</th>
                            <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#5D1B54]/75">Date / Time</th>
                            <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#5D1B54]/75">Amount</th>
                            <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#5D1B54]/75">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100/50">
                          {allBookings.length === 0 ? (
                            <tr><td colSpan={5} className="py-24 text-center text-zinc-300 font-bold uppercase tracking-widest bg-white/50 rounded-2xl">No schedule found</td></tr>
                          ) : (
                            allBookings.map((apt) => {
                              const services = (apt.service || "").split(",").map(s => s.trim()).filter(Boolean);
                              return (
                                <tr key={apt.id} className="group bg-white hover:bg-[#5D1B54]/[0.01] transition-all rounded-xl border-b border-zinc-100/40">
                                  <td className="p-4 pl-6 flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-2xl overflow-hidden border border-zinc-100 shadow-[0_4px_12px_rgba(0,0,0,0.03)] group-hover:scale-[1.04] transition-transform duration-200">
                                      {apt.name?.[0] ? (
                                        <div className="w-full h-full bg-gradient-to-br from-[#83215D] to-[#5D1B54] flex items-center justify-center text-white font-black text-sm uppercase">{apt.name[0]}</div>
                                      ) : (
                                        <div className="w-full h-full bg-zinc-100" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-display text-sm font-black text-[#5D1B54] tracking-tight truncate group-hover:text-[#83215D] transition-colors">{apt.name}</div>
                                      <div className="text-[9px] font-bold text-zinc-400 mt-0.5 tracking-wider uppercase">{apt.phone}</div>
                                    </div>
                                  </td>

                                  <td className="p-4">
                                    <div className="flex items-center gap-3">
                                      {apt.image_url && (
                                        <div className="w-11 h-11 rounded-2xl overflow-hidden border border-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] shrink-0">
                                          <img src={apt.image_url} className="w-full h-full object-cover" alt={apt.service} />
                                        </div>
                                      )}
                                      <div className="flex flex-col gap-1.5">
                                        <div className="flex flex-wrap gap-1">
                                          {services.map((srvName, idx) => (
                                            <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#83215D]/[0.06] text-[#83215D] border border-[#83215D]/10 shadow-[0_1px_4px_rgba(131,33,93,0.03)] animate-in fade-in zoom-in-95 duration-200">
                                              {srvName}
                                            </span>
                                          ))}
                                        </div>
                                        {apt.category === 'Online' && (
                                          <span className="w-fit text-[7px] font-black bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded uppercase tracking-[0.2em] border border-sky-200">Online</span>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  <td className="p-4">
                                    <div className="space-y-1">
                                      <div className="font-display text-xs font-black text-zinc-700">{apt.booking_date}</div>
                                      <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-md text-[9px] font-black uppercase tracking-wider">
                                        <Clock className="w-2.5 h-2.5 text-zinc-400" />
                                        <span>{apt.start_time}</span>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="p-4">
                                    <span className="font-display font-black text-[#83215D] text-lg tracking-tight">${apt.amount || 0}</span>
                                  </td>

                                  <td className="p-4 pr-6">
                                    <div className="flex items-center gap-2 w-full justify-end">
                                      {apt.status === "pending" ? (
                                        <div className="flex gap-1.5">
                                          <button
                                            className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md shadow-emerald-500/10 transition-all duration-200"
                                            onClick={(e) => { e.stopPropagation(); updateStatus(apt.id, "confirmed"); }}
                                          >
                                            Confirm
                                          </button>
                                          <button
                                            className="bg-rose-50 hover:bg-rose-100 text-rose-500 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-200"
                                            onClick={(e) => { e.stopPropagation(); updateStatus(apt.id, "cancelled"); }}
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      ) : (
                                        <div className={cn(
                                          "py-1.5 px-4 rounded-xl text-center text-[9px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2 border",
                                          apt.status === "cancelled" 
                                            ? "bg-[#FCE8E6] text-[#C5221F] border-[#FAD2CF]/80 shadow-[0_2px_8px_rgba(197,34,31,0.04)]" 
                                            : "bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]/80 shadow-[0_2px_8px_rgba(19,115,51,0.04)]"
                                        )}>
                                          {apt.status === 'confirmed' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                          {apt.status}
                                        </div>
                                      )}
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); if (confirm('Delete record?')) deleteBooking(apt.id); }} 
                                        className="p-2 text-zinc-350 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all duration-200"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-in fade-in-30 duration-200">
                    {allBookings.length === 0 ? (
                      <div className="col-span-full py-24 text-center text-zinc-300 font-bold uppercase tracking-widest bg-white rounded-3xl border border-zinc-150/50">No schedule found</div>
                    ) : (
                      allBookings.map((apt) => {
                        const services = (apt.service || "").split(",").map(s => s.trim()).filter(Boolean);
                        return (
                          <div key={apt.id} className="group bg-white/90 backdrop-blur-md border border-zinc-150/60 rounded-3xl p-5 shadow-[0_8px_30px_rgba(93,27,84,0.02)] hover:shadow-[0_15px_40px_rgba(93,27,84,0.06)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                            {/* Card Decorative Left Brand Line */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#83215D] to-[#5D1B54] opacity-0 group-hover:opacity-100 transition-opacity" />

                            {/* Top row: Avatar & Client Details + Status Badge */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl overflow-hidden border border-zinc-100 shadow-[0_4px_12px_rgba(0,0,0,0.03)] shrink-0">
                                  {apt.name?.[0] ? (
                                    <div className="w-full h-full bg-gradient-to-br from-[#83215D] to-[#5D1B54] flex items-center justify-center text-white font-black text-sm uppercase">{apt.name[0]}</div>
                                  ) : (
                                    <div className="w-full h-full bg-zinc-100" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-display text-sm font-black text-[#5D1B54] tracking-tight truncate group-hover:text-[#83215D] transition-colors uppercase">{apt.name}</h4>
                                  <p className="text-[9px] font-bold text-zinc-400 tracking-wider uppercase mt-0.5">{apt.phone}</p>
                                </div>
                              </div>

                              {/* Status Badge */}
                              {apt.status !== "pending" ? (
                                <span className={cn(
                                  "py-1 px-3 rounded-full text-[8px] font-black uppercase tracking-wider border",
                                  apt.status === "cancelled" 
                                    ? "bg-[#FCE8E6] text-[#C5221F] border-[#FAD2CF]/80 shadow-[0_2px_8px_rgba(197,34,31,0.04)]" 
                                    : "bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]/80 shadow-[0_2px_8px_rgba(19,115,51,0.04)]"
                                )}>
                                  {apt.status}
                                </span>
                              ) : (
                                <span className="py-1 px-3 rounded-full text-[8px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200/60 shadow-[0_2px_8px_rgba(245,158,11,0.04)]">
                                  Pending
                                </span>
                              )}
                            </div>

                            {/* Middle row: Service Image & List */}
                            <div className="my-4 flex items-center gap-3">
                              {apt.image_url ? (
                                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] shrink-0 group-hover:scale-105 transition-transform duration-300">
                                  <img src={apt.image_url} className="w-full h-full object-cover" alt={apt.service} />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
                                  <Sparkles className="w-5 h-5 opacity-40" />
                                </div>
                              )}
                              <div className="flex flex-col gap-1">
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {services.map((srvName, idx) => (
                                    <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-[#83215D]/[0.06] text-[#83215D] border border-[#83215D]/10">
                                      {srvName}
                                    </span>
                                  ))}
                                </div>
                                {apt.category === 'Online' && (
                                  <span className="w-fit text-[6px] font-black bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded uppercase tracking-wider border border-sky-200">Online</span>
                                )}
                                {(() => {
                                  let payMethod = "";
                                  if (apt.notes && apt.notes.includes("Payment Method:")) {
                                    const match = apt.notes.match(/Payment Method:\s*([^\n]+)/);
                                    if (match) payMethod = match[1].trim();
                                  }
                                  if (payMethod) {
                                    return <span className="w-fit text-[6px] font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded uppercase tracking-wider border border-emerald-200">{payMethod}</span>;
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>

                            {/* Bottom row: Time badge & Price + Actions Overlay */}
                            <div className="flex items-center justify-between border-t border-zinc-100/60 pt-3.5 mt-auto">
                              <div className="space-y-0.5">
                                <div className="font-display text-[10px] font-black text-zinc-400 uppercase tracking-wider">{apt.booking_date}</div>
                                <div className="flex items-center gap-1 text-[#83215D] font-black text-[9px] uppercase tracking-wider">
                                  <Clock className="w-3 h-3 text-[#83215D]/70" />
                                  <span>{apt.start_time}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="font-display font-black text-[#83215D] text-xl tracking-tight">${apt.amount || 0}</span>
                                
                                {/* Hoverable/Always-on elegant actions */}
                                <div className="flex items-center gap-1">
                                  {apt.status === "pending" && (
                                    <>
                                      <button
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md transition-all active:scale-95 duration-200"
                                        onClick={(e) => { e.stopPropagation(); updateStatus(apt.id, "confirmed"); }}
                                        title="Confirm"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        className="bg-rose-50 hover:bg-rose-100 text-rose-500 p-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-200"
                                        onClick={(e) => { e.stopPropagation(); updateStatus(apt.id, "cancelled"); }}
                                        title="Cancel"
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); if (confirm('Delete record?')) deleteBooking(apt.id); }} 
                                    className="p-1.5 text-zinc-350 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all duration-200"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Dedicated Calendar Section */}
            {activeTab === "calendar" && (
              <div className="space-y-6 pb-10 text-left animate-in fade-in-30 duration-200">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-2">
                  <div className="space-y-0.5">
                    <h1 className="font-display text-lg font-black tracking-tight text-[#5D1B54] leading-none uppercase">Kalandarka Ballamaha (Calendar)</h1>
                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Maamul oo u kuurgal dhammaan ballamaha ku qoran kalandarka</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setFormData({
                          ...formData,
                          date: calendarSelectedDate
                        });
                        setModalType("appointment");
                      }}
                      className="bg-primary text-white px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 hover:bg-primary/90 active:scale-95 transition-all shadow-md shadow-primary/20 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3px]" /> Ku dar Ballan (Add Booking)
                    </button>
                  </div>
                </div>

                {/* Custom Interactive Monthly Calendar */}
                <div className="grid lg:grid-cols-12 gap-6 items-start text-left">
                  {/* Left Column: Interactive Month Grid */}
                  <div className="lg:col-span-8 bg-white border border-zinc-100 rounded-3xl shadow-sm p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-zinc-50 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 leading-none">
                            {calendarCurrentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </h2>
                          <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Guji maalin si aad u aragto ballamaha ku qoran</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={handlePrevMonth}
                          className="p-2 text-zinc-400 hover:text-primary hover:bg-zinc-50 rounded-lg transition-colors border border-zinc-200/50"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setCalendarCurrentDate(new Date())}
                          className="px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-zinc-500 hover:text-primary hover:bg-zinc-50 rounded-lg transition-colors border border-zinc-200/50"
                        >
                          Maanta (Today)
                        </button>
                        <button 
                          onClick={handleNextMonth}
                          className="p-2 text-zinc-400 hover:text-primary hover:bg-zinc-50 rounded-lg transition-colors border border-zinc-200/50"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Day of Week Headers */}
                    <div className="grid grid-cols-7 gap-2 text-center">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                        <div key={i} className="text-[9px] font-black uppercase tracking-widest text-zinc-400 py-1">{d}</div>
                      ))}
                    </div>

                    {/* Grid Cells */}
                    <div className="grid grid-cols-7 gap-2">
                      {getCalendarDays().map((cell, idx) => {
                        const isSelected = cell.dateStr === calendarSelectedDate;
                        const isToday = cell.dateStr === todayStr;
                        const dayBookings = allBookings.filter(b => b.booking_date === cell.dateStr);
                        const hasBookings = dayBookings.length > 0;
                        
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCalendarSelectedDate(cell.dateStr)}
                            className={cn(
                              "aspect-square rounded-2xl border flex flex-col items-center justify-between p-2 transition-all relative group",
                              cell.isCurrentMonth ? "bg-white" : "bg-zinc-50/50 border-transparent text-zinc-300",
                              isSelected 
                                ? "border-primary bg-primary/5 shadow-sm shadow-primary/5 ring-1 ring-primary" 
                                : "border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50/30",
                              isToday && !isSelected && "border-zinc-400 font-extrabold"
                            )}
                          >
                            {/* Day number */}
                            <span className={cn(
                              "text-xs font-black self-start",
                              isSelected ? "text-primary" : "text-zinc-800",
                              !cell.isCurrentMonth && "text-zinc-300"
                            )}>
                              {cell.dayNum}
                            </span>

                            {/* Bookings badge / count indicator */}
                            {hasBookings && (
                              <div className="w-full flex items-center justify-center gap-0.5 mt-auto">
                                <span className={cn(
                                  "text-[7px] font-black px-1.5 py-0.5 rounded-full",
                                  isSelected ? "bg-primary text-white" : "bg-primary/10 text-primary"
                                )}>
                                  {dayBookings.length}
                                </span>
                              </div>
                            )}
                            
                            {/* Red dot if today */}
                            {isToday && !isSelected && (
                              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Day Agenda */}
                  <div className="lg:col-span-4 bg-white border border-zinc-100 rounded-3xl shadow-sm p-6 space-y-6">
                    <div className="border-b border-zinc-50 pb-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">Ajendaha Maalinta (Day Agenda)</h3>
                      <p className="text-[10px] font-black text-primary uppercase mt-1">
                        {new Date(calendarSelectedDate + "T12:00:00").toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                      {allBookings.filter(b => b.booking_date === calendarSelectedDate).length === 0 ? (
                        <div className="py-12 text-center space-y-3 bg-[#FAFAFA] rounded-2xl border border-dashed border-zinc-200">
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Ma jiraan ballamo qoran</p>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                date: calendarSelectedDate
                              });
                              setModalType("appointment");
                            }}
                            className="mx-auto bg-primary text-white px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-primary/95 active:scale-95 transition-all"
                          >
                            Ku dar Ballan
                          </button>
                        </div>
                      ) : (
                        allBookings
                          .filter(b => b.booking_date === calendarSelectedDate)
                          .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""))
                          .map((apt) => (
                            <div key={apt.id} className="p-3 bg-zinc-50/50 hover:bg-zinc-50 border border-zinc-100 rounded-2xl flex flex-col gap-2 transition-all relative">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="text-xs font-black text-[#5D1B54] uppercase tracking-tight">{apt.name}</h4>
                                  <p className="text-[8px] font-semibold text-zinc-400 uppercase tracking-widest mt-0.5">{apt.phone}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className={cn(
                                    "text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-[0.15em] border",
                                    apt.status === "confirmed" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                    apt.status === "cancelled" ? "bg-rose-50 text-rose-500 border-rose-100" :
                                    "bg-amber-50 text-amber-600 border-amber-100"
                                  )}>
                                    {apt.status}
                                  </span>
                                  {(() => {
                                    let payMethod = "";
                                    if (apt.notes && apt.notes.includes("Payment Method:")) {
                                      const match = apt.notes.match(/Payment Method:\s*([^\n]+)/);
                                      if (match) payMethod = match[1].trim();
                                    }
                                    if (payMethod) {
                                      return <span className="text-[6.5px] font-black px-1.5 py-0.5 rounded uppercase tracking-[0.15em] border border-zinc-200 bg-white text-zinc-500">{payMethod}</span>;
                                    }
                                    return null;
                                  })()}
                                </div>
                              </div>

                              <div className="flex items-center justify-between border-t border-zinc-100/50 pt-2 mt-1">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[8px] font-black text-primary uppercase tracking-widest italic">{apt.service}</span>
                                  <div className="flex items-center gap-1 text-[8px] text-zinc-400 font-bold mt-0.5">
                                    <Clock className="w-2.5 h-2.5 text-zinc-300" />
                                    {apt.start_time} - {apt.end_time}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {apt.status === "pending" && (
                                    <button 
                                      type="button"
                                      onClick={() => updateStatus(apt.id, "confirmed")}
                                      className="bg-emerald-50 text-emerald-600 p-1 rounded hover:bg-emerald-100 transition-colors"
                                      title="Confirm"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                  )}
                                  <button 
                                    type="button"
                                    onClick={() => { if (confirm('Delete record?')) deleteBooking(apt.id); }}
                                    className="p-1 text-zinc-300 hover:text-rose-500 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Finance Section */}
            {activeTab === "finance" && (
              <div className="space-y-4 pb-10 text-left">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-2">
                  <div className="space-y-0.5">
                    <h1 className="font-display text-xl font-black text-zinc-900 leading-none">{t.finance}</h1>
                    <div className="flex items-center gap-3 mt-2">
                       {(isAdmin || isCashier) && (
                         <button 
                           onClick={() => setFinanceTab('sales')}
                           className={cn("text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all", financeTab === 'sales' ? "border-primary text-primary" : "border-transparent text-zinc-400")}
                         >
                           Sales
                         </button>
                       )}
                       <button 
                         onClick={() => setFinanceTab('expenses')}
                         className={cn("text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all", financeTab === 'expenses' ? "border-primary text-primary" : "border-transparent text-zinc-400")}
                       >
                         Expenses
                       </button>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                        if (financeTab === 'sales') setModalType('payment');
                        else setModalType('expense');
                    }} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-[9px] flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    <Plus className="w-3 h-3 stroke-[3px]" /> {financeTab === 'sales' ? t.newSale : 'Add Expense'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 px-2">
                  {[
                    ...(isAdmin || isCashier ? [
                      { label: 'Revenue', value: financeStats[3], color: 'text-emerald-600', bg: 'bg-emerald-50', icon: DollarSign },
                    ] : []),
                    { label: 'Total Expenses', value: expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0), color: 'text-rose-600', bg: 'bg-rose-50', icon: TrendingUp },
                    ...(isAdmin || isCashier ? [
                      { label: 'Net Profit', value: financeStats[3] - expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0), color: 'text-zinc-900', bg: 'bg-zinc-100', icon: Sparkles },
                    ] : []),
                    ...(isAdmin || isCashier ? [
                      { label: 'Monthly Revenue', value: financeStats[2], color: 'text-indigo-600', bg: 'bg-indigo-50', icon: Calendar },
                    ] : []),
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white p-4 rounded-xl border border-zinc-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", stat.bg)}>
                          <stat.icon className={cn("w-3 h-3", stat.color)} />
                        </div>
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{stat.label}</p>
                      </div>
                      <h3 className={cn("text-lg font-black tracking-tight", stat.color)}>${stat.value.toLocaleString()}</h3>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden mx-2">
                  <div className="p-4 border-b border-zinc-50 bg-zinc-50/30 flex flex-wrap items-center justify-between gap-3 text-left">
                    <div>
                      <h3 className="font-display font-bold text-[9px] uppercase tracking-widest text-zinc-400">
                        {financeTab === 'sales' ? 'Sales Data' : 'Expenses Data'}
                      </h3>
                      {/* Finance date filter */}
                      <div className="flex items-center gap-2 mt-2">
                        {(['all','today','month'] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => setFinanceDateFilter(f)}
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all",
                              financeDateFilter === f
                                ? "bg-primary text-white border-primary"
                                : "bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300"
                            )}
                          >
                            {f === 'all' ? 'All' : f === 'today' ? 'Today' : 'This Month'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <CreditCard className="w-3 h-3 text-zinc-200" />
                  </div>
                  <div className="overflow-x-auto">
                    {financeTab === 'sales' ? (
                        <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white border-b border-zinc-50">
                            <th className="p-3 text-[8px] font-black uppercase tracking-widest text-zinc-400">Customer</th>
                            <th className="p-3 text-[8px] font-black uppercase tracking-widest text-zinc-400">Service</th>
                            <th className="p-3 text-[8px] font-black uppercase tracking-widest text-zinc-400 text-center">Date</th>
                            <th className="p-3 text-[8px] font-black uppercase tracking-widest text-zinc-400 text-right">Amount</th>
                            <th className="p-3 text-[8px] font-black uppercase tracking-widest text-zinc-400 text-center">Payment</th>
                            <th className="p-3 text-[8px] font-black uppercase tracking-widest text-zinc-400 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                              const fm = new Date();
                              const fmStr = `${fm.getFullYear()}-${String(fm.getMonth()+1).padStart(2,'0')}`;
                              return allBookings
                                .filter(b => b.status === 'confirmed')
                                .filter(b => {
                                  if (financeDateFilter === 'today') return b.booking_date === todayStr;
                                  if (financeDateFilter === 'month') return (b.booking_date||'').startsWith(fmStr);
                                  return true;
                                })
                                .slice(0, 20)
                                .map((b, i) => (
                            <tr key={i} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors">
                                <td className="p-3">
                                <p className="text-[10px] font-bold text-zinc-900">{b.name}</p>
                                <p className="text-[8px] text-zinc-400">{b.phone}</p>
                                </td>
                                <td className="p-3">
                                <div className="flex items-center gap-2">
                                    {b.image_url && (
                                    <div className="w-6 h-6 rounded-md overflow-hidden border border-zinc-100 shrink-0">
                                        <img src={b.image_url} className="w-full h-full object-cover" alt={b.service} />
                                    </div>
                                    )}
                                    <div className="flex flex-col gap-1 min-w-0">
                                    <span className="text-[9px] font-bold px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-md truncate max-w-[100px]">{b.service}</span>
                                    {b.category === 'Online' && (
                                        <span className="w-fit text-[6px] font-black bg-sky-50 text-sky-500 px-1 py-0.5 rounded uppercase tracking-[0.2em]">Online</span>
                                    )}
                                    </div>
                                </div>
                                </td>
                                <td className="p-3 text-[9px] text-zinc-400 text-center font-medium">{b.booking_date}</td>
                                <td className="p-3 text-right font-black text-[10px] text-zinc-900">${b.amount || 0}</td>
                                <td className="p-3 text-center">
                                  {(() => {
                                    let payMethod = "Cash";
                                    if (b.notes && b.notes.includes("Payment Method:")) {
                                      const match = b.notes.match(/Payment Method:\s*([^\n]+)/);
                                      if (match) payMethod = match[1].trim();
                                    }
                                    return <span className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-md border border-zinc-200">{payMethod}</span>;
                                  })()}
                                </td>
                                <td className="p-3 text-center">
                                <span className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Paid</span>
                                </td>
                            </tr>
                            ));
                            })()}
                        </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white border-b border-zinc-50">
                            <th className="p-3 text-[8px] font-black uppercase tracking-widest text-zinc-400">Title</th>
                            <th className="p-3 text-[8px] font-black uppercase tracking-widest text-zinc-400">Category</th>
                            <th className="p-3 text-[8px] font-black uppercase tracking-widest text-zinc-400 text-center">Date</th>
                            <th className="p-3 text-[8px] font-black uppercase tracking-widest text-zinc-400 text-right">Amount</th>
                            <th className="p-3 text-[8px] font-black uppercase tracking-widest text-zinc-400 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                              const fe = new Date();
                              const feStr = `${fe.getFullYear()}-${String(fe.getMonth()+1).padStart(2,'0')}`;
                              const filteredExp = expenses.filter(e => {
                                // Match date filter
                                let dateMatch = true;
                                if (financeDateFilter === 'today') dateMatch = e.date === todayStr;
                                if (financeDateFilter === 'month') dateMatch = (e.date||'').startsWith(feStr);
                                
                                // Match search query
                                let searchMatch = true;
                                if (query) {
                                  searchMatch = (e.title || "").toLowerCase().includes(query) ||
                                                (e.amount?.toString() || "").includes(query);
                                }
                                
                                return dateMatch && searchMatch;
                              });
                              return filteredExp.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-10 text-center text-zinc-400 text-[10px] font-bold uppercase tracking-widest">No expenses recorded ({financeDateFilter === 'today' ? 'Today' : financeDateFilter === 'month' ? 'This Month' : 'All Time'})</td>
                                </tr>
                              ) : filteredExp.map((e, i) => (
                            <tr key={i} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors">
                                <td className="p-3 text-[10px] font-bold text-zinc-900">{e.title}</td>
                                <td className="p-3 text-[9px] font-black text-zinc-400 uppercase">{e.category}</td>
                                <td className="p-3 text-[9px] text-zinc-400 text-center">{e.date}</td>
                                <td className="p-3 text-right font-black text-[10px] text-rose-600">-${e.amount}</td>
                                <td className="p-3 text-center">
                                    <button onClick={() => { if(confirm('Delete?')) (supabase as any).from('expenses').delete().eq('id', e.id).then(() => fetchExpenses()) }} className="text-zinc-300 hover:text-rose-500"><Trash2 className="w-3 h-3" /></button>
                                </td>
                            </tr>
                            ));
                            })()}
                        </tbody>
                        </table>
                    )}
                  </div>
                </div>
              </div>
            )}


            {/* Jobs Section */}
            {activeTab === "jobs" && (
              <div className="space-y-6 pb-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-2">
                  <div className="space-y-0.5 text-left">
                    <h1 className="font-display text-xl font-black text-zinc-900 leading-none">Salon Services</h1>
                    <p className="font-body text-zinc-400 font-medium text-[9px]">Manage treatments and pricing</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleSeedDefaults} 
                      className="bg-amber-500/10 text-amber-600 border border-amber-100 px-4 py-2 rounded-lg font-body text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-amber-500/20 transition-all active:scale-95"
                    >
                      <Sparkles className="w-3 h-3" /> Seed Defaults
                    </button>
                    <button onClick={() => setModalType('service')} className="bg-primary text-white px-4 py-2 rounded-lg font-body text-[9px] flex items-center gap-1.5 hover:bg-primary/90 transition-all shadow-md active:scale-95">
                      <Plus className="w-3 h-3" /> Add Service
                    </button>
                  </div>
                </div>

                <div className={cardStyles}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-zinc-100 bg-zinc-50/50">
                          <th className="text-left p-4 text-[8px] font-black uppercase tracking-widest text-zinc-400">Service Details</th>
                          <th className="text-left p-4 text-[8px] font-black uppercase tracking-widest text-zinc-400 text-center">Duration</th>
                          <th className="text-left p-4 text-[8px] font-black uppercase tracking-widest text-zinc-400 text-right">Price</th>
                          <th className="text-center p-4 text-[8px] font-black uppercase tracking-widest text-zinc-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredServices.filter(s => s.category !== 'Dress' && s.category !== 'Product').length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-10 text-center">
                              <div className="flex flex-col items-center justify-center gap-2">
                                <div className="p-4 bg-rose-50 rounded-full"><Scissors className="w-6 h-6 text-rose-200" /></div>
                                <p className="text-sm text-zinc-900 font-black font-display uppercase tracking-tight">No Services</p>
                              </div>
                            </td>
                          </tr>
                        ) : filteredServices.filter(s => s.category !== 'Dress' && s.category !== 'Product').map((serv, i) => (
                          <tr key={i} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors group">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                {serv.image_url ? (
                                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-zinc-100 shadow-sm shrink-0">
                                    <img src={serv.image_url} alt={serv.name} className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                                    <Scissors className="w-4 h-4 text-zinc-300" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-display font-bold text-[10px] text-zinc-900 uppercase tracking-tight">{serv.name}</p>
                                  <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">{serv.category || 'General'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-100 rounded-full text-[8px] font-black uppercase tracking-widest text-zinc-500">
                                <Clock className="w-2 h-2" /> {serv.duration || "30m"}
                              </span>
                            </td>
                            <td className="p-4 text-right font-display font-black text-emerald-600 text-xs">${serv.price}</td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-0.5">
                                <button onClick={() => openEditService(serv, false)} className="p-2 text-zinc-300 hover:text-primary rounded-lg transition-all"><Edit className="w-3 h-3" /></button>
                                <button onClick={() => deleteService(serv.id)} className="p-2 text-rose-300 hover:text-rose-600 rounded-lg transition-all"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Rentals */}
            {activeTab === "rentals" && (
              <div className="space-y-6 pb-10 text-left px-2">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-100/50 pb-5">
                  <div>
                    <h1 className="font-display text-2xl font-black text-zinc-900 leading-none tracking-tight">Dress Rentals</h1>
                    <p className="font-body text-zinc-400 font-medium text-[10px] uppercase tracking-wider mt-1.5">Collection management center</p>
                  </div>
                  <button 
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ name: "", phone: "", service: "", selectedServices: [], date: "", time: "", amount: "", description: "", duration: "", image: "", color: "", size: "", weight_kg: "", height_cm: "", serviceId: "", email: "", password: "" });
                      setModalType('rental');
                    }} 
                    className="bg-[#5D1B54] text-white px-5 py-2.5 rounded-xl font-body text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#5D1B54]/95 transition-all shadow-lg shadow-[#5D1B54]/20 active:scale-95 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3px]" /> Add Dress
                  </button>
                </div>

                {filteredServices.filter(s => s.category === 'Dress').length === 0 ? (
                    <div className="bg-white border border-zinc-100 rounded-3xl p-16 text-center space-y-4 shadow-sm">
<div className="w-16 h-16 bg-[#5D1B54]/5 rounded-full flex items-center justify-center mx-auto text-[#5D1B54]">
                      <Shirt className="w-6 h-6 stroke-[1.5px]" />
                    </div>
                    <div>
                      <h3 className="font-display font-black text-sm text-zinc-950 uppercase tracking-widest">No Dresses in Collection</h3>
                      <p className="text-[10px] font-medium text-zinc-400 mt-1 uppercase tracking-wide">Start building your premium rental collection today.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredServices.filter(s => s.category === 'Dress').map((dress, i) => (
                      <div 
                        key={i} 
                        className="group bg-white rounded-3xl border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-500 hover:-translate-y-1.5 flex flex-col relative"
                      >
                        {/* Premium Image Header with overlays */}
                        <div className="aspect-[4/5] bg-zinc-50 relative overflow-hidden shrink-0">
                          {dress.image_url ? (
                            <img 
                              src={dress.image_url} 
                              alt={dress.name} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300">
                              <Box className="w-12 h-12 stroke-[1px]" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

                          {/* Quick Actions Floating */}
                          <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                            <button 
                              onClick={() => openEditService(dress, true)} 
                              className="p-2 bg-white/95 backdrop-blur-md text-zinc-700 hover:text-[#5D1B54] rounded-xl transition-all shadow-md active:scale-90"
                              title="Edit Dress"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => deleteService(dress.id)} 
                              className="p-2 bg-white/95 backdrop-blur-md text-rose-500 hover:bg-rose-50 rounded-xl transition-all shadow-md active:scale-90"
                              title="Delete Dress"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Price Tag Overlay */}
                          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between z-10">
                            <div>
                              <span className="text-[7px] font-black tracking-widest text-white/60 uppercase block mb-0.5">RENTAL PRICE</span>
                              <span className="text-xl font-display font-black text-white leading-none tracking-tight">${dress.price} <span className="text-[9px] font-medium text-white/70">/ Day</span></span>
                            </div>
                            <span className="px-2.5 py-1 bg-emerald-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                              Available
                            </span>
                          </div>
                        </div>

                        {/* Details Area */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-display font-black text-xs text-zinc-950 uppercase tracking-tight truncate leading-none">
                              {dress.name}
                            </h3>
                            <p className="text-[9px] font-medium text-zinc-400 mt-2 uppercase tracking-wide leading-relaxed line-clamp-2">
                              {dress.description || "Premium high-quality formal gown from our exclusive collection."}
                            </p>
                          </div>

                          {/* Spec badges grid */}
                          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-zinc-50">
                            <div className="bg-zinc-50 border border-zinc-100 p-2 rounded-xl text-center">
                              <span className="text-[6.5px] font-black text-zinc-400 uppercase tracking-widest block">COLOR</span>
                              <span className="text-[9px] font-black text-zinc-800 uppercase tracking-tight block mt-0.5">{dress.color || 'Royal Gold'}</span>
                            </div>
                            <div className="bg-zinc-50 border border-zinc-100 p-2 rounded-xl text-center">
                              <span className="text-[6.5px] font-black text-zinc-400 uppercase tracking-widest block">SIZE</span>
                              <span className="text-[9px] font-black text-zinc-800 uppercase tracking-tight block mt-0.5">{dress.size || 'M / L'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Clients */}
            {activeTab === "clients" && (
              <div className="space-y-6 pb-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-2">
                  <div>
                    <h1 className="font-display text-xl tracking-tight text-charcoal mb-0.5 font-black">Clients</h1>
                    <p className="text-zinc-400 font-body text-[9px]">List of your clients</p>
                  </div>
                  <button
                    onClick={() => setModalType("client")}
                    className="bg-primary text-white px-4 py-2 rounded-lg font-body text-[9px] flex items-center gap-1.5 hover:bg-primary/90 transition-all shadow-md active:scale-95"
                  >
                    <Plus className="w-3 h-3" /> Add Client
                  </button>
                </div>

                <div className={cardStyles}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 bg-[#FAFAFA]">
                          <th className="text-left p-4 font-body text-[8px] text-primary font-semibold uppercase tracking-wider">Client</th>
                          <th className="text-left p-4 font-body text-[8px] text-primary font-semibold uppercase tracking-wider">Contact</th>
                          <th className="text-center p-4 font-body text-[8px] text-primary font-semibold uppercase tracking-wider">Visits</th>
                          <th className="text-center p-4 font-body text-[8px] text-primary font-semibold uppercase tracking-wider">Loyalty Points</th>
                          <th className="text-right p-4 font-body text-[8px] text-primary font-semibold uppercase tracking-wider">Revenue</th>
                          <th className="text-center p-4 font-body text-[8px] text-primary font-semibold uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allClients.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-10 text-center text-primary/60 font-body text-[10px]">No clients found.</td>
                          </tr>
                        ) : (
                          allClients.map((client) => (
                            <tr key={client.id} className="border-b border-gray-50 last:border-0 hover:bg-primary/[0.02] transition-colors group">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-[10px] shadow-sm">
                                    {client.name[0]}
                                  </div>
                                  <div className="font-body text-[10px] font-semibold text-charcoal">{client.name}</div>
                                </div>
                              </td>
                              <td className="p-4 space-y-0.5">
                                <div className="font-body text-[8px] text-charcoal">{client.email}</div>
                                <div className="font-body text-[8px] text-primary/60">{client.phone}</div>
                              </td>
                              <td className="p-4 text-center">
                                <span className="bg-[#FAFAFA] border border-gray-100 px-3 py-0.5 rounded-full text-[9px] font-bold text-charcoal">{client.visits}</span>
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-black text-amber-500">{(client.spent ? Math.floor(client.spent / 10) : 0)} pts</span>
                                    <span className="text-[6px] font-bold text-zinc-400 uppercase">Loyalty</span>
                                </div>
                              </td>
                              <td className="p-4 text-right font-bold text-primary text-[10px]">${client.spent || 0}</td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-0.5">
                                  <button onClick={() => openEditClient(client)} className="p-2 text-zinc-400 hover:text-primary transition-colors"><Edit className="w-3 h-3" /></button>
                                  <button onClick={() => deleteCustomer(client.id)} className="p-2 text-zinc-400 hover:text-rose-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Staff Management Tab */}
            {activeTab === "staff" && (
              <div className="space-y-6 pb-10">
                <div className="px-2">
                  <h1 className="font-display text-xl font-black text-zinc-900 leading-none">Staff</h1>
                  <p className="font-body text-zinc-400 font-medium text-[9px] mt-0.5">Manage salon staff</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <div className="h-px flex-1 bg-zinc-100 mr-4" />
                    <button onClick={() => setModalType('staff')} className="bg-primary text-white px-4 py-2 rounded-lg font-body text-[9px] flex items-center gap-1.5 hover:bg-primary/90 transition-all shadow-md shrink-0">
                      <Plus className="w-3 h-3" /> Add Staff
                    </button>
                  </div>

                  <div className={cardStyles}>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-zinc-100 bg-zinc-50/50">
                            <th className="text-left p-4 text-[8px] font-black uppercase tracking-widest text-zinc-400">Staff Member</th>
                            <th className="text-left p-4 text-[8px] font-black uppercase tracking-widest text-zinc-400">Role</th>
                            <th className="text-center p-4 text-[8px] font-black uppercase tracking-widest text-zinc-400">Jobs</th>
                            <th className="text-right p-4 text-[8px] font-black uppercase tracking-widest text-zinc-400">Approx Earnings</th>
                            <th className="text-center p-4 text-[8px] font-black uppercase tracking-widest text-zinc-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStaff.length === 0 ? (
                            <tr><td colSpan={5} className="p-10 text-center text-[10px] text-zinc-400">No staff found.</td></tr>
                          ) : filteredStaff.map((s, i) => (
                            <tr key={i} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors group">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-zinc-100 rounded-lg overflow-hidden shadow-sm flex items-center justify-center font-display font-black text-primary text-[10px] uppercase">
                                    {s.avatar_url ? <img src={s.avatar_url} className="w-full h-full object-cover" /> : ((s.full_name || s.name)?.[0] || 'S')}
                                  </div>
                                  <p className="font-display font-bold text-[10px] text-zinc-900 uppercase">{s.full_name || s.name || 'Staff'}</p>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-[9px] font-bold",
                                  s.role === 'Admin' ? "bg-zinc-100 text-zinc-600" : "bg-primary/5 text-primary"
                                )}>
                                  {s.role || 'Stylist'}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <span className="text-[10px] font-black text-zinc-900">
                                    {allBookings.filter(b => b.notes?.includes(s.name || s.full_name || '') || b.service?.includes(s.name || s.full_name || '')).length}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <p className="text-[10px] font-black text-emerald-600">
                                    ${(allBookings.filter(b => b.notes?.includes(s.name || s.full_name || '') || b.service?.includes(s.name || s.full_name || '')).reduce((sum, b) => sum + (b.amount || 0), 0) * 0.3).toFixed(2)}
                                </p>
                                <p className="text-[7px] font-bold text-zinc-400 uppercase">30% Comm.</p>
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-0.5">
                                  <button onClick={() => openEditStaff(s)} className="p-2 text-zinc-300 hover:text-primary transition-all"><Edit className="w-3 h-3" /></button>
                                  <button onClick={() => deleteStaff(s.id)} className="p-2 text-rose-300 hover:text-rose-600 transition-all"><Trash2 className="w-3 h-3" /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-6 pb-12 px-2 max-w-[1200px] mx-auto text-left">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-100 pb-5">
                  <div>
                    <h1 className="font-display text-2xl font-black text-zinc-950 tracking-tight">Settings</h1>
                    <p className="font-body text-zinc-400 font-medium text-[11px] mt-1 tracking-wide">Manage your salon preferences and system configuration</p>
                  </div>
                  
                  {settingsSubTab === 'grid' ? (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-zinc-100 bg-white shadow-sm">
                        <ShieldCheck className="w-4 h-4 text-rose-500 stroke-[2.5px]" />
                        <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">System Secure</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
                      </div>
                      <button className="bg-rose-400 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2 shadow-md shadow-rose-400/20 active:scale-95">
                        <CheckCircle2 className="w-4 h-4" />
                        Save Changes
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setSettingsSubTab('grid')}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-800 hover:bg-zinc-50 transition-colors shadow-sm"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Back to Settings Grid
                    </button>
                  )}
                </div>

                {settingsSubTab === 'grid' ? (
                  <div className="animate-in fade-in-30 slide-in-from-bottom-4 duration-500 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {[
                        { id: 'business', title: 'Salon Profile', desc: 'Update salon identity, contact info, opening hours & capacity.', icon: Store, bg: 'bg-rose-50', color: 'text-rose-500' },
                        { id: 'security', title: 'Security & Access', desc: 'Manage passwords, login security and active sessions.', icon: ShieldCheck, bg: 'bg-violet-50', color: 'text-violet-500' },
                        { id: 'staff_perm', title: 'Staff Permissions', desc: 'Control what your staff can access and manage.', icon: Users, bg: 'bg-rose-50', color: 'text-rose-500' },
                        { id: 'booking_settings', title: 'Booking Settings', desc: 'Configure appointment rules, buffer time and other preferences.', icon: Calendar, bg: 'bg-rose-50', color: 'text-rose-500' },
                        { id: 'payment_methods', title: 'Payment Methods', desc: 'Manage payment options, taxes and receipt preferences.', icon: CreditCard, bg: 'bg-rose-50', color: 'text-rose-500' },
                        { id: 'rentals_mgt', title: 'Rentals Management', desc: 'Manage chair/room rentals, pricing and availability.', icon: Briefcase, bg: 'bg-violet-50', color: 'text-violet-500' },
                        { id: 'notifications', title: 'Notifications', desc: 'Customize email, SMS and in-app notifications for staff & clients.', icon: Bell, bg: 'bg-violet-50', color: 'text-violet-500' },
                        { id: 'localization', title: 'Localization', desc: 'Set language, date format, time zone and regional settings.', icon: Globe, bg: 'bg-rose-50', color: 'text-rose-500' },
                        { id: 'appearance', title: 'Appearance', desc: 'Customize theme, colors, logo and system appearance.', icon: Palette, bg: 'bg-violet-50', color: 'text-violet-500' },
                        { id: 'database', title: 'Data Reset', desc: 'Reset system data like expenses, clients, services and more.', icon: Trash2, bg: 'bg-rose-50', color: 'text-rose-500' },
                        { id: 'backup', title: 'Backup & Restore', desc: 'Backup your data and restore when needed.', icon: CloudUpload, bg: 'bg-violet-50', color: 'text-violet-500' },
                        { id: 'logs', title: 'System Logs', desc: 'View system activity and important logs.', icon: FileText, bg: 'bg-rose-50', color: 'text-rose-500' },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSettingsSubTab(item.id)}
                          className="flex items-center gap-4 bg-white p-5 rounded-3xl shadow-[0_2px_15px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-zinc-100/80 transition-all duration-300 text-left group hover:-translate-y-0.5"
                        >
                          <div className={cn("w-[46px] h-[46px] rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105", item.bg)}>
                            <item.icon className={cn("w-5 h-5", item.color)} />
                          </div>
                          <div className="flex-1 min-w-0 pr-2">
                            <h3 className="text-[13px] font-black text-zinc-900 tracking-tight">{item.title}</h3>
                            <p className="text-[10px] font-medium text-zinc-500 mt-0.5 leading-relaxed pr-2">{item.desc}</p>
                          </div>
                          <div className="w-6 h-6 flex items-center justify-center shrink-0">
                            <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600 transition-colors group-hover:translate-x-1" />
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* System Information Banner */}
                    <div className="bg-rose-50/40 rounded-3xl p-5 border border-rose-100 flex flex-col md:flex-row items-center justify-between gap-6 mt-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                          <Info className="w-5 h-5 text-rose-600" />
                        </div>
                        <div>
                          <h4 className="text-[12px] font-black text-zinc-900">System Information</h4>
                          <p className="text-[10px] font-medium text-zinc-500 mt-0.5">Your system is up to date and running smoothly.</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-8 md:gap-12 text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                            <Box className="w-3.5 h-3.5 text-rose-500" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-wider text-zinc-900">Version</p>
                            <p className="text-[10px] font-medium text-zinc-500 mt-0.5">v1.0.0</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center shrink-0 shadow-sm border border-violet-100">
                            <Calendar className="w-3.5 h-3.5 text-violet-500" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-wider text-zinc-900">Last Backup</p>
                            <p className="text-[10px] font-medium text-zinc-500 mt-0.5">May 12, 2024</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 shadow-sm border border-emerald-100">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-wider text-zinc-900">System Status</p>
                            <p className="text-[10px] font-medium text-zinc-500 mt-0.5">All Systems Operational</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid lg:grid-cols-12 gap-8 items-start pt-2">
                    <div className="lg:col-span-8 space-y-6 lg:col-start-3">
                    {settingsSubTab === 'business' && (
                      <div className="grid md:grid-cols-2 gap-6 animate-in fade-in-30 duration-200">
                        {/* Salon Identity Card */}
                        <div className="group relative bg-white rounded-[22px] border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden p-6 space-y-6 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300">
                          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#EE2A7B] to-[#C0185E]" />
                          <div className="flex items-center gap-4 border-b border-zinc-50 pb-5">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-rose-50">
                              <Store className="w-6 h-6 text-rose-500" />
                            </div>
                            <div>
                              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900">Salon Identity</h2>
                              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Manage Salon contact information</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest pl-1">Salon Name</label>
                              <input 
                                type="text" 
                                className="w-full p-3.5 bg-zinc-50 hover:bg-zinc-100/50 focus:bg-white rounded-xl text-xs font-bold border border-zinc-200/80 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all duration-200 text-zinc-900" 
                                value={bizName} 
                                onChange={(e) => setBizName(e.target.value)}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest pl-1">Contact Phone</label>
                              <input 
                                type="text" 
                                className="w-full p-3.5 bg-zinc-50 hover:bg-zinc-100/50 focus:bg-white rounded-xl text-xs font-bold border border-zinc-200/80 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all duration-200 text-zinc-900" 
                                value={bizPhone} 
                                onChange={(e) => setBizPhone(e.target.value)}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest pl-1">Salon Email</label>
                              <input 
                                type="email" 
                                className="w-full p-3.5 bg-zinc-50 hover:bg-zinc-100/50 focus:bg-white rounded-xl text-xs font-bold border border-zinc-200/80 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all duration-200 text-zinc-900" 
                                value={bizEmail} 
                                onChange={(e) => setBizEmail(e.target.value)}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest pl-1">Physical Address</label>
                              <input 
                                type="text" 
                                className="w-full p-3.5 bg-zinc-50 hover:bg-zinc-100/50 focus:bg-white rounded-xl text-xs font-bold border border-zinc-200/80 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all duration-200 text-zinc-900" 
                                value={bizAddress} 
                                onChange={(e) => setBizAddress(e.target.value)}
                              />
                            </div>

                            <button 
                              onClick={() => {
                                localStorage.setItem('bizName', bizName);
                                localStorage.setItem('bizPhone', bizPhone);
                                localStorage.setItem('bizEmail', bizEmail);
                                localStorage.setItem('bizAddress', bizAddress);
                                toast.success("Salon Identity Saved! ✨");
                              }}
                              className="bg-primary text-white w-full py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary/95 active:scale-[0.98] transition-all shadow-lg shadow-primary/10 mt-2"
                            >
                              Save Identity
                            </button>
                          </div>
                        </div>

                        {/* Operational Hours Card */}
                        <div className="group relative bg-white rounded-[22px] border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden p-6 space-y-6 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300">
                          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 to-teal-400" />
                          <div className="flex items-center gap-4 border-b border-zinc-50 pb-5">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-50">
                              <Clock className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900">Operations & Limits</h2>
                              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Control workhours & booking limits</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest pl-1">Opening Time</label>
                                <input 
                                  type="time" 
                                  className="w-full p-3.5 bg-zinc-50 hover:bg-zinc-100/50 focus:bg-white rounded-xl text-xs font-bold border border-zinc-200/80 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-zinc-900" 
                                  value={bizHoursStart} 
                                  onChange={(e) => setBizHoursStart(e.target.value)}
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest pl-1">Closing Time</label>
                                <input 
                                  type="time" 
                                  className="w-full p-3.5 bg-zinc-50 hover:bg-zinc-100/50 focus:bg-white rounded-xl text-xs font-bold border border-zinc-200/80 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-zinc-900" 
                                  value={bizHoursEnd} 
                                  onChange={(e) => setBizHoursEnd(e.target.value)}
                                />
                              </div>
                            </div>

                            {/* Booking Double-Booking Cap */}
                            <div className="space-y-2 bg-[#FAFAFA] p-4 rounded-2xl border border-zinc-100/80 mt-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <label className="text-[9px] font-black text-zinc-950 uppercase tracking-widest">Double-Booking Cap</label>
                                  <p className="text-[7.5px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Max bookings per time slot</p>
                                </div>
                                <input 
                                  type="number" 
                                  min="1"
                                  max="10"
                                  className="w-14 p-2 bg-white text-center rounded-lg text-xs font-black border border-zinc-200 focus:border-primary outline-none"
                                  value={maxBookingsPerSlot} 
                                  onChange={(e) => setMaxBookingsPerSlot(parseInt(e.target.value, 10) || 1)}
                                />
                              </div>
                              
                              <div className="flex items-start gap-2 bg-amber-50/50 border border-amber-100 p-2.5 rounded-xl mt-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-[7.5px] font-bold text-amber-700 uppercase tracking-wide leading-relaxed">
                                  Attention: When bookings for the same time slot are full (max: {maxBookingsPerSlot}), that slot will automatically become disabled.
                                </p>
                              </div>
                            </div>

                            <button 
                              onClick={() => {
                                localStorage.setItem('bizHoursStart', bizHoursStart);
                                localStorage.setItem('bizHoursEnd', bizHoursEnd);
                                localStorage.setItem('maxBookingsPerSlot', maxBookingsPerSlot.toString());
                                toast.success("Operational Configuration Saved! 🚀");
                              }}
                              className="bg-primary text-white w-full py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary/95 active:scale-[0.98] transition-all shadow-lg shadow-primary/10 mt-4"
                            >
                              Save Configurations
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsSubTab === 'security' && (
                      <div className="grid md:grid-cols-2 gap-6 animate-in fade-in-30 duration-200">
                        {/* Change Password Card */}
                        <div className="group relative bg-white rounded-[22px] border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden p-6 space-y-6 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300">
                          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-500 to-purple-400" />
                          <div className="flex items-center gap-4 border-b border-zinc-50 pb-5">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-violet-50">
                              <ShieldCheck className="w-6 h-6 text-violet-500" />
                            </div>
                            <div>
                              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900">Change Password</h2>
                              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Secure your admin credentials</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest pl-1">New Password</label>
                              <input 
                                type="password" 
                                placeholder="••••••••"
                                className="w-full p-3.5 bg-zinc-50 hover:bg-zinc-100/50 focus:bg-white rounded-xl text-xs font-bold border border-zinc-200/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all duration-200 text-zinc-900" 
                                value={newPassword} 
                                onChange={(e) => setNewPassword(e.target.value)}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest pl-1">Confirm New Password</label>
                              <input 
                                type="password" 
                                placeholder="••••••••"
                                className="w-full p-3.5 bg-zinc-50 hover:bg-zinc-100/50 focus:bg-white rounded-xl text-xs font-bold border border-zinc-200/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all duration-200 text-zinc-900" 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)}
                              />
                            </div>

                            <button 
                              onClick={async () => {
                                if (!newPassword) {
                                  toast.error("Please enter your new password!");
                                  return;
                                }
                                if (newPassword !== confirmPassword) {
                                  toast.error("Error: Passwords do not match!");
                                  return;
                                }
                                try {
                                  const { error } = await supabase.auth.updateUser({ password: newPassword });
                                  if (error) throw error;
                                  toast.success("Password updated successfully! 🔐");
                                  setNewPassword("");
                                  setConfirmPassword("");
                                } catch (err: any) {
                                  toast.error("Failed to update password: " + err.message);
                                }
                              }}
                              className="bg-rose-600 text-white w-full py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-700 active:scale-[0.98] transition-all shadow-lg shadow-rose-600/10 mt-4"
                            >
                              Update Password
                            </button>
                          </div>
                        </div>

                        {/* Security Overview / Session Card */}
                        <div className="group relative bg-zinc-900 rounded-[22px] border border-zinc-800 shadow-[0_4px_20px_rgba(0,0,0,0.4)] overflow-hidden p-6 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-all duration-300 flex flex-col justify-between">
                          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-zinc-700 to-zinc-500" />
                          <div className="space-y-6">
                            <div className="flex items-center gap-4 border-b border-zinc-800 pb-5">
                              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-zinc-800">
                                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                              </div>
                              <div>
                                <h2 className="text-sm font-black uppercase tracking-wider text-white">Security Status</h2>
                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Real-time session details</p>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center justify-between bg-white/5 p-3.5 rounded-xl border border-white/5">
                                <div>
                                  <p className="text-[8px] font-black uppercase text-zinc-400">Current Login User</p>
                                  <p className="text-xs font-bold mt-1 text-white">{activeEmail || "admin@example.com"}</p>
                                </div>
                                <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md">ADMIN ACC</span>
                              </div>

                              <div className="flex items-center justify-between bg-white/5 p-3.5 rounded-xl border border-white/5">
                                <div>
                                  <p className="text-[8px] font-black uppercase text-zinc-400">Session Status</p>
                                  <p className="text-xs font-bold mt-1 text-white">Connected from Mogadishu</p>
                                </div>
                                <span className="inline-flex items-center gap-1.5 text-[7px] font-black text-emerald-400 uppercase tracking-widest">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                                  Active Now
                                </span>
                              </div>

                              <div className="flex items-center justify-between bg-white/5 p-3.5 rounded-xl border border-white/5">
                                <div>
                                  <p className="text-[8px] font-black uppercase text-zinc-400">Two-Factor Authentication</p>
                                  <p className="text-xs font-bold mt-1 text-white">OTP Verification via Email</p>
                                </div>
                                <span className="text-[7px] font-black text-zinc-400 uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-md">ENABLED</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-6 border-t border-zinc-900 mt-6">
                            <p className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest text-center">
                              Secured by Supabase Authentication Protocol
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsSubTab === 'database' && (
                      <div className="max-w-2xl mx-auto bg-white/95 backdrop-blur-xl border border-zinc-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] rounded-[32px] p-8 space-y-8 animate-in fade-in-50 slide-in-from-bottom-6 duration-500">
                        {/* Header */}
                        <div className="flex items-center gap-4 border-b border-zinc-100 pb-5">
                          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100/50 shadow-inner shrink-0 relative group">
                            <div className="absolute inset-0 bg-rose-500/10 rounded-2xl filter blur-sm group-hover:blur-md transition-all duration-300" />
                            <Trash2 className="w-5 h-5 text-rose-600 relative z-10 transition-transform group-hover:scale-110" />
                          </div>
                          <div>
                            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 leading-tight">Data Reset & Cleanup</h2>
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Permanently delete selected data categories from the system</p>
                          </div>
                        </div>

                        {/* Crucial Warning */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-white to-rose-50/20 border border-rose-200/60 p-5 rounded-2xl shadow-[0_4px_20px_rgba(244,63,94,0.05)] space-y-2">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full filter blur-xl -mr-4 -mt-4" />
                          <div className="flex items-center gap-2.5 text-rose-800">
                            <div className="w-6 h-6 rounded-lg bg-rose-500/15 flex items-center justify-center">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-rose-800">CRITICAL WARNING!</span>
                          </div>
                          <p className="text-[9.5px] font-bold text-rose-950/80 uppercase tracking-wide leading-relaxed pl-8">
                            This action is permanent and cannot be undone. Please double-check all selected categories before proceeding.
                          </p>
                        </div>

                        {/* Select Category Grid */}
                        <div className="space-y-4">
                          <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Select the data categories to delete:</label>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Bookings & POS */}
                            <button
                              type="button"
                              onClick={() => setDbClearBookings(!dbClearBookings)}
                              className={cn(
                                "flex items-center gap-4 p-4.5 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group active:scale-[0.98]",
                                dbClearBookings 
                                  ? "bg-rose-50/50 border-rose-300 text-rose-950 shadow-sm shadow-rose-500/5 ring-1 ring-rose-500/30" 
                                  : "bg-zinc-50/50 hover:bg-zinc-50 border-zinc-200/60 hover:border-zinc-300/80 text-zinc-700"
                              )}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300",
                                dbClearBookings 
                                  ? "bg-rose-500/10 border-rose-200 text-rose-600 shadow-sm" 
                                  : "bg-white border-zinc-200/80 text-zinc-400 group-hover:text-zinc-600"
                              )}>
                                <Calendar className="w-4 h-4 stroke-[2.5px]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-wider leading-none">Bookings & POS</p>
                                <p className="text-[8px] font-semibold text-zinc-400 uppercase mt-1">Booking records & sales transactions</p>
                              </div>
                              <div className={cn(
                                "w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 shrink-0",
                                dbClearBookings 
                                  ? "bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-600/20 scale-110" 
                                  : "border-zinc-300/80 bg-white"
                              )}>
                                {dbClearBookings ? <Check className="w-3 h-3 stroke-[3px]" /> : <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-zinc-200 transition-colors" />}
                              </div>
                            </button>

                            {/* Expenses */}
                            <button
                              type="button"
                              onClick={() => setDbClearExpenses(!dbClearExpenses)}
                              className={cn(
                                "flex items-center gap-4 p-4.5 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group active:scale-[0.98]",
                                dbClearExpenses 
                                  ? "bg-rose-50/50 border-rose-300 text-rose-950 shadow-sm shadow-rose-500/5 ring-1 ring-rose-500/30" 
                                  : "bg-zinc-50/50 hover:bg-zinc-50 border-zinc-200/60 hover:border-zinc-300/80 text-zinc-700"
                              )}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300",
                                dbClearExpenses 
                                  ? "bg-rose-500/10 border-rose-200 text-rose-600 shadow-sm" 
                                  : "bg-white border-zinc-200/80 text-zinc-400 group-hover:text-zinc-600"
                              )}>
                                <CreditCard className="w-4 h-4 stroke-[2.5px]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-wider leading-none">Expenses</p>
                                <p className="text-[8px] font-semibold text-zinc-400 uppercase mt-1">All recorded expense entries</p>
                              </div>
                              <div className={cn(
                                "w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 shrink-0",
                                dbClearExpenses 
                                  ? "bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-600/20 scale-110" 
                                  : "border-zinc-300/80 bg-white"
                              )}>
                                {dbClearExpenses ? <Check className="w-3 h-3 stroke-[3px]" /> : <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-zinc-200 transition-colors" />}
                              </div>
                            </button>

                            {/* Customers */}
                            <button
                              type="button"
                              onClick={() => setDbClearCustomers(!dbClearCustomers)}
                              className={cn(
                                "flex items-center gap-4 p-4.5 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group active:scale-[0.98]",
                                dbClearCustomers 
                                  ? "bg-rose-50/50 border-rose-300 text-rose-950 shadow-sm shadow-rose-500/5 ring-1 ring-rose-500/30" 
                                  : "bg-zinc-50/50 hover:bg-zinc-50 border-zinc-200/60 hover:border-zinc-300/80 text-zinc-700"
                              )}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300",
                                dbClearCustomers 
                                  ? "bg-rose-500/10 border-rose-200 text-rose-600 shadow-sm" 
                                  : "bg-white border-zinc-200/80 text-zinc-400 group-hover:text-zinc-600"
                              )}>
                                <Users className="w-4 h-4 stroke-[2.5px]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-wider leading-none">Clients</p>
                                <p className="text-[8px] font-semibold text-zinc-400 uppercase mt-1">All registered client records</p>
                              </div>
                              <div className={cn(
                                "w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 shrink-0",
                                dbClearCustomers 
                                  ? "bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-600/20 scale-110" 
                                  : "border-zinc-300/80 bg-white"
                              )}>
                                {dbClearCustomers ? <Check className="w-3 h-3 stroke-[3px]" /> : <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-zinc-200 transition-colors" />}
                              </div>
                            </button>

                            {/* Services & Products */}
                            <button
                              type="button"
                              onClick={() => setDbClearServices(!dbClearServices)}
                              className={cn(
                                "flex items-center gap-4 p-4.5 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group active:scale-[0.98]",
                                dbClearServices 
                                  ? "bg-rose-50/50 border-rose-300 text-rose-950 shadow-sm shadow-rose-500/5 ring-1 ring-rose-500/30" 
                                  : "bg-zinc-50/50 hover:bg-zinc-50 border-zinc-200/60 hover:border-zinc-300/80 text-zinc-700"
                              )}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300",
                                dbClearServices 
                                  ? "bg-rose-500/10 border-rose-200 text-rose-600 shadow-sm" 
                                  : "bg-white border-zinc-200/80 text-zinc-400 group-hover:text-zinc-600"
                              )}>
                                <Scissors className="w-4 h-4 stroke-[2.5px]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-wider leading-none">Services & Products</p>
                                <p className="text-[8px] font-semibold text-zinc-400 uppercase mt-1">All registered services & products</p>
                              </div>
                              <div className={cn(
                                "w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 shrink-0",
                                dbClearServices 
                                  ? "bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-600/20 scale-110" 
                                  : "border-zinc-300/80 bg-white"
                              )}>
                                {dbClearServices ? <Check className="w-3 h-3 stroke-[3px]" /> : <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-zinc-200 transition-colors" />}
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Confirmation text */}
                        <div className="space-y-4 pt-4 border-t border-zinc-100">
                          <div className="flex justify-between items-center pl-1">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Confirm Deletion:</label>
                            {dbConfirmationText.toUpperCase() === 'CLEAR' ? (
                              <span className="text-[8.5px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 uppercase tracking-widest flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Unlocked
                              </span>
                            ) : (
                              <span className="text-[8.5px] font-black text-rose-400 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100/50 uppercase tracking-widest flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> Locked
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider pl-1">
                            Type the word <span className="text-rose-600 font-extrabold font-mono text-[9.5px] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/50">CLEAR</span> in the box below to confirm deletion.
                          </p>
                          
                          <div className="relative group">
                            <input 
                              type="text" 
                              placeholder="Type CLEAR here..."
                              className={cn(
                                "w-full p-4 pl-5 bg-zinc-50 hover:bg-zinc-100/50 focus:bg-white rounded-2xl text-xs font-black border focus:ring-1 outline-none transition-all duration-300 text-zinc-900 placeholder:text-zinc-300",
                                dbConfirmationText.toUpperCase() === 'CLEAR'
                                  ? "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500"
                                  : "border-zinc-200/80 focus:border-rose-500 focus:ring-rose-500"
                              )}
                              value={dbConfirmationText} 
                              onChange={(e) => setDbConfirmationText(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Submit Button */}
                        <button 
                          onClick={handleClearDatabase}
                          disabled={dbIsClearing || dbConfirmationText.toUpperCase() !== 'CLEAR' || (!dbClearBookings && !dbClearExpenses && !dbClearCustomers && !dbClearServices)}
                          className={cn(
                            "w-full py-4.5 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2",
                            dbConfirmationText.toUpperCase() === 'CLEAR' && (dbClearBookings || dbClearExpenses || dbClearCustomers || dbClearServices)
                              ? "bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-xl shadow-rose-600/20 cursor-pointer"
                              : "bg-zinc-100 border border-zinc-200/50 text-zinc-400 cursor-not-allowed"
                          )}
                        >
                          {dbIsClearing ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Clearing data...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-3.5 h-3.5" />
                              Clear Selected Data
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {settingsSubTab === 'staff_perm' && (
                      <div className="bg-white border border-zinc-100 rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
                         <div className="p-6 border-b border-zinc-50 flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                             <Users className="w-6 h-6 text-rose-500" />
                           </div>
                           <div>
                             <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900">Staff Permissions</h2>
                             <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Control access roles and modules</p>
                           </div>
                         </div>
                         <div className="p-10 text-center flex flex-col items-center">
                           <ShieldCheck className="w-8 h-8 text-zinc-300 mb-3" />
                           <p className="text-xs font-black text-zinc-900 uppercase">Permissions Module</p>
                           <p className="text-[10px] text-zinc-500 mt-1 max-w-xs leading-relaxed">Staff permission levels (Admin, Cashier, Stylist) are currently managed directly within the Login Management table.</p>
                           <button onClick={() => { setActiveTab('users'); setSettingsSubTab('grid'); }} className="mt-4 px-4 py-2 bg-zinc-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">Go to User Login Management</button>
                         </div>
                      </div>
                    )}

                    {settingsSubTab === 'booking_settings' && (
                      <div className="bg-white border border-zinc-100 rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
                         <div className="p-6 border-b border-zinc-50 flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                             <Calendar className="w-6 h-6 text-rose-500" />
                           </div>
                           <div>
                             <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900">Booking Settings</h2>
                             <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Configure appointment rules</p>
                           </div>
                         </div>
                         <div className="p-6 space-y-4">
                           <div className="flex items-center justify-between bg-zinc-50/50 p-4 rounded-xl border border-zinc-100">
                             <div>
                               <p className="text-[10px] font-black uppercase text-zinc-900">Auto-Approve Bookings</p>
                               <p className="text-[8px] font-medium text-zinc-500 uppercase mt-0.5">Automatically accept incoming online bookings</p>
                             </div>
                             <div 
                               onClick={() => setBookingSettings(p => ({ ...p, autoApprove: !p.autoApprove }))}
                               className={cn("w-10 h-6 rounded-full relative shadow-inner cursor-pointer transition-colors", bookingSettings.autoApprove ? "bg-emerald-500" : "bg-zinc-200")}
                             >
                               <div className={cn("w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all", bookingSettings.autoApprove ? "right-1" : "left-1")} />
                             </div>
                           </div>
                           <div className="flex items-center justify-between bg-zinc-50/50 p-4 rounded-xl border border-zinc-100">
                             <div>
                               <p className="text-[10px] font-black uppercase text-zinc-900">Require Deposit</p>
                               <p className="text-[8px] font-medium text-zinc-500 uppercase mt-0.5">Require 30% upfront for large bookings</p>
                             </div>
                             <div 
                               onClick={() => setBookingSettings(p => ({ ...p, requireDeposit: !p.requireDeposit }))}
                               className={cn("w-10 h-6 rounded-full relative shadow-inner cursor-pointer transition-colors", bookingSettings.requireDeposit ? "bg-emerald-500" : "bg-zinc-200")}
                             >
                               <div className={cn("w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all", bookingSettings.requireDeposit ? "right-1" : "left-1")} />
                             </div>
                           </div>
                         </div>
                      </div>
                    )}

                    {settingsSubTab === 'payment_methods' && (
                      <div className="bg-white border border-zinc-100 rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
                         <div className="p-6 border-b border-zinc-50 flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                             <CreditCard className="w-6 h-6 text-rose-500" />
                           </div>
                           <div>
                             <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900">Payment Methods</h2>
                             <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Manage accepted payments</p>
                           </div>
                         </div>
                         <div className="p-6 grid grid-cols-2 gap-4">
                            {Object.entries(paymentMethods).map(([pm, isEnabled]) => (
                              <div key={pm} onClick={() => setPaymentMethods(p => ({ ...p, [pm]: !p[pm] }))} className="flex items-center gap-3 p-3 border border-zinc-100 rounded-xl bg-white hover:bg-zinc-50 transition-colors cursor-pointer select-none">
                                <div className={cn("w-4 h-4 rounded border flex items-center justify-center transition-colors", isEnabled ? "bg-zinc-900 border-zinc-900" : "border-zinc-300 bg-white")}>
                                  {isEnabled && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-[10px] font-black uppercase text-zinc-800">{pm}</span>
                              </div>
                            ))}
                         </div>
                      </div>
                    )}

                    {settingsSubTab === 'rentals_mgt' && (
                      <div className="bg-white border border-zinc-100 rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
                         <div className="p-6 border-b border-zinc-50 flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center shrink-0">
                             <Briefcase className="w-6 h-6 text-violet-500" />
                           </div>
                           <div>
                             <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900">Rentals Management</h2>
                             <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Configure dress rental rules</p>
                           </div>
                         </div>
                         <div className="p-10 text-center flex flex-col items-center">
                           <Shirt className="w-8 h-8 text-zinc-300 mb-3" />
                           <p className="text-[10px] text-zinc-500 mt-1 max-w-xs leading-relaxed uppercase tracking-wider font-bold">Rental inventory and individual pricing are managed within the main Rentals tab.</p>
                           <button onClick={() => { setActiveTab('rentals'); setSettingsSubTab('grid'); }} className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">Go to Rentals Hub</button>
                         </div>
                      </div>
                    )}

                    {settingsSubTab === 'notifications' && (
                      <div className="bg-white border border-zinc-100 rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
                         <div className="p-6 border-b border-zinc-50 flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center shrink-0">
                             <Bell className="w-6 h-6 text-violet-500" />
                           </div>
                           <div>
                             <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900">Notifications</h2>
                             <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Customize alerts & messages</p>
                           </div>
                         </div>
                         <div className="p-6 space-y-4">
                           {Object.entries(notifSettings).map(([notif, isEnabled]) => (
                             <div key={notif} className="flex items-center justify-between bg-zinc-50/50 p-4 rounded-xl border border-zinc-100">
                               <p className="text-[10px] font-black uppercase text-zinc-900">{notif}</p>
                               <div 
                                 onClick={() => setNotifSettings(p => ({ ...p, [notif]: !p[notif as keyof typeof p] }))}
                                 className={cn("w-10 h-6 rounded-full relative shadow-inner cursor-pointer transition-colors", isEnabled ? "bg-emerald-500" : "bg-zinc-200")}
                               >
                                 <div className={cn("w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all", isEnabled ? "right-1" : "left-1")} />
                               </div>
                             </div>
                           ))}
                         </div>
                      </div>
                    )}

                    {settingsSubTab === 'localization' && (
                      <div className="bg-white border border-zinc-100 rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
                         <div className="p-6 border-b border-zinc-50 flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                             <Globe className="w-6 h-6 text-rose-500" />
                           </div>
                           <div>
                             <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900">Localization</h2>
                             <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Region, currency & language</p>
                           </div>
                         </div>
                         <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest pl-1">Primary Currency</label>
                              <select value={sysCurrency} onChange={(e) => setSysCurrency(e.target.value)} className="w-full p-3.5 bg-zinc-50 rounded-xl text-xs font-bold border border-zinc-200 outline-none text-zinc-900">
                                <option value="USD ($)">USD ($)</option>
                                <option value="SOS (Sh)">SOS (Sh)</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest pl-1">System Language</label>
                              <select className="w-full p-3.5 bg-zinc-50 rounded-xl text-xs font-bold border border-zinc-200 outline-none text-zinc-900" value={lang} onChange={(e) => setLang(e.target.value as 'en'|'so')}>
                                <option value="en">English (US)</option>
                                <option value="so">Somali</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest pl-1">Timezone</label>
                              <select value={sysTimezone} onChange={(e) => setSysTimezone(e.target.value)} className="w-full p-3.5 bg-zinc-50 rounded-xl text-xs font-bold border border-zinc-200 outline-none text-zinc-900">
                                <option value="Africa/Mogadishu (GMT+3)">Africa/Mogadishu (GMT+3)</option>
                                <option value="Africa/Nairobi (GMT+3)">Africa/Nairobi (GMT+3)</option>
                              </select>
                            </div>
                         </div>
                      </div>
                    )}

                    {settingsSubTab === 'appearance' && (
                      <div className="bg-white border border-zinc-100 rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
                         <div className="p-8 border-b border-zinc-50 flex items-center gap-5">
                           <div className="w-14 h-14 rounded-3xl bg-violet-50 flex items-center justify-center shrink-0">
                             <Palette className="w-6 h-6 text-violet-500" />
                           </div>
                           <div>
                             <h2 className="text-lg font-black uppercase tracking-widest text-zinc-950">Appearance</h2>
                             <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Themes and branding</p>
                           </div>
                         </div>
                         <div className="p-8 space-y-6">
                            <div className="space-y-4">
                              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Interface Theme</label>
                              <div className="grid grid-cols-2 gap-4">
                                <button type="button" onClick={() => setThemeMode('light')} className={cn("p-4.5 flex items-center gap-4 cursor-pointer transition-all rounded-xl w-full text-left", themeMode === 'light' ? "border-2 border-zinc-100 bg-white shadow-sm" : "border border-zinc-100 bg-white hover:border-zinc-200")}>
                                  <div className={cn("w-4 h-4 rounded-full flex items-center justify-center transition-all shrink-0", themeMode === 'light' ? "border-[4px] border-zinc-200" : "border border-zinc-200")} />
                                  <span className="text-[11px] font-black uppercase text-zinc-950 tracking-wider">Light Mode</span>
                                </button>
                                <button type="button" onClick={() => setThemeMode('dark')} className={cn("p-4.5 flex items-center gap-4 cursor-pointer transition-all rounded-xl w-full text-left", themeMode === 'dark' ? "border-[3px] border-[#c026d3] bg-[#0f0f11]" : "border border-zinc-200 bg-[#18181b] opacity-90 hover:opacity-100")}>
                                  <div className={cn("w-4 h-4 rounded-full flex items-center justify-center transition-all shrink-0", themeMode === 'dark' ? "bg-white border-[4px] border-[#d946ef]" : "border border-zinc-500")} />
                                  <span className="text-[11px] font-black uppercase text-white tracking-wider">Dark Mode</span>
                                </button>
                              </div>
                            </div>
                         </div>
                      </div>
                    )}

                    {settingsSubTab === 'backup' && (
                      <div className="bg-white border border-zinc-100 rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
                         <div className="p-6 border-b border-zinc-50 flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center shrink-0">
                             <CloudUpload className="w-6 h-6 text-violet-500" />
                           </div>
                           <div>
                             <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900">Backup & Restore</h2>
                             <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Secure your salon data</p>
                           </div>
                         </div>
                         <div className="p-6 flex flex-col items-center justify-center text-center py-10">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
                              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h3 className="text-xs font-black uppercase text-zinc-900">Cloud Sync Active</h3>
                            <p className="text-[10px] font-medium text-zinc-500 mt-2 max-w-[250px]">Your data is automatically synced and backed up to Supabase servers in real-time.</p>
                            <button className="mt-6 px-6 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-zinc-800 transition-colors shadow-lg active:scale-95">
                              <Download className="w-4 h-4" /> Download Manual JSON Backup
                            </button>
                         </div>
                      </div>
                    )}

                    {settingsSubTab === 'logs' && (
                      <div className="bg-white border border-zinc-100 rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
                         <div className="p-6 border-b border-zinc-50 flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                             <FileText className="w-6 h-6 text-rose-500" />
                           </div>
                           <div>
                             <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900">System Logs</h2>
                             <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Audit trail and activity</p>
                           </div>
                         </div>
                         <div className="p-6 space-y-3">
                           {[
                             { action: "Admin changed operational hours", time: "2 hours ago" },
                             { action: "Staff member Sarah logged in", time: "5 hours ago" },
                             { action: "Database backup completed", time: "1 day ago" },
                             { action: "System launched with v1.0.0", time: "3 days ago" },
                           ].map((log, i) => (
                             <div key={i} className="flex justify-between items-center p-3.5 bg-zinc-50 rounded-xl border border-zinc-100">
                               <div className="flex items-center gap-3">
                                 <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                                 <span className="text-[10px] font-bold text-zinc-800">{log.action}</span>
                               </div>
                               <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{log.time}</span>
                             </div>
                           ))}
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

            {/* Dedicated Users Management Tab */}
            {activeTab === "users" && (
              <div className="space-y-6 pb-10 px-2">
                <div className="px-2">
                  <h1 className="font-display text-xl font-black text-zinc-900 leading-none">Login Management</h1>
                  <p className="font-body text-zinc-400 font-medium text-[9px] mt-0.5">Control system access & roles</p>
                </div>
                
                <div className={cardStyles}>
                  <div className="p-6 border-b border-zinc-50 flex items-center justify-between">
                    <div>
                      <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-900">System Users</h2>
                      <p className="text-[8px] text-zinc-400 font-bold mt-1 uppercase">Manage login accounts</p>
                    </div>
                    <button onClick={() => { setEditingId(null); setModalType('staff'); }} className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 active:scale-95 transition-all shadow-lg">
                      <Plus className="w-3 h-3" /> Add New Login User
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-zinc-50/50 border-b border-zinc-100">
                          <th className="text-left p-4 text-[8px] font-black uppercase tracking-widest text-zinc-400">User</th>
                          <th className="text-left p-4 text-[8px] font-black uppercase tracking-widest text-zinc-400">Role</th>
                          <th className="text-left p-4 text-[8px] font-black uppercase tracking-widest text-zinc-400">Status</th>
                          <th className="text-center p-4 text-[8px] font-black uppercase tracking-widest text-zinc-400">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {filteredStaff.length === 0 ? (
                          <tr><td colSpan={4} className="p-10 text-center text-[10px] text-zinc-400">No users found.</td></tr>
                        ) : filteredStaff.map((u, i) => (
                          <tr key={i} className="hover:bg-zinc-50/20 transition-colors group">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-[10px] font-black text-primary uppercase shadow-sm">
                                  {(u.full_name || u.name)?.[0] || 'U'}
                                </div>
                                <div>
                                  <p className="text-[10px] font-black text-zinc-900 uppercase">{u.full_name || u.name}</p>
                                  <p className="text-[8px] text-zinc-400">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest bg-zinc-100 px-2 py-0.5 rounded-full">{u.role || 'Admin'}</span>
                            </td>
                            <td className="p-4">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[7px] font-black uppercase tracking-widest">
                                <div className="w-1 h-1 bg-emerald-500 rounded-full" /> Active
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => openEditStaff(u)} className="p-2 text-zinc-300 hover:text-zinc-600 transition-colors">
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button onClick={() => deleteStaff(u.id)} className="p-2 text-rose-300 hover:text-rose-500 transition-colors">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Sales History / Reports */}
            {activeTab === "reports" && (
              <div className="space-y-8 pb-10 px-2 max-w-[1400px] mx-auto">

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Revenue Area Chart */}
                  <div className={cn(cardStyles, "lg:col-span-2 p-6 flex flex-col")}>
                    <div className="mb-6">
                      <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-2">Revenue Growth (7 Days)</h2>
                    </div>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#83215D" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#83215D" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#A1A1AA', fontWeight: 700 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#A1A1AA', fontWeight: 700 }} dx={-10} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} 
                            itemStyle={{ color: '#83215D', fontWeight: 900 }}
                            formatter={(value: any) => [`$${value}`, "Revenue"]}
                          />
                          <Area type="monotone" dataKey="value" stroke="#83215D" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Service Share Pie Chart */}
                  <div className={cn(cardStyles, "p-6 bg-zinc-900 border-zinc-800 text-white flex flex-col")}>
                    <div className="mb-4">
                      <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-800 pb-2">Service Share</h2>
                    </div>
                    <div className="h-[180px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={serviceData.length > 0 ? serviceData : [{ name: "No Data", value: 1, color: "#3f3f46" }]}
                            cx="50%" cy="50%" innerRadius={50} outerRadius={70} stroke="none"
                            paddingAngle={5} dataKey="value"
                          >
                            {serviceData.length > 0 ? serviceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            )) : <Cell fill="#3f3f46" />}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'rgba(255,255,255,0.95)', color: '#000', fontSize: '10px', fontWeight: 'bold' }} 
                            itemStyle={{ color: '#000' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-auto pt-4 space-y-2">
                      {serviceData.slice(0, 5).map((s, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                            <span className="text-[9px] font-bold text-zinc-300 truncate max-w-[120px]">{s.name}</span>
                          </div>
                          <span className="text-[9px] font-black text-white">{Math.round((s.value / serviceData.reduce((a,b)=>a+b.value,0))*100) || 0}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sales Table Wrappers */}
                <div className="bg-white rounded-[24px] border border-zinc-100 shadow-sm overflow-hidden mb-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white border-b border-zinc-100 gap-4">
                    <div>
                      <h2 className="text-xl font-display font-medium text-[#1E1E1E]">Transaction History</h2>
                      {/* Date filter buttons */}
                      <div className="flex items-center gap-2 mt-3">
                        {(['all','today','month'] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => { setReportsDateFilter(f); setReportsPage(1); }}
                            className={cn(
                              "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all",
                              reportsDateFilter === f
                                ? "bg-primary text-white border-primary shadow-sm"
                                : "bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300"
                            )}
                          >
                            {f === 'all' ? 'All' : f === 'today' ? 'Today' : 'This Month'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={downloadTransactionsCSV} className="flex items-center gap-2 bg-[#2D5BFF] hover:bg-[#2D5BFF]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Download <ChevronDown className="w-4 h-4 ml-1" />
                      </button>
                      <button onClick={() => setReportsSortLatest(!reportsSortLatest)} className="flex items-center gap-2 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#4B5563] px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        {reportsSortLatest ? "Latest First" : "Oldest First"} <ChevronDown className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-zinc-100 bg-white">
                          <th className="py-4 px-6 text-left text-[11px] font-bold uppercase tracking-widest text-zinc-400">Client Name</th>
                          <th className="py-4 px-6 text-left text-[11px] font-bold uppercase tracking-widest text-zinc-400">Date</th>
                          <th className="py-4 px-6 text-left text-[11px] font-bold uppercase tracking-widest text-zinc-400">Service</th>
                          <th className="py-4 px-6 text-left text-[11px] font-bold uppercase tracking-widest text-zinc-400">Amount</th>
                          <th className="py-4 px-6 text-left text-[11px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                          <th className="py-4 px-6 text-center text-[11px] font-bold uppercase tracking-widest text-zinc-400 w-20"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 bg-white">
                        {(() => {
                          const nowLocal = new Date();
                          const curMonthStr = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth()+1).padStart(2,'0')}`;
                          const filtered = allBookings
                            .filter(b => b.status === 'confirmed')
                            .filter(b => {
                              if (reportsDateFilter === 'today') return b.booking_date === todayStr;
                              if (reportsDateFilter === 'month') return (b.booking_date || '').startsWith(curMonthStr);
                              return true; // 'all'
                            })
                            .sort((a,b) => {
                              const val = new Date(b.created_at || b.booking_date).getTime() - new Date(a.created_at || a.booking_date).getTime() || ((b.id||0) - (a.id||0));
                              return reportsSortLatest ? val : -val;
                            });
                          const perPage = 10;
                          const visibleRows = filtered.slice((reportsPage - 1) * perPage, reportsPage * perPage);
                          return visibleRows.map((sale, i) => (
                          <tr key={sale.id || i} className="hover:bg-zinc-50/50 transition-colors group">
                            <td className="py-4 px-6">
                              <span className="text-[13px] font-medium text-[#1E1E1E]">{sale.name || 'Guest'}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-[13px] font-medium text-zinc-500">{new Date(sale.created_at || sale.booking_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric'})}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-[13px] font-medium text-zinc-500">{sale.service || ''}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-[13px] font-medium text-[#1E1E1E]">${Number(sale.amount||0).toFixed(2)}</span>
                            </td>
                            <td className="py-4 px-6">
                              {sale.status === 'completed' || sale.status === 'confirmed' ? (
                                <span className="text-[13px] font-medium text-[#1E1E1E]">Completed</span>
                              ) : sale.status === 'pending' ? (
                                <span className="text-[13px] font-medium text-zinc-500">Pending</span>
                              ) : (
                                <span className="text-[13px] font-medium text-[#FF453A]">Cancelled</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(`Client: ${sale.name} | Service: ${sale.service} | Amount: $${sale.amount} | Date: ${new Date(sale.created_at || sale.booking_date).toLocaleDateString()}`);
                                  toast.success("Transaction details copied!");
                                }}
                                className="text-zinc-400 hover:text-[#1E1E1E] transition-colors active:scale-95"
                              >
                                <Copy className="w-4 h-4 mx-auto" />
                              </button>
                            </td>
                          </tr>
                        ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Footer / Pagination */}
                  <div className="flex items-center justify-between p-6 border-t border-zinc-100">
                    {(() => {
                      const nowLocal2 = new Date();
                      const curMonthStr2 = `${nowLocal2.getFullYear()}-${String(nowLocal2.getMonth()+1).padStart(2,'0')}`;
                      const filtered = allBookings
                        .filter(b => b.status === 'confirmed')
                        .filter(b => {
                          if (reportsDateFilter === 'today') return b.booking_date === todayStr;
                          if (reportsDateFilter === 'month') return (b.booking_date || '').startsWith(curMonthStr2);
                          return true;
                        });
                      const perPage = 10;
                      const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
                      
                      return (
                        <>
                          <button 
                            onClick={() => setReportsPage(Math.max(1, reportsPage - 1))}
                            disabled={reportsPage === 1}
                            className="flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 bg-white border border-zinc-200 px-3 py-1.5 rounded hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" /> Previous
                          </button>
                          
                          <div className="flex items-center gap-1.5">
                            <span className="text-zinc-500 text-[13px] font-medium">
                              Page {reportsPage} of {totalPages}
                            </span>
                          </div>
                          
                          <button 
                            onClick={() => setReportsPage(Math.min(totalPages, reportsPage + 1))}
                            disabled={reportsPage === totalPages}
                            className="flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 bg-white border border-zinc-200 px-3 py-1.5 rounded hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Products Section */}
            {activeTab === "products" && (
              <div className="space-y-6 pb-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-2">
                  <div className="space-y-0.5">
                    <h1 className="font-display text-xl font-black text-zinc-900 leading-none">Inventory</h1>
                    <p className="font-body text-zinc-400 font-medium text-[9px]">Manage stock</p>
                  </div>
                  <button onClick={() => setModalType('service')} className="bg-primary text-white px-4 py-2 rounded-lg font-body text-[9px] flex items-center gap-1.5 hover:bg-primary/90 transition-all shadow-md">
                    <Plus className="w-3 h-3" /> Add Product
                  </button>
                </div>

                <div className={cardStyles}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-zinc-100 bg-zinc-50/50">
                          <th className="text-left p-4 text-[8px] font-black uppercase tracking-widest text-zinc-400">Image</th>
                          <th className="text-left p-4 text-[8px] font-black uppercase tracking-widest text-zinc-400">Product</th>
                          <th className="text-right p-4 text-[8px] font-black uppercase tracking-widest text-zinc-400">Price</th>
                          <th className="text-center p-4 text-[8px] font-black uppercase tracking-widest text-zinc-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredServices.filter(s => s.category === 'Product').map((prod, i) => (
                          <tr key={i} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors">
                            <td className="p-4 w-16">
                              <div className="w-10 h-10 bg-zinc-100 rounded-lg border border-zinc-200 overflow-hidden flex items-center justify-center shrink-0">
                                {prod.image_url ? (
                                  <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                                ) : (
                                  <ShoppingBag className="w-4 h-4 text-zinc-300" />
                                )}
                              </div>
                            </td>
                             <td className="p-4">
                               <p className="font-display font-bold text-[10px] text-zinc-900 uppercase">{prod.name}</p>
                               <div className="flex items-center gap-2 mt-1">
                                 <p className={cn(
                                   "text-[8px] font-black uppercase px-2 py-0.5 rounded-full",
                                   Number(prod.duration) < 5 ? "bg-rose-50 text-rose-500 animate-pulse" : "bg-emerald-50 text-emerald-600"
                                 )}>
                                   Stock: {prod.duration || "0"}
                                 </p>
                                 {Number(prod.duration) < 5 && (
                                   <span className="text-[7px] font-black text-rose-400 uppercase tracking-widest">Low Stock!</span>
                                 )}
                               </div>
                             </td>
                            <td className="p-4 text-right font-display font-black text-emerald-600 text-[10px]">${prod.price}</td>
                            <td className="p-4 text-center">
                              <button onClick={() => deleteService(prod.id)} className="p-2 text-rose-300 hover:text-rose-600 transition-all"><Trash2 className="w-3 h-3" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* POS Section */}
            {activeTab === "pos" && (
              <div className="p-4 space-y-6 bg-zinc-50/50 min-h-[80vh] rounded-2xl">
                <div className="flex justify-between items-center px-2">
                  <h1 className="font-display text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
                    <Store className="w-5 h-5" /> Point of Sale
                  </h1>
                  <button onClick={() => { setPosCart([]); setPosDiscount(0); }} className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 px-3 py-1 rounded-full px-2">Clear</button>
                </div>

                <div className="grid lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-8 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                      {dbServices
                        .filter(item => item.category === 'Product')
                        .map((item, i) => (
                          <button
                            key={i}
                            onClick={() => setPosCart([...posCart, item])}
                            className="bg-white p-3 rounded-xl border border-zinc-100 hover:border-primary transition-all flex flex-col items-center gap-2 text-center shadow-sm"
                          >
                            <div className="w-10 h-10 rounded-lg bg-zinc-50 flex items-center justify-center shrink-0">
                              {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : <Sparkles className="w-3 h-3 text-zinc-200" />}
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-zinc-900 uppercase truncate px-1">{item.name}</p>
                              <p className="text-[10px] font-black text-emerald-600">${item.price}</p>
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>

                  <div className="lg:col-span-4 sticky top-24">
                    <div className="bg-white rounded-2xl border border-zinc-100 shadow-xl p-4 space-y-4">
                      <h2 className="font-display font-bold text-sm text-zinc-900 mb-2">Order Summary</h2>
                      <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1">
                        {posCart.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                            <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-[10px] font-bold">{item.name?.[0] || '?'}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] font-bold text-zinc-900 truncate">{item.name}</p>
                              <p className="text-[9px] font-black text-emerald-600">${item.price}</p>
                            </div>
                            <button onClick={() => setPosCart(posCart.filter((_, i) => i !== idx))} className="text-zinc-300 hover:text-rose-500"><X className="w-3 h-3" /></button>
                          </div>
                        ))}
                      </div>
                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-400">
                          <span>Subtotal</span>
                          <span>${posCart.reduce((acc, curr) => acc + (curr.price || 0), 0)}</span>
                        </div>
                        <div className="flex justify-between items-center font-black text-lg text-zinc-900">
                          <span>Total</span>
                          <span>${posCart.reduce((acc, curr) => acc + (curr.price || 0), 0)}</span>
                        </div>
                      </div>

                      {/* Premium Somalia Payment Selector stack */}
                      <div className="border-t pt-3 space-y-2 text-left">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Payment Method</label>
                        <div className="flex flex-col gap-2.5">
                          {[
                            {
                              id: "EVC Plus",
                              title: "EVC Plus",
                              subtitle: "Mobile Money",
                              brandBg: "bg-[#28A745]",
                              borderSel: "border-[#28A745] ring-1 ring-[#28A745]",
                              titleColor: "text-[#28A745]",
                              logoText: (
                                <div className="flex flex-col items-center justify-center text-white leading-none">
                                  <span className="text-[10px] font-black tracking-tighter">EVC+</span>
                                  <span className="text-[5px] font-bold tracking-[0.15em] opacity-90 mt-0.5">PLUS</span>
                                </div>
                              ),
                              rightIcon: (color: string) => (
                                <svg className={`w-6 h-6 ${color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                                  <line x1="12" y1="18" x2="12" y2="18.01" />
                                  <line x1="12" y1="7" x2="12" y2="13" />
                                  <line x1="9" y1="10" x2="15" y2="10" />
                                </svg>
                              )
                            },
                            {
                              id: "eDahab",
                              title: "eDahab",
                              subtitle: "Mobile Money",
                              brandBg: "bg-[#D49D26]",
                              borderSel: "border-[#D49D26] ring-1 ring-[#D49D26]",
                              titleColor: "text-[#D49D26]",
                              logoText: (
                                <div className="flex flex-col items-center justify-center text-white leading-none">
                                  <span className="text-[9px] font-black italic tracking-tighter">eDahab</span>
                                </div>
                              ),
                              rightIcon: (color: string) => (
                                <svg className={`w-6 h-6 ${color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="5" y="2" width="14" height="20" rx="2" />
                                  <path d="M9 12a3 3 0 0 1 6 0c0 .8-.5 1.5-1.2 1.8L12 15.5v.5" />
                                </svg>
                              )
                            },
                            {
                              id: "JEEB",
                              title: "JEEB",
                              subtitle: "Mobile Money",
                              brandBg: "bg-[#1E2260]",
                              borderSel: "border-[#1E2260] ring-1 ring-[#1E2260]",
                              titleColor: "text-[#1E2260]",
                              logoText: (
                                <div className="flex flex-col items-center justify-center text-white leading-none">
                                  <span className="text-[10px] font-black italic tracking-tighter">JEEB</span>
                                </div>
                              ),
                              rightIcon: (color: string) => (
                                <svg className={`w-6 h-6 ${color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="5" y="2" width="14" height="20" rx="2" />
                                  <path d="M12 7v10M10 14h4" />
                                </svg>
                              )
                            },
                            {
                              id: "Bank Card",
                              title: "Bank Card",
                              subtitle: "Visa, Mastercard",
                              brandBg: "bg-[#6C757D]",
                              borderSel: "border-[#6C757D] ring-1 ring-[#6C757D]",
                              titleColor: "text-[#374151]",
                              logoText: (
                                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="2" y="5" width="20" height="14" rx="2" />
                                  <line x1="2" y1="10" x2="22" y2="10" />
                                </svg>
                              ),
                              rightIcon: (color: string) => (
                                <svg className={`w-6 h-6 ${color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="2" y="9" width="16" height="11" rx="2" />
                                  <path d="M6 5h16v11a2 2 0 0 1-2 2H6" />
                                </svg>
                              )
                            },
                            {
                              id: "Cash",
                              title: "Cash",
                              subtitle: "Pay with cash",
                              brandBg: "bg-[#0E5E35]",
                              borderSel: "border-[#0E5E35] ring-1 ring-[#0E5E35]",
                              titleColor: "text-[#0E5E35]",
                              logoText: (
                                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="2" y="6" width="20" height="12" rx="2" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              ),
                              rightIcon: (color: string) => (
                                <svg className={`w-6 h-6 ${color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="2" y="6" width="20" height="12" rx="2" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              )
                            }
                          ].map((pay) => {
                            const isSel = posPaymentMethod === pay.id;
                            return (
                              <button
                                key={pay.id}
                                type="button"
                                onClick={() => setPosPaymentMethod(pay.id)}
                                className={cn(
                                  "w-full h-12 flex items-center border rounded-xl overflow-hidden transition-all duration-300 active:scale-98 shadow-sm text-left bg-white",
                                  isSel ? pay.borderSel : "border-zinc-200 hover:bg-zinc-50"
                                )}
                              >
                                {/* Left Brand Area */}
                                <div className={cn("w-14 h-full shrink-0 flex items-center justify-center", pay.brandBg)}>
                                  {pay.logoText}
                                </div>
                                {/* Middle Details Area */}
                                <div className="flex-1 px-3 py-1 flex flex-col justify-center min-w-0">
                                  <h4 className={cn("text-[10px] font-black uppercase tracking-wider leading-none", pay.titleColor)}>{pay.title}</h4>
                                  <span className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mt-1">{pay.subtitle}</span>
                                </div>
                                {/* Right Indicator Area */}
                                <div className="pr-4 shrink-0 flex items-center justify-center">
                                  {pay.rightIcon(isSel ? pay.titleColor : "text-zinc-300")}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <button onClick={handlePOSComplete} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 mt-2">Complete Payment</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      {modalType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/30">
              <h3 className="font-display font-black text-sm text-zinc-900 uppercase tracking-widest">
                {editingId ? 'Edit Record' :
                  modalType === 'appointment' ? 'Add Booking' :
                    modalType === 'payment' ? 'New Sale' :
                      modalType === 'client' ? 'Add Client' :
                        modalType === 'service' ? 'Add Item' :
                          modalType === 'staff' ? 'Add Staff' :
                            modalType === 'rental' ? 'Add Dress' :
                              modalType === 'expense' ? 'Add Expense' : 'Create'}
              </h3>
              <button onClick={() => setModalType(null)} className="text-zinc-400 hover:text-zinc-900 transition-colors bg-white p-1.5 rounded-lg border border-zinc-100 shadow-sm">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form className="p-6 space-y-4" onSubmit={handleModalSubmit}>
              {(modalType === 'appointment' || modalType === 'payment') && (
                <div className="space-y-6">
                  {/* Inputs Row 1 */}
                  <div className="grid grid-cols-2 gap-3">
                    <input className="w-full px-4 py-2 bg-white border border-[#F0F0F0] shadow-[0_2px_10px_rgba(0,0,0,0.01)] rounded-[14px] text-xs font-bold text-[#1E1E1E] placeholder-[#B0B0B0] focus:border-[#83215D] focus:ring-1 focus:ring-[#83215D] outline-none transition-all" placeholder="Client Name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    <input className="w-full px-4 py-2 bg-white border border-[#F0F0F0] shadow-[0_2px_10px_rgba(0,0,0,0.01)] rounded-[14px] text-xs font-bold text-[#1E1E1E] placeholder-[#B0B0B0] focus:border-[#83215D] focus:ring-1 focus:ring-[#83215D] outline-none transition-all" placeholder="Phone" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>

                  {/* Service Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#A0A0A0] uppercase tracking-widest pl-1">Service Selection</label>
                    <div className="grid grid-cols-4 gap-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                      {dbServices.map((srv, idx) => {
                        const isSelected = formData.selectedServices?.some(s => s.id === srv.id);
                        return (
                          <button 
                            key={idx} 
                            type="button" 
                            onClick={() => {
                               let currentSelected = formData.selectedServices ? [...formData.selectedServices] : [];
                               if (isSelected) {
                                  currentSelected = currentSelected.filter(s => s.id !== srv.id);
                               } else {
                                  if (currentSelected.length >= 10) {
                                    toast.error("Maximum 10 services allowed at once!");
                                    return;
                                  }
                                  currentSelected.push({ id: srv.id, name: srv.name, price: srv.price, image_url: srv.image_url });
                               }
                               const total = currentSelected.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
                               setFormData({ 
                                 ...formData, 
                                 selectedServices: currentSelected,
                                 amount: total.toString() 
                               });
                            }} 
                            className={cn(
                              "relative p-2 rounded-[14px] border shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-200 flex flex-col items-center gap-1.5", 
                              isSelected 
                                ? "border-[#83215D] bg-[#83215D]/[0.02] ring-1 ring-[#83215D]" 
                                : "border-[#F0F0F0] bg-white hover:border-[#E5E7EB] hover:shadow-md"
                            )}
                          >
                            <div className="w-full aspect-square rounded-[10px] overflow-hidden bg-[#F9FAFB] flex items-center justify-center">
                              {srv.image_url ? (
                                <img src={srv.image_url} className="w-full h-full object-cover" alt={srv.name} />
                              ) : (
                                <div className="text-[#D1D5DB]"><Sparkles className="w-5 h-5" /></div>
                              )}
                            </div>
                            <div className="w-full text-center space-y-1 pb-1 px-1">
                              <p className="text-[10px] font-black uppercase text-[#1E1E1E] leading-tight line-clamp-2">{srv.name}</p>
                              <p className="text-[11px] font-black text-[#00B828]">${srv.price}</p>
                            </div>
                            {isSelected && (
                              <div className="absolute top-2.5 right-2.5 w-4 h-4 bg-[#83215D] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                <span className="text-white text-[8px]">✓</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Date & Time Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" className="w-full px-4 py-2 bg-white border border-[#F0F0F0] shadow-[0_2px_10px_rgba(0,0,0,0.01)] rounded-[14px] text-xs font-bold text-[#1E1E1E] focus:border-[#83215D] focus:ring-1 focus:ring-[#83215D] outline-none transition-all" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                    <input type="time" className="w-full px-4 py-2 bg-white border border-[#F0F0F0] shadow-[0_2px_10px_rgba(0,0,0,0.01)] rounded-[14px] text-xs font-bold text-[#1E1E1E] focus:border-[#83215D] focus:ring-1 focus:ring-[#83215D] outline-none transition-all" required value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} />
                  </div>

                  {/* Amount Row */}
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#A0A0A0]">$</span>
                    <input type="number" className="w-full px-4 py-2 pl-8 bg-white border border-[#F0F0F0] shadow-[0_2px_10px_rgba(0,0,0,0.01)] rounded-[14px] text-sm font-black text-[#1E1E1E] focus:border-[#83215D] focus:ring-1 focus:ring-[#83215D] outline-none transition-all" placeholder="Amount" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                  </div>
                </div>
              )}

              {modalType === 'client' && (
                <div className="space-y-3">
                  <input className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-xs font-bold focus:border-primary outline-none" placeholder="Name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  <input className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-xs font-bold focus:border-primary outline-none" placeholder="Phone" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  <input className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-xs font-bold focus:border-primary outline-none" placeholder="Email (Optional)" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
              )}

              {modalType === 'service' && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="bg-zinc-50/50 p-5 rounded-2xl border border-zinc-100/60 space-y-4 shadow-sm">
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-[#5D1B54] uppercase tracking-widest px-1">Item Name</label>
                      <input className="w-full p-3.5 bg-white border border-zinc-200 shadow-sm rounded-xl text-sm font-bold text-zinc-900 focus:border-[#83215D] focus:ring-1 focus:ring-[#83215D] outline-none transition-all placeholder:text-zinc-300" placeholder="e.g. Classic Manicure" required value={formData.service} onChange={(e) => setFormData({ ...formData, service: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-[#5D1B54] uppercase tracking-widest px-1">Category</label>
                        <div className="relative">
                          <select 
                            className="w-full p-3.5 bg-white border border-zinc-200 shadow-sm rounded-xl text-sm font-bold text-zinc-900 focus:border-[#83215D] focus:ring-1 focus:ring-[#83215D] outline-none transition-all appearance-none cursor-pointer" 
                            required 
                            value={formData.category} 
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          >
                            <option value="" disabled>Select Category</option>
                            <option value="Hair">Hair Styling</option>
                            <option value="Nails">Nails & Pedicure</option>
                            <option value="Makeup">Makeup & Beauty</option>
                            <option value="Henna">Henna Art</option>
                            <option value="Massage">Massage & Spa</option>
                            <option value="Product">Retail Product</option>
                            <option value="General">General Service</option>
                          </select>
                          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-[#5D1B54] uppercase tracking-widest px-1">Price ($)</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-[#83215D]">$</span>
                          <input type="number" className="w-full p-3.5 pl-8 bg-white border border-zinc-200 shadow-sm rounded-xl text-sm font-bold text-zinc-900 focus:border-[#83215D] focus:ring-1 focus:ring-[#83215D] outline-none transition-all placeholder:text-zinc-300" placeholder="0.00" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-[#5D1B54] uppercase tracking-widest px-1">Duration / Stock</label>
                      <input className="w-full p-3.5 bg-white border border-zinc-200 shadow-sm rounded-xl text-sm font-bold text-zinc-900 focus:border-[#83215D] focus:ring-1 focus:ring-[#83215D] outline-none transition-all placeholder:text-zinc-300" placeholder="e.g. 45 mins or 10 items" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-[#5D1B54] uppercase tracking-widest px-1">Description</label>
                      <textarea className="w-full p-3.5 bg-white border border-zinc-200 shadow-sm rounded-xl text-sm font-bold text-zinc-900 focus:border-[#83215D] focus:ring-1 focus:ring-[#83215D] outline-none transition-all placeholder:text-zinc-300 min-h-[100px] resize-none" placeholder="Provide service details..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                  </div>

                  <div className="bg-zinc-50/50 p-5 rounded-2xl border border-zinc-100/60 space-y-3 shadow-sm">
                    <label className="text-[10px] font-black text-[#5D1B54] uppercase tracking-widest px-1 flex items-center gap-1.5">
                      <ImagePlus className="w-3.5 h-3.5" /> Item Photo
                    </label>
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-zinc-200 shadow-sm flex items-center justify-center overflow-hidden shrink-0 group hover:border-[#83215D]/50 transition-colors">
                        {formData.image ? (
                           <img src={formData.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                           <ImagePlus className="w-6 h-6 text-zinc-300 group-hover:text-[#83215D]/50 transition-colors" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 shadow-sm rounded-xl text-[10px] font-black uppercase tracking-widest text-[#5D1B54] hover:bg-zinc-50 hover:border-zinc-300 active:scale-95 transition-all">
                          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          {formData.image ? 'Change Photo' : 'Upload Photo'}
                        </button>
                        <p className="text-[9px] font-bold text-zinc-400 tracking-wider">Recommended: Square format (1:1), max 2MB.</p>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {modalType === 'rental' && (
                <div className="space-y-5">
                  <div className="flex flex-col items-center">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-40 rounded-2xl bg-zinc-50 border-2 border-dashed border-zinc-200 hover:border-[#5D1B54]/50 hover:bg-[#5D1B54]/5 flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-all group relative shadow-sm"
                    >
                      {formData.image ? (
                        <>
                          <img src={formData.image} className="w-full h-full object-contain" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" /> Change Photo</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-zinc-400 group-hover:text-[#5D1B54] transition-colors">
                          {uploading ? <Loader2 className="w-8 h-8 animate-spin mb-2 text-[#5D1B54]" /> : <ImagePlus className="w-8 h-8 mb-2 stroke-[1.5px]" />}
                          <span className="text-[10px] font-black uppercase tracking-widest">{uploading ? 'Uploading...' : 'Upload Dress Photo'}</span>
                        </div>
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                  </div>

                  <div className="space-y-4">
                    <div className="relative mt-2">
                      <label className="absolute -top-2 left-3 bg-white px-1 text-[9px] font-black text-zinc-400 uppercase tracking-widest z-10">Dress Title</label>
                      <input className="w-full p-4 bg-transparent border-2 border-zinc-100 rounded-xl text-sm font-bold text-zinc-900 focus:border-[#5D1B54] outline-none transition-all placeholder:text-zinc-300 shadow-sm relative z-0" placeholder="e.g. Royal Red Velvet Gown" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <label className="absolute -top-2 left-3 bg-white px-1 text-[9px] font-black text-zinc-400 uppercase tracking-widest z-10">Rental Price / Day</label>
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[12px] font-black text-zinc-400 z-10">$</div>
                        <input type="number" className="w-full p-4 pl-8 bg-transparent border-2 border-zinc-100 rounded-xl text-sm font-bold text-zinc-900 focus:border-[#5D1B54] outline-none transition-all placeholder:text-zinc-300 shadow-sm relative z-0" placeholder="0.00" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                      </div>
                      <div className="relative">
                        <label className="absolute -top-2 left-3 bg-white px-1 text-[9px] font-black text-zinc-400 uppercase tracking-widest z-10">Stock / Qty</label>
                        <input type="number" className="w-full p-4 bg-transparent border-2 border-zinc-100 rounded-xl text-sm font-bold text-zinc-900 focus:border-[#5D1B54] outline-none transition-all placeholder:text-zinc-300 shadow-sm relative z-0" placeholder="1" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <label className="absolute -top-2 left-3 bg-white px-1 text-[9px] font-black text-zinc-400 uppercase tracking-widest z-10">Color</label>
                        <input className="w-full p-4 bg-transparent border-2 border-zinc-100 rounded-xl text-sm font-bold text-zinc-900 focus:border-[#5D1B54] outline-none transition-all placeholder:text-zinc-300 shadow-sm relative z-0" placeholder="e.g. Navy Blue" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
                      </div>
                      <div className="relative">
                        <label className="absolute -top-2 left-3 bg-white px-1 text-[9px] font-black text-zinc-400 uppercase tracking-widest z-10">Size</label>
                        <input className="w-full p-4 bg-transparent border-2 border-zinc-100 rounded-xl text-sm font-bold text-zinc-900 focus:border-[#5D1B54] outline-none transition-all placeholder:text-zinc-300 shadow-sm relative z-0" placeholder="e.g. S, M, L" value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} />
                      </div>
                    </div>

                    <div className="relative">
                      <label className="absolute -top-2 left-3 bg-white px-1 text-[9px] font-black text-zinc-400 uppercase tracking-widest z-10">Description & Care Info</label>
                      <textarea className="w-full p-4 bg-transparent border-2 border-zinc-100 rounded-xl text-xs font-bold text-zinc-900 focus:border-[#5D1B54] outline-none transition-all placeholder:text-zinc-300 min-h-[100px] resize-none shadow-sm relative z-0" placeholder="Provide details about the dress material, care instructions, or any notable features..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}

              {modalType === 'staff' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <input className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-xs font-bold focus:border-primary outline-none" placeholder="Full Name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    <input className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-xs font-bold focus:border-primary outline-none" placeholder="Phone" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-xs font-bold focus:border-primary outline-none" required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}>
                      <option value="">Select Role</option>
                      <option value="Admin">Admin (Kale)</option>
                      <option value="Cashier">Cashier</option>
                      <option value="Manager">Manager</option>
                      <option value="Stylist">Stylist</option>
                    </select>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-400">$</span>
                      <input type="number" className="w-full p-3 pl-7 bg-zinc-50 border border-zinc-100 rounded-lg text-xs font-bold focus:border-primary outline-none" placeholder="Salary" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="email" className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-xs font-bold focus:border-primary outline-none" placeholder="Email (Login Name)" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    <input type="password" style={{ WebkitTextSecurity: 'disc' } as any} className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-xs font-bold focus:border-primary outline-none" placeholder="Login Password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Staff Photo</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center overflow-hidden shrink-0">
                        {formData.image ? <img src={formData.image} className="w-full h-full object-cover" /> : <div className="text-zinc-200 font-black">?</div>}
                      </div>
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-zinc-100 border border-zinc-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:bg-zinc-200 transition-all">
                        <Upload className="w-3 h-3" /> Upload
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {modalType === ('expense' as any) && (
                <div className="space-y-4">
                   <input className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-xs font-bold focus:border-primary outline-none" placeholder="Expense Title" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                   <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-400">$</span>
                      <input type="number" className="w-full p-3 pl-7 bg-zinc-50 border border-zinc-100 rounded-lg text-xs font-bold focus:border-primary outline-none" placeholder="Amount" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                    </div>
                    <select className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-xs font-bold focus:border-primary outline-none" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}>
                       <option value="General">Category</option>
                       <option value="Rent">Rent</option>
                       <option value="Supplies">Supplies</option>
                       <option value="Salary">Salary</option>
                       <option value="Utility">Utility</option>
                    </select>
                   </div>
                   <input type="date" className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-xs font-bold focus:border-primary outline-none" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>
              )}

              <button type="submit" className="w-full bg-zinc-900 text-white p-3 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg active:scale-95">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      </div>
    </>
  );
};

// ─── Walk-in Tab Component ───────────────────────────────────────────────────
function WalkinTab({
  user, allBookings, dbServices, facialImg, hairImg, nailImg, bodyImg, aromaticHenna,
  wiName, setWiName, wiPhone, setWiPhone,
  wiCart, setWiCart,
  wiSaving, setWiSaving, wiToday,
  setReceiptData, bizName, bizPhone,
  fetchWalkinToday, fetchBookings, fetchServices, getLocalDateString, supabase, toast
}: any) {
  useEffect(() => { fetchWalkinToday(); }, []);

  const saveWalkin = async () => {
    if (wiCart.length === 0) { toast.error("Please select at least one service!"); return; }
    setWiSaving(true);

    const customerName = wiName.trim() || "Guest Customer";
    const today = getLocalDateString();


    try {
      let finalCustomerId = user?.id;
      if (!finalCustomerId) {
        const { data: p } = await supabase.from('profiles').select('id').limit(1).single();
        if (p) finalCustomerId = p.id;
      }

      // Loop through all items in the cart
      for (const item of wiCart) {
        const itemServiceId = item.id?.toString?.();
        const resolvedItemServiceId = await resolveBookingServiceId(supabase, itemServiceId, item.name, {
          price: parseFloat(item.price) || 0,
          image_url: item.image_url || null,
          category: item.category || 'Walk-in',
        });
        if (!resolvedItemServiceId) throw new Error(`Unable to resolve a valid service id for cart item: ${item.name}`);

        const { error } = await supabase.from('bookings').insert([{
          name: customerName,
          phone: wiPhone || "N/A",
          service: item.name,
          service_id: resolvedItemServiceId,
          customer_id: finalCustomerId,
          booking_date: today,
          start_time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          end_time: new Date(Date.now() + 3600000).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          amount: parseFloat(item.price) || 0,
          image_url: item.image_url || null,
          status: 'pending',
          category: 'Walk-in'
        }]);
        if (error) throw error;

        // Decrement stock if product
        if (item.category === 'Product') {
          const currentStock = parseInt(item.duration) || 0;
          if (currentStock > 0) {
            await supabase.from('services').update({ duration: (currentStock - 1).toString() }).eq('id', item.id);
            fetchServices();
          }
        }
      }

      const totalValue = wiCart.reduce((sum: number, item: any) => sum + (parseFloat(item.price) || 0), 0).toFixed(2);
      setReceiptData({
        bizName, bizPhone,
        customerName: customerName,
        phone: wiPhone || "N/A",
        date: today,
        time: new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' }),
        items: [...wiCart],
        total: totalValue
      });
      setTimeout(() => { try { window.print(); } catch(e) { console.warn("Print skipped", e); } }, 500);

      toast.success(`✅ ${customerName} — Walk-in registered (${wiCart.length} item${wiCart.length > 1 ? 's' : ''})!`);
      setWiName(""); setWiPhone(""); setWiCart([]);
      fetchWalkinToday(); fetchBookings();
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally { setWiSaving(false); }
  };

  const fallbackServices = [
    { name: "Facial Treatment", price: 120, image_url: facialImg },
    { name: "Hair Styling", price: 85, image_url: hairImg },
    { name: "Nail Artistry", price: 55, image_url: nailImg },
    { name: "Body & Massage", price: 100, image_url: bodyImg },
    { name: "Henna Session", price: 65, image_url: aromaticHenna },
  ];
  const services = (dbServices.length > 0 ? dbServices : fallbackServices).filter((s: any) => s.category !== 'Product');
  const cartTotal = wiCart.reduce((sum: number, item: any) => sum + (parseFloat(item.price) || 0), 0);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center px-2">
        <h1 className="font-display text-xl font-black text-zinc-900 leading-none">Walk-in Counter</h1>
        <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600">Today: {wiToday.length}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left: Services Grid */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 space-y-4">
          <h2 className="font-display font-black text-xs text-zinc-900 uppercase tracking-widest border-b border-zinc-50 pb-2">Select Services & Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {services.map((srv: any, idx: number) => (
              <button 
                key={idx} 
                onClick={() => setWiCart([...wiCart, srv])} 
                className="group bg-zinc-50/50 p-3 rounded-2xl border border-zinc-100 transition-all text-center flex flex-col items-center gap-3 hover:border-primary/50 hover:bg-white hover:shadow-md active:scale-95"
              >
                <div className="w-16 h-16 rounded-2xl bg-white overflow-hidden border border-zinc-100 shadow-sm shrink-0">
                  {srv.image_url ? (
                    <img src={srv.image_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={srv.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-50 text-zinc-300">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 w-full space-y-0.5">
                  <p className="text-[9px] font-black text-zinc-900 uppercase truncate px-1">{srv.name}</p>
                  <p className="text-[11px] font-black text-emerald-600">${parseFloat(srv.price || 0).toFixed(2)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Cart & Checkout Form */}
        <div className="lg:col-span-4 sticky top-24 bg-white rounded-2xl border border-zinc-100 shadow-xl overflow-hidden flex flex-col h-fit max-h-[80vh]">
          <div className="p-5 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
            <h2 className="font-display font-black text-[11px] text-zinc-900 uppercase tracking-widest">Order Summary</h2>
            <span className="bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded-full">{wiCart.length} Items</span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-[150px]">
            {wiCart.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                <p className="text-[10px] font-bold text-zinc-400">Cart is empty.</p>
                <p className="text-[8px] text-zinc-400 mt-1 uppercase">Select items from the grid.</p>
              </div>
            ) : (
              wiCart.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 border border-zinc-100 rounded-xl bg-zinc-50/50 group hover:bg-white hover:border-zinc-200 transition-colors">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-[9px] font-black text-zinc-900 uppercase truncate">{item.name}</p>
                    <p className="text-[10px] font-bold text-emerald-600">${parseFloat(item.price || 0).toFixed(2)}</p>
                  </div>
                  <button 
                    onClick={() => {
                      const newCart = [...wiCart];
                      newCart.splice(idx, 1);
                      setWiCart(newCart);
                    }}
                    className="p-1.5 text-rose-300 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Total */}
          <div className="p-5 border-t border-zinc-100 bg-white space-y-4">
            <div className="flex justify-between items-end">
              <p className="text-[10px] font-black uppercase text-zinc-400">Total Amount</p>
              <p className="text-xl font-display font-black text-emerald-600 leading-none">${cartTotal.toFixed(2)}</p>
            </div>

            <button 
              onClick={saveWalkin} 
              disabled={wiSaving || wiCart.length === 0} 
              className="w-full py-4 bg-zinc-900 disabled:bg-zinc-300 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              {wiSaving ? "Processing..." : "Complete Walk-in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
