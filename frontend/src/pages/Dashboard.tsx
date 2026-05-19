import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Calendar, Users, Settings, LogOut, Menu, X,
  ChevronDown, Bell, Search, Plus, MoreHorizontal, Edit, Trash2, Copy, MoreVertical, ChevronLeft, ChevronRight,
  Phone, CheckCircle2, Check, Clock, DollarSign, Briefcase, TrendingUp,
  ArrowUpRight, ArrowDownRight, CreditCard, Sparkles, Scissors, Box, UserPlus,
  Upload, Loader2, ImagePlus, ShoppingBag, Store, AlertTriangle, Download, XCircle, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
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

type Tab = "overview" | "appointments" | "finance" | "jobs" | "clients" | "settings" | "rentals" | "reports" | "walkin" | "products" | "pos" | "staff" | "users";

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
  const [settingsSubTab, setSettingsSubTab] = useState<'staff' | 'business' | 'security' | 'database'>('business');

  const [dbClearBookings, setDbClearBookings] = useState(false);
  const [dbClearExpenses, setDbClearExpenses] = useState(false);
  const [dbClearCustomers, setDbClearCustomers] = useState(false);
  const [dbClearServices, setDbClearServices] = useState(false);
  const [dbConfirmationText, setDbConfirmationText] = useState("");
  const [dbIsClearing, setDbIsClearing] = useState(false);
  const [financeTab, setFinanceTab] = useState<'sales' | 'expenses'>(isAdmin ? 'sales' : 'expenses');
  const [financeSubTab, setFinanceSubTab] = useState<'sales' | 'expenses'>(isAdmin ? 'sales' : 'expenses');
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
    password: ""
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
    setFormData({ ...formData, name: isRental ? item.name : "", service: isRental ? "" : item.name, description: item.description || "", amount: item.price.toString(), duration: item.duration || "", image: item.image_url || "", color: item.color || "", size: item.size || "", weight_kg: item.weight_kg || "", height_cm: item.height_cm || "" });
    setModalType(isRental ? 'rental' : 'service');
  };

  const openEditBooking = (item: any) => {
    setEditingId(item.id);
    setFormData({ 
      ...formData, 
      name: item.name, 
      phone: item.phone, 
      service: item.service, 
      serviceId: item.service_id, 
      selectedServices: [{ id: item.service_id, name: item.service, price: item.amount, image_url: item.image_url }],
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

        const payloads = formData.selectedServices.map(srv => ({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          service: srv.name,
          service_id: srv.id,
          customer_id: user?.id,
          booking_date: slotDate,
          start_time: slotTime,
          end_time: addHour(slotTime),
          amount: parseFloat(srv.price) || 0,
          image_url: srv.image_url || null,
          status: 'pending'
        }));

        if (editingId) {
          const payload = payloads[0]; // when editing, we only update the single row
          const { error } = await supabase.from('bookings').update(payload).eq('id', editingId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('bookings').insert(payloads);
          if (error) throw error;
        }

        toast.success(editingId ? "Appointment updated." : "Appointment booked successfully!");
      } else if (modalType === 'service') {
        const payload: any = {
          name: formData.service || formData.name,
          price: parseFloat(formData.amount) || 0,
          image_url: formData.image || null,
          category: formData.description?.toLowerCase().includes('nail') ? 'nails' :
            formData.description?.toLowerCase().includes('beauty') ? 'beauty' :
              formData.description?.toLowerCase().includes('hair') ? 'hair' :
                formData.description?.toLowerCase().includes('makeup') ? 'makeup' :
                  formData.description?.toLowerCase().includes('henna') ? 'henna' :
                    formData.description?.toLowerCase().includes('product') || activeTab === 'products' ? 'Product' : 'General'
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

      const payload = {
        name: customerName,
        phone: wiPhone || "N/A",
        service: posCart.map(i => i.name).join(", "),
        service_id: posCart[0]?.id || null,
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
  const allBookings = bookings;
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
    { id: "walkin", label: "Walk-in", icon: UserPlus },
    { id: "pos", label: "POS", icon: Store },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "clients", label: "Clients", icon: Users },
    { id: "jobs", label: "Services", icon: Scissors },
    { id: "rentals", label: "Rentals", icon: Box },
    { id: "staff", label: "Staff", icon: Users },
    { id: "finance", label: "Finance", icon: CreditCard },
    { id: "products", label: "Products", icon: ShoppingBag },
    { id: "users", label: "User Access", icon: ShieldCheck },
    { id: "reports", label: "Sales History", icon: TrendingUp },
    { id: "settings", label: "Settings", icon: Settings },
  ] : isCashier ? [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "walkin", label: "Walk-in", icon: UserPlus },
    { id: "pos", label: "POS", icon: Store },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "clients", label: "Clients", icon: Users },
    { id: "products", label: "Products", icon: ShoppingBag },
    { id: "rentals", label: "Rentals", icon: Box },
  ] : [
    { id: "appointments", label: "My Bookings", icon: Calendar },
    { id: "rentals", label: "Rentals", icon: Box },
    { id: "products", label: "Products", icon: ShoppingBag },
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

  const allClients = customers.length > 0 ? customers : Array.from(new Set(allBookings.filter(b => b.name).map(b => b.name))).map((name, i) => {
    const userBookings = allBookings.filter(b => b.name === name);
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
        <aside className={cn(sidebarStyles, sidebarOpen ? "translate-x-0" : "-translate-x-full", "bg-[#4B0E3D] border-r-0 shadow-[10px_0_40px_rgba(0,0,0,0.1)] z-[60]")}>
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
                <span className="relative z-10">{item.label}</span>
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
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Sign Out</span>
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
              <div className="space-y-6 pb-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-2">
                  <div className="space-y-0.5">
                    <h1 className="font-display text-lg font-black tracking-tight text-zinc-900 leading-none">{bizName}</h1>
                    <p className="font-body text-zinc-400 font-medium text-[9px]">Welcome back! Overview.</p>
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 shadow-lg">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Admin Hosted</span>
                  </div>
                </div>

                {/* Low Stock Alert Banner */}
                {dbServices.filter(s => s.category === 'Product' && parseInt(s.duration) < 5).length > 0 && (
                  <div className="mx-2 p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-rose-500 text-white rounded-lg"><AlertTriangle className="w-3 h-3" /></div>
                      <div>
                        <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest">Inventory Alert</p>
                        <p className="text-[10px] font-bold text-rose-900 mt-0.5">Some products are running low on stock.</p>
                      </div>
                    </div>
                    <button onClick={() => setActiveTab('products')} className="text-[8px] font-black uppercase tracking-widest text-rose-500 hover:underline">View</button>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 px-2">
                  {(isCashier ? [
                    { label: 'My Sales', value: '$' + cashierTodayRevenue.toLocaleString(), icon: DollarSign, tag: 'INCOME', color: 'bg-emerald-500', shadow: 'shadow-emerald-500/5' },
                    { label: 'Orders', value: cashierTodayOrders, icon: CheckCircle2, tag: 'ORDERS', color: 'bg-orange-500', shadow: 'shadow-orange-500/5' },
                  ] : [
                    { label: 'Clients', value: allClients.length, icon: Users, tag: 'CLIENTS', color: 'bg-rose-500', shadow: 'shadow-rose-500/5' },
                    { label: 'Revenue', value: '$' + todayRevenue.toLocaleString(), icon: DollarSign, tag: 'INCOME', color: 'bg-emerald-500', shadow: 'shadow-emerald-500/5' },
                    { label: 'Total Expenses', value: '$' + expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0).toLocaleString(), icon: TrendingUp, tag: 'EXPENSES', color: 'bg-rose-400', shadow: 'shadow-rose-400/5' },
                    { label: 'Profit', value: '$' + (todayRevenue - expenses.filter(e => e.date === todayStr).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)).toLocaleString(), icon: CreditCard, tag: 'PROFIT', color: 'bg-indigo-500', shadow: 'shadow-indigo-500/5' }
                  ]).map((stat) => (
                    <div
                      key={stat.label}
                      className={cn(
                        "bg-white p-4 rounded-3xl border border-zinc-50 relative overflow-hidden group transition-all",
                        stat.shadow
                      )}
                    >
                      <div className="flex items-center justify-between mb-2 relative z-10">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md", stat.color)}>
                          <stat.icon className="w-4 h-4 stroke-[2.5px]" />
                        </div>
                        <span className="text-[7px] font-black uppercase tracking-widest text-zinc-300">{stat.tag}</span>
                      </div>
                      <div className="relative z-10">
                        <h3 className="font-display text-xl font-black text-zinc-900 tracking-tight mb-0.5">{stat.value}</h3>
                        <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest">{stat.label}</p>
                      </div>
                    </div>
                  ))}
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
                    <button className="flex items-center gap-1.5 bg-white border border-zinc-200 px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest text-zinc-500 hover:bg-zinc-50 transition-all shadow-sm">
                      <Download className="w-3 h-3 text-zinc-400" /> Export
                    </button>
                    <button
                      onClick={() => setModalType("appointment")}
                      className="bg-primary text-white px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 hover:bg-primary/90 active:scale-95 transition-all shadow-md shadow-primary/20"
                    >
                      <Plus className="w-3 h-3" /> Add Booking
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-100">
                          <th className="text-left py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-zinc-500">Client</th>
                          <th className="text-left py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-zinc-500">Service</th>
                          <th className="text-left py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-zinc-500">Date / Time</th>
                          <th className="text-left py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-zinc-500">Amount</th>
                          <th className="text-right py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-zinc-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {allBookings.length === 0 ? (
                          <tr><td colSpan={5} className="py-20 text-center text-zinc-300 font-bold uppercase tracking-widest bg-white/50 rounded-2xl">No schedule found</td></tr>
                        ) : (
                          allBookings.map((apt) => (
                            <tr key={apt.id} className="bg-white hover:bg-zinc-50 transition-all rounded-xl border-b border-zinc-50">
                              <td className="p-2 pl-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-100 shadow-sm">
                                  {apt.name?.[0] ? (
                                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs uppercase">{apt.name[0]}</div>
                                  ) : (
                                    <div className="w-full h-full bg-zinc-100" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-display text-sm font-black text-[#5D1B54] tracking-tight truncate">{apt.name}</div>
                                  <div className="text-[9px] font-bold text-zinc-400 tracking-widest uppercase">{apt.phone}</div>
                                </div>
                              </td>

                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  {apt.image_url && (
                                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-zinc-100 shadow-sm shrink-0">
                                      <img src={apt.image_url} className="w-full h-full object-cover" alt={apt.service} />
                                    </div>
                                  )}
                                  <div className="flex flex-col gap-1">
                                    <div className="text-[10px] font-bold text-primary/80 uppercase tracking-widest italic">{apt.service}</div>
                                    {apt.category === 'Online' && (
                                      <span className="w-fit text-[7px] font-black bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded uppercase tracking-[0.2em] border border-sky-200">Online</span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="p-4">
                                <div className="space-y-0.5">
                                  <div className="font-display text-xs font-black text-zinc-700">{apt.booking_date}</div>
                                  <div className="flex items-center gap-1 text-primary/70 font-black">
                                    <Clock className="w-3 h-3" />
                                    <span className="text-[9px] uppercase tracking-[0.1em]">{apt.start_time}</span>
                                  </div>
                                </div>
                              </td>

                              <td className="p-4">
                                <span className="font-black text-[#5D1B54] text-lg tracking-tighter">${apt.amount || 0}</span>
                              </td>

                              <td className="p-2 pr-4">
                                <div className="flex items-center gap-2 w-full justify-end">
                                  {apt.status === "pending" ? (
                                    <div className="flex gap-1">
                                      <button
                                        className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all"
                                        onClick={(e) => { e.stopPropagation(); updateStatus(apt.id, "confirmed"); }}
                                      >
                                        Confirm
                                      </button>
                                      <button
                                        className="bg-rose-50 text-rose-400 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
                                        onClick={(e) => { e.stopPropagation(); updateStatus(apt.id, "cancelled"); }}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <div className={cn(
                                      "py-1.5 px-4 rounded-lg text-center text-[9px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2 border",
                                      apt.status === "cancelled" ? "bg-white text-rose-500 border-rose-100" : "bg-white text-emerald-600 border-emerald-100"
                                    )}>
                                      {apt.status === 'confirmed' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                      {apt.status}
                                    </div>
                                  )}
                                  <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete record?')) deleteBooking(apt.id); }} className="p-2 text-zinc-300 hover:text-rose-500 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
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
                  <div className="p-4 border-b border-zinc-50 bg-zinc-50/30 flex justify-between items-center text-left">
                    <h3 className="font-display font-bold text-[9px] uppercase tracking-widest text-zinc-400">
                        {financeTab === 'sales' ? 'Recent Transactions' : 'Recent Expenses'}
                    </h3>
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
                            <th className="p-3 text-[8px] font-black uppercase tracking-widest text-zinc-400 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allBookings.filter(b => b.status === 'confirmed').slice(0, 10).map((b, i) => (
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
                                <span className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Paid</span>
                                </td>
                            </tr>
                            ))}
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
                            {expenses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-10 text-center text-zinc-400 text-[10px] font-bold uppercase tracking-widest">No expenses recorded</td>
                                </tr>
                            ) : expenses.map((e, i) => (
                            <tr key={i} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors">
                                <td className="p-3 text-[10px] font-bold text-zinc-900">{e.title}</td>
                                <td className="p-3 text-[9px] font-black text-zinc-400 uppercase">{e.category}</td>
                                <td className="p-3 text-[9px] text-zinc-400 text-center">{e.date}</td>
                                <td className="p-3 text-right font-black text-[10px] text-rose-600">-${e.amount}</td>
                                <td className="p-3 text-center">
                                    <button onClick={() => { if(confirm('Delete?')) (supabase as any).from('expenses').delete().eq('id', e.id).then(() => fetchExpenses()) }} className="text-zinc-300 hover:text-rose-500"><Trash2 className="w-3 h-3" /></button>
                                </td>
                            </tr>
                            ))}
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
                  <div className="space-y-0.5">
                    <h1 className="font-display text-xl font-black text-zinc-900 leading-none">Salon Services</h1>
                    <p className="font-body text-zinc-400 font-medium text-[9px]">Manage treatments and pricing</p>
                  </div>
                  <button onClick={() => setModalType('service')} className="bg-primary text-white px-4 py-2 rounded-lg font-body text-[9px] flex items-center gap-1.5 hover:bg-primary/90 transition-all shadow-md active:scale-95">
                    <Plus className="w-3 h-3" /> Add Service
                  </button>
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
                        {dbServices.filter(s => s.category !== 'Dress' && s.category !== 'Product').length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-10 text-center">
                              <div className="flex flex-col items-center justify-center gap-2">
                                <div className="p-4 bg-rose-50 rounded-full"><Scissors className="w-6 h-6 text-rose-200" /></div>
                                <p className="text-sm text-zinc-900 font-black font-display uppercase tracking-tight">No Services</p>
                              </div>
                            </td>
                          </tr>
                        ) : dbServices.filter(s => s.category !== 'Dress' && s.category !== 'Product').map((serv, i) => (
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
              <div className="space-y-6 pb-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-2">
                  <div className="space-y-0.5">
                    <h1 className="font-display text-xl font-black text-zinc-900 leading-none">Dress Rentals</h1>
                    <p className="font-body text-zinc-400 font-medium text-[9px]">Collection management center</p>
                  </div>
                  <button onClick={() => setModalType('rental')} className="bg-primary text-white px-4 py-2 rounded-lg font-body text-[9px] flex items-center gap-1.5 hover:bg-primary/90 transition-all shadow-md active:scale-95">
                    <Plus className="w-3 h-3" /> Add Rental
                  </button>
                </div>

                <div className={cardStyles}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 bg-[#FAFAFA]">
                          <th className="text-left p-4 font-body text-[8px] text-primary font-semibold uppercase tracking-wider">Image</th>
                          <th className="text-left p-4 font-body text-[8px] text-primary font-semibold uppercase tracking-wider">Dress Name</th>
                          <th className="text-center p-4 font-body text-[8px] text-primary font-semibold uppercase tracking-wider">Price</th>
                          <th className="text-center p-4 font-body text-[8px] text-primary font-semibold uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dbServices.filter(s => s.category === 'Dress').length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-10 text-center text-primary/60 font-body text-[10px]">No dresses yet.</td>
                          </tr>
                        ) : dbServices.filter(s => s.category === 'Dress').map((dress, i) => (
                          <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-primary/[0.02] transition-colors group">
                            <td className="p-4">
                              <div className="w-10 h-10 bg-zinc-50 rounded-lg border border-zinc-100 overflow-hidden flex items-center justify-center">
                                {dress.image_url ? <img src={dress.image_url} className="w-full h-full object-cover" alt="Dress" /> : <Box className="w-4 h-4 text-zinc-200" />}
                              </div>
                            </td>
                            <td className="p-4">
                              <p className="font-display font-bold text-[10px] text-zinc-900 uppercase tracking-tight">{dress.name}</p>
                            </td>
                            <td className="p-4 text-center">
                              <p className="text-[10px] font-black text-emerald-600">${dress.price}</p>
                            </td>
                            <td className="p-4 text-center">
                              <button onClick={() => deleteService(dress.id)} className="p-2 text-rose-300 hover:text-rose-600 transition-all"><Trash2 className="w-3 h-3" /></button>
                              <button onClick={() => openEditService(dress, true)} className="p-2 text-zinc-300 hover:text-primary transition-all"><Edit className="w-3 h-3" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
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
                          {profiles.length === 0 ? (
                            <tr><td colSpan={5} className="p-10 text-center text-[10px] text-zinc-400">No staff found.</td></tr>
                          ) : profiles.map((s, i) => (
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
              <div className="space-y-8 pb-12 px-2 max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-100 pb-5">
                  <div>
                    <h1 className="font-display text-2xl font-black text-zinc-950 tracking-tight">Settings</h1>
                    <p className="font-body text-zinc-400 font-medium text-[10px] mt-0.5 uppercase tracking-wider">Configure your salon system preferences</p>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-zinc-100/80 p-1 rounded-xl border border-zinc-200 shadow-sm">
                    {[
                      { id: 'business', label: 'Salon Profile', icon: Store },
                      { id: 'security', label: 'Security & Access', icon: ShieldCheck },
                      { id: 'database', label: 'Data Reset', icon: Trash2 },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setSettingsSubTab(tab.id as any)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                          settingsSubTab === tab.id 
                            ? "bg-zinc-900 text-white shadow-md transform scale-102" 
                            : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50"
                        )}
                      >
                        <tab.icon className={cn("w-3.5 h-3.5", settingsSubTab === tab.id ? "text-white" : "text-zinc-400")} />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {settingsSubTab === 'business' && (
                  <div className="grid md:grid-cols-2 gap-8 animate-in fade-in-50 slide-in-from-bottom-5 duration-300">
                    {/* Salon Identity Card */}
                    <div className={cardStyles + " p-8 space-y-6 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 border-zinc-100/50"}>
                      <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
                        <div className="p-2.5 bg-zinc-900 text-white rounded-xl shadow-md">
                          <Store className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-950">Salon Identity</h2>
                          <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Publicly visible details</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Salon Name</label>
                          <input 
                            type="text" 
                            className="w-full p-3.5 bg-zinc-50 hover:bg-zinc-100/50 focus:bg-white rounded-xl text-xs font-bold border border-zinc-200/80 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 outline-none transition-all duration-200 text-zinc-900" 
                            value={bizName} 
                            onChange={(e) => setBizName(e.target.value)}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Salon Contact Phone</label>
                          <input 
                            type="text" 
                            className="w-full p-3.5 bg-zinc-50 hover:bg-zinc-100/50 focus:bg-white rounded-xl text-xs font-bold border border-zinc-200/80 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 outline-none transition-all duration-200 text-zinc-900" 
                            value={bizPhone} 
                            onChange={(e) => setBizPhone(e.target.value)}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Salon Email</label>
                          <input 
                            type="email" 
                            className="w-full p-3.5 bg-zinc-50 hover:bg-zinc-100/50 focus:bg-white rounded-xl text-xs font-bold border border-zinc-200/80 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 outline-none transition-all duration-200 text-zinc-900" 
                            value={bizEmail} 
                            onChange={(e) => setBizEmail(e.target.value)}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Salon Physical Address</label>
                          <input 
                            type="text" 
                            className="w-full p-3.5 bg-zinc-50 hover:bg-zinc-100/50 focus:bg-white rounded-xl text-xs font-bold border border-zinc-200/80 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 outline-none transition-all duration-200 text-zinc-900" 
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
                            toast.success("Salon Identity Successfully Saved! ✨");
                          }}
                          className="bg-zinc-900 text-white w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-850 active:scale-[0.98] transition-all shadow-lg shadow-zinc-900/10 mt-2"
                        >
                          Save Identity
                        </button>
                      </div>
                    </div>

                    {/* Operational Configuration Card */}
                    <div className={cardStyles + " p-8 space-y-6 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 border-zinc-100/50"}>
                      <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
                        <div className="p-2.5 bg-primary text-white rounded-xl shadow-md">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-950">Operations & Limits</h2>
                          <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Control operational thresholds</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Opening Time</label>
                            <input 
                              type="time" 
                              className="w-full p-3.5 bg-zinc-50 hover:bg-zinc-100/50 focus:bg-white rounded-xl text-xs font-bold border border-zinc-200/80 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 outline-none transition-all text-zinc-900" 
                              value={bizHoursStart} 
                              onChange={(e) => setBizHoursStart(e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Closing Time</label>
                            <input 
                              type="time" 
                              className="w-full p-3.5 bg-zinc-50 hover:bg-zinc-100/50 focus:bg-white rounded-xl text-xs font-bold border border-zinc-200/80 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 outline-none transition-all text-zinc-900" 
                              value={bizHoursEnd} 
                              onChange={(e) => setBizHoursEnd(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Booking Double-Booking Cap */}
                        <div className="space-y-2 bg-[#FAFAFA] p-4 rounded-xl border border-zinc-100/50 mt-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-[10px] font-black text-zinc-950 uppercase tracking-widest">Double-Booking Cap</label>
                              <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Maximum bookings allowed per slot</p>
                            </div>
                            <input 
                              type="number" 
                              min="1"
                              max="10"
                              className="w-16 p-2 bg-white text-center rounded-lg text-xs font-black border border-zinc-200 focus:border-zinc-950 outline-none"
                              value={maxBookingsPerSlot} 
                              onChange={(e) => setMaxBookingsPerSlot(parseInt(e.target.value, 10) || 1)}
                            />
                          </div>
                          
                          <div className="flex items-start gap-2 bg-amber-50/50 border border-amber-100 p-2.5 rounded-lg mt-2">
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
                            toast.success("Operational Configuration Saved Successfully! 🚀");
                          }}
                          className="bg-zinc-900 text-white w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-850 active:scale-[0.98] transition-all shadow-lg shadow-zinc-900/10 mt-4"
                        >
                          Save Configurations
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {settingsSubTab === 'security' && (
                  <div className="grid md:grid-cols-2 gap-8 animate-in fade-in-50 slide-in-from-bottom-5 duration-300">
                    {/* Change Password Card */}
                    <div className={cardStyles + " p-8 space-y-6 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 border-zinc-100/50"}>
                      <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
                        <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-md">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-950">Change Password</h2>
                          <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Secure your admin credentials</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">New Password</label>
                          <input 
                            type="password" 
                            style={{ WebkitTextSecurity: 'disc' } as any}
                            placeholder="••••••••"
                            className="w-full p-3.5 bg-zinc-50 hover:bg-zinc-100/50 focus:bg-white rounded-xl text-xs font-bold border border-zinc-200/80 focus:border-[#83215D] focus:ring-1 focus:ring-[#83215D] outline-none transition-all duration-200 text-zinc-900" 
                            value={newPassword} 
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Confirm New Password</label>
                          <input 
                            type="password" 
                            style={{ WebkitTextSecurity: 'disc' } as any}
                            placeholder="••••••••"
                            className="w-full p-3.5 bg-zinc-50 hover:bg-zinc-100/50 focus:bg-white rounded-xl text-xs font-bold border border-zinc-200/80 focus:border-[#83215D] focus:ring-1 focus:ring-[#83215D] outline-none transition-all duration-200 text-zinc-900" 
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
                          className="bg-[#83215D] text-white w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#721b50] active:scale-[0.98] transition-all shadow-lg shadow-[#83215D]/10 mt-4"
                        >
                          Update Password
                        </button>
                      </div>
                    </div>

                    {/* Security Overview / Session Card */}
                    <div className={cardStyles + " p-8 space-y-6 bg-zinc-950 border-zinc-800 text-white shadow-xl flex flex-col justify-between"}>
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                          <div className="p-2.5 bg-white/10 text-white rounded-xl">
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                            <h2 className="text-xs font-black uppercase tracking-widest text-white">Security Status</h2>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Real-time session security</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                            <div>
                              <p className="text-[9px] font-black uppercase text-zinc-400">Current Login User</p>
                              <p className="text-xs font-bold mt-1 text-white">{activeEmail || "admin@example.com"}</p>
                            </div>
                            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-full">ADMIN ACC</span>
                          </div>

                          <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                            <div>
                              <p className="text-[9px] font-black uppercase text-zinc-400">Session Status</p>
                              <p className="text-xs font-bold mt-1 text-white">Connected from Mogadishu</p>
                            </div>
                            <span className="inline-flex items-center gap-1.5 text-[8px] font-black text-emerald-400 uppercase tracking-widest">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                              Active Now
                            </span>
                          </div>

                          <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                            <div>
                              <p className="text-[9px] font-black uppercase text-zinc-400">Two-Factor Authentication</p>
                              <p className="text-xs font-bold mt-1 text-white">OTP Verification via Email</p>
                            </div>
                            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-full">ENABLED</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-zinc-900 mt-6">
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest text-center">
                          Secured by Supabase Authentication Protocol
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {settingsSubTab === 'database' && (
                  <div className="max-w-xl mx-auto bg-white rounded-3xl border border-zinc-100 shadow-2xl p-8 space-y-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-300">
                    <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
                      <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl shadow-sm">
                        <Trash2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-950">System Data Maintenance</h2>
                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Carefully reset system tables</p>
                      </div>
                    </div>

                    <div className="bg-rose-50/50 border border-rose-100/80 p-4 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-rose-800">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Crucial Warning!</span>
                      </div>
                      <p className="text-[9px] font-bold text-rose-700 uppercase tracking-wide leading-relaxed">
                        Data deletion is permanent and cannot be undone. Please double check the selected data before clicking the button.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Select the Data You Want to Delete:</label>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setDbClearBookings(!dbClearBookings)}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-xl border transition-all text-left",
                            dbClearBookings 
                              ? "bg-rose-50/50 border-rose-200 text-rose-950 shadow-sm" 
                              : "bg-zinc-50 border-zinc-200/80 text-zinc-600 hover:bg-zinc-100/50"
                          )}
                        >
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-wider">Bookings & POS</p>
                            <p className="text-[8px] font-semibold text-zinc-400 uppercase">Bookings & POS Sales</p>
                          </div>
                          <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center transition-all", dbClearBookings ? "bg-rose-600 border-rose-600 text-white" : "border-zinc-300 bg-white")}>
                            {dbClearBookings && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDbClearExpenses(!dbClearExpenses)}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-xl border transition-all text-left",
                            dbClearExpenses 
                              ? "bg-rose-50/50 border-rose-200 text-rose-950 shadow-sm" 
                              : "bg-zinc-50 border-zinc-200/80 text-zinc-600 hover:bg-zinc-100/50"
                          )}
                        >
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-wider">Expenses</p>
                            <p className="text-[8px] font-semibold text-zinc-400 uppercase">System Expenses</p>
                          </div>
                          <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center transition-all", dbClearExpenses ? "bg-rose-600 border-rose-600 text-white" : "border-zinc-300 bg-white")}>
                            {dbClearExpenses && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDbClearCustomers(!dbClearCustomers)}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-xl border transition-all text-left",
                            dbClearCustomers 
                              ? "bg-rose-50/50 border-rose-200 text-rose-950 shadow-sm" 
                              : "bg-zinc-50 border-zinc-200/80 text-zinc-600 hover:bg-zinc-100/50"
                          )}
                        >
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-wider">Customers</p>
                            <p className="text-[8px] font-semibold text-zinc-400 uppercase">Customer List</p>
                          </div>
                          <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center transition-all", dbClearCustomers ? "bg-rose-600 border-rose-600 text-white" : "border-zinc-300 bg-white")}>
                            {dbClearCustomers && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDbClearServices(!dbClearServices)}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-xl border transition-all text-left",
                            dbClearServices 
                              ? "bg-rose-50/50 border-rose-200 text-rose-950 shadow-sm" 
                              : "bg-zinc-50 border-zinc-200/80 text-zinc-600 hover:bg-zinc-100/50"
                          )}
                        >
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-wider">Services & Products</p>
                            <p className="text-[8px] font-semibold text-zinc-400 uppercase">Services & Products</p>
                          </div>
                          <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center transition-all", dbClearServices ? "bg-rose-600 border-rose-600 text-white" : "border-zinc-300 bg-white")}>
                            {dbClearServices && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Confirm Deletion:</label>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider pl-1">
                        Please type the word <span className="text-rose-600 font-extrabold font-mono text-[9px] bg-rose-50 px-1 py-0.5 rounded border border-rose-200/50">CLEAR</span> to authorize data deletion.
                      </p>
                      <input 
                        type="text" 
                        placeholder="Type CLEAR here..."
                        className="w-full p-4 bg-zinc-50 hover:bg-zinc-100/50 focus:bg-white rounded-xl text-xs font-bold border border-zinc-200 focus:border-rose-600 focus:ring-1 focus:ring-rose-600 outline-none transition-all duration-200 text-zinc-900 placeholder:text-zinc-300" 
                        value={dbConfirmationText} 
                        onChange={(e) => setDbConfirmationText(e.target.value)}
                      />
                    </div>

                    <button 
                      onClick={handleClearDatabase}
                      disabled={dbIsClearing || dbConfirmationText.toUpperCase() !== 'CLEAR' || (!dbClearBookings && !dbClearExpenses && !dbClearCustomers && !dbClearServices)}
                      className="w-full py-4 bg-rose-600 disabled:bg-zinc-200 disabled:text-zinc-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 active:scale-[0.98] transition-all shadow-xl shadow-rose-600/10 mt-2 flex items-center justify-center gap-2"
                    >
                      {dbIsClearing ? "Deleting in progress..." : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Selected Data
                        </>
                      )}
                    </button>
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
                        {profiles.length === 0 ? (
                          <tr><td colSpan={4} className="p-10 text-center text-[10px] text-zinc-400">No users found.</td></tr>
                        ) : profiles.map((u, i) => (
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white border-b border-zinc-100">
                    <h2 className="text-xl font-display font-medium text-[#1E1E1E]">Transaction History</h2>
                    <div className="flex items-center gap-3 mt-4 sm:mt-0">
                      <button onClick={downloadTransactionsCSV} className="flex items-center gap-2 bg-[#2D5BFF] hover:bg-[#2D5BFF]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Download as <ChevronDown className="w-4 h-4 ml-1" />
                      </button>
                      <button onClick={() => setReportsSortLatest(!reportsSortLatest)} className="flex items-center gap-2 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#4B5563] px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        {reportsSortLatest ? "Sort by Latest" : "Sort by Oldest"} <ChevronDown className="w-4 h-4 ml-1" />
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
                          const filtered = allBookings.filter(b => b.status === 'confirmed').sort((a,b) => {
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
                      const filtered = allBookings.filter(b => b.status === 'confirmed');
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
                        {dbServices.filter(s => s.category === 'Product').map((prod, i) => (
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
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Lacag Bixinta (Payment Method)</label>
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
                                    toast.error("Waa ugu badnaan 10 adeeg mar qura!");
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

              {(modalType === 'service' || modalType === 'rental') && (
                <div className="space-y-4">
                  <input className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-xs font-bold focus:border-primary outline-none" placeholder="Item Name" required value={modalType === 'service' ? formData.service : formData.name} onChange={(e) => setFormData(modalType === 'service' ? { ...formData, service: e.target.value } : { ...formData, name: e.target.value })} />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-400">$</span>
                      <input type="number" className="w-full p-3 pl-7 bg-zinc-50 border border-zinc-100 rounded-lg text-xs font-bold focus:border-primary outline-none" placeholder="Price" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                    </div>
                    <input className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-xs font-bold focus:border-primary outline-none" placeholder="Duration/Stock" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} />
                  </div>
                  <textarea className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-xs font-bold focus:border-primary outline-none min-h-[80px]" placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />

                  {modalType === 'rental' && (
                    <div className="grid grid-cols-2 gap-3">
                      <input className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-xs font-bold focus:border-primary outline-none" placeholder="Color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
                      <input className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-xs font-bold focus:border-primary outline-none" placeholder="Size" value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Image</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-zinc-50 border-2 border-dashed border-zinc-100 flex items-center justify-center overflow-hidden shrink-0">
                        {formData.image ? <img src={formData.image} className="w-full h-full object-cover" /> : <ImagePlus className="w-5 h-5 text-zinc-200" />}
                      </div>
                      <div className="flex-1">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-zinc-100 border border-zinc-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:bg-zinc-200 transition-all">
                          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                          {formData.image ? 'Change Image' : 'Upload Image'}
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                      </div>
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
        const { error } = await supabase.from('bookings').insert([{
          name: customerName,
          phone: wiPhone || "N/A",
          service: item.name,
          service_id: item.id,
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

