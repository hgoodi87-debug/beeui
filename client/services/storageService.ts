
import { db, storage } from '../firebaseApp';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, onSnapshot, setDoc, writeBatch, orderBy, limit, getDoc, or } from "firebase/firestore";
import { BookingState, BookingStatus, LocationOption, TermsPolicyData, PrivacyPolicyData, HeroConfig, PriceSettings, GoogleCloudConfig, PartnershipInquiry, CashClosing, Expenditure, AdminUser, StorageTier, ChatMessage, DiscountCode, ChatSession } from "../types";
import { LOCATIONS as INITIAL_LOCATIONS } from "../constants";

// Keys for LocalStorage (Only for minimal config cache if needed, but largely removed)
const KEYS = {
  CLOUD_CONFIG: 'beeliber_cloud_config',
};

const DEFAULT_CLOUD_CONFIG: GoogleCloudConfig = {
  apiKey: "AIzaSyCWCnernI5QA1UGRI080vjlzBEVpevAzt0",
  authDomain: "beeliber-main.firebaseapp.com",
  projectId: "beeliber-main",
  storageBucket: "beeliber-main.firebasestorage.app",
  messagingSenderId: "591358308612",
  appId: "1:591358308612:web:fb3928d12b0e1bb000a051",
  measurementId: "G-PQBL1SG842",
  isActive: true, // Force Active
  enableGeminiAutomation: true,
  googleChatWebhookUrl: 'https://chat.googleapis.com/v1/spaces/AAQAYv-uO-w/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=PvUyJgNn0B7fB4AYJ-TLq18cSTnl3qykj3YshKpj-_Y'
};

// Helper for safe JSON parse (utility)
const safeJsonParse = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch { return fallback; }
};

export const StorageService = {
  // --- Configuration ---
  saveCloudConfig: (config: GoogleCloudConfig) => {
    localStorage.setItem(KEYS.CLOUD_CONFIG, JSON.stringify(config));
    window.location.reload();
  },

  getCloudConfig: (): GoogleCloudConfig | null => {
    // Return env config or saved config, forcing active
    const saved = safeJsonParse<GoogleCloudConfig | null>(KEYS.CLOUD_CONFIG, null);
    return saved ? { ...saved, isActive: true } : { ...DEFAULT_CLOUD_CONFIG, isActive: true };
  },

  uploadFile: async (file: File | Blob, path: string): Promise<string> => {
    try {
      console.log("[Storage] Starting upload to:", path);
      // Ensure we have some level of auth context (Anonymous or regular)
      const { ensureAuth } = await import('../firebaseApp');
      await ensureAuth();

      const storageRef = ref(storage, path);
      console.log("[Storage] Uploading bytes (Size:", file.size, ")...");
      const metadata = {
        contentType: (file as File).type || 'application/octet-stream',
      };

      await uploadBytes(storageRef, file, metadata);
      console.log("[Storage] Upload success, getting URL...");
      return await getDownloadURL(storageRef);
    } catch (e: any) {
      console.error("[Storage] Critical Upload Error:", e);
      // Detailed error reporting to user
      let errMsg = e.message || "Unknown error";
      if (e.code === 'storage/unauthenticated') {
        errMsg = "인증되지 않은 사용자입니다. (Anonymous Auth 확인 필요)";
      } else if (e.code === 'storage/unauthorized') {
        errMsg = "업로드 권한이 없습니다. (Storage Rules 확인 필요)";
      } else if (e.code === 'storage/retry-limit-exceeded') {
        errMsg = "업로드 시간이 초과되었습니다. 네트워크 상태를 확인하세요.";
      }

      alert(`[파일 업로드 오류]\n코드: ${e.code}\n메시지: ${errMsg}`);
      throw e;
    }
  },


  // --- Bookings ---
  saveBooking: async (booking: BookingState): Promise<void> => {
    const safeBooking = JSON.parse(JSON.stringify(booking));

    try {
      // Ensure Auth exists before writing
      const { ensureAuth } = await import('../firebaseApp');
      await ensureAuth();

      if (booking.id) {
        await setDoc(doc(db, "bookings", booking.id), safeBooking);
      } else {
        // Generate Custom ID: ORIGIN-DEST-RANDOM4
        try {
          // Get shortCodes from INITIAL_LOCATIONS constant for speed and consistency
          const getCode = (id: string) => INITIAL_LOCATIONS.find(l => l.id === id)?.shortCode || id.substring(0, 3).toUpperCase();

          const originCode = getCode(booking.pickupLocation || '');
          const destId = booking.serviceType === 'DELIVERY' ? booking.dropoffLocation : booking.pickupLocation;
          const destCode = booking.serviceType === 'DELIVERY'
            ? (booking.dropoffLocation ? getCode(booking.dropoffLocation) : (booking.serviceType === 'DELIVERY' ? 'ADDR' : 'UNK'))
            : originCode;

          // Generate 4 random digits
          const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
          const newId = `${originCode}-${destCode}-${randomStr}`;

          safeBooking.id = newId;
          safeBooking.createdAt = new Date().toISOString();
          await setDoc(doc(db, "bookings", newId), safeBooking);
        } catch (genError) {
          console.error("ID Gen Failed, fallback to auto-ID", genError);
          await addDoc(collection(db, "bookings"), safeBooking);
        }
      }
    } catch (e) {
      console.error("Cloud Save Failed (Booking):", e);
      throw e;
    }
  },

  getBookings: async (): Promise<BookingState[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, "bookings"));
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BookingState));
    } catch (e) {
      console.error("Error fetching bookings from cloud", e);
      return [];
    }
  },

  getBookingsByDate: async (date: string): Promise<BookingState[]> => {
    try {
      const q = query(collection(db, "bookings"), where("pickupDate", "==", date));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BookingState));
    } catch (e) {
      console.error("Error fetching bookings by date", e);
      return [];
    }
  },

  getBookingsByCreationDate: async (date: string): Promise<BookingState[]> => {
    try {
      const q = query(collection(db, "bookings"), where("createdAt", ">=", date), where("createdAt", "<", date + 'z'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BookingState));
    } catch (e) {
      console.error("Error fetching bookings by creation date", e);
      return [];
    }
  },

  subscribeBookings: (callback: (data: BookingState[]) => void): (() => void) => {
    try {
      const q = query(collection(db, "bookings"), orderBy("pickupDate", "desc"), limit(1000));
      return onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BookingState));
        // Sort in memory to be safe against index issues
        bookings.sort((a, b) => new Date(b.pickupDate || '').getTime() - new Date(a.pickupDate || '').getTime());
        callback(bookings);
      }, (error) => {
        console.error("Booking subscription error:", error);
        // Fallback for missing index
        const simpleQ = query(collection(db, "bookings"), limit(1000));
        onSnapshot(simpleQ, (snap) => {
          const bks = snap.docs.map(d => ({ ...d.data(), id: d.id } as BookingState));
          bks.sort((a, b) => new Date(b.pickupDate || '').getTime() - new Date(a.pickupDate || '').getTime());
          callback(bks);
        });
      });
    } catch (e) {
      console.error("Failed to subscribe bookings", e);
      return () => { };
    }
  },

  subscribeBookingsByLocation: (locationId: string, callback: (data: BookingState[]) => void): (() => void) => {
    try {
      // OR query: pickupLocation is ID OR dropoffLocation is ID
      const q = query(
        collection(db, "bookings"),
        or(
          where("pickupLocation", "==", locationId),
          where("dropoffLocation", "==", locationId)
        ),
        orderBy("pickupDate", "desc"),
        limit(500)
      );
      return onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BookingState));
        bookings.sort((a, b) => new Date(b.pickupDate || '').getTime() - new Date(a.pickupDate || '').getTime());
        callback(bookings);
      }, (error) => {
        console.error("Location booking sub error, falling back to simple filter:", error);
        // Fallback for cases without composite indices or older environments
        const simpleQ = query(
          collection(db, "bookings"),
          or(
            where("pickupLocation", "==", locationId),
            where("dropoffLocation", "==", locationId)
          )
        );
        return onSnapshot(simpleQ, (snapshot) => {
          const bks = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BookingState));
          bks.sort((a, b) => new Date(b.pickupDate || '').getTime() - new Date(a.pickupDate || '').getTime());
          callback(bks);
        });
      });
    } catch (e) {
      console.error("Failed to subscribe bookings by location", e);
      return () => { };
    }
  },

  updateBooking: async (id: string, updates: Partial<BookingState>): Promise<void> => {
    const safeUpdates = JSON.parse(JSON.stringify(updates));
    const bookingRef = doc(db, "bookings", id);
    await updateDoc(bookingRef, safeUpdates);
  },

  searchBookingsByEmail: async (email: string): Promise<BookingState[]> => {
    try {
      const q = query(collection(db, "bookings"), where("userEmail", "==", email));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BookingState));
    } catch (e) {
      console.error("Search error", e);
      return [];
    }
  },

  searchBookingsByNameAndEmail: async (name: string, email: string): Promise<BookingState[]> => {
    try {
      const q = query(
        collection(db, "bookings"),
        where("userEmail", "==", email),
        where("userName", "==", name)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BookingState));
    } catch (e) {
      console.error("Search by name/email error", e);
      return [];
    }
  },

  cancelBooking: async (id: string): Promise<void> => {
    try {
      const bookingRef = doc(db, "bookings", id);
      await updateDoc(bookingRef, { status: BookingStatus.CANCELLED });
    } catch (e) {
      console.error("Cancel error", e);
      throw e;
    }
  },

  // --- Locations ---
  getLocations: async (): Promise<LocationOption[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, "locations"));

      // Sync Logic: Only use locations that exist in the database.
      // "Ghost" locations (in code but not in DB) will NOT be shown.
      if (querySnapshot.empty) {
        console.log("[Storage] Cloud locations empty. Returning empty list per sync policy.");
        return [];
      }

      const mergedLocations = querySnapshot.docs.map(doc => {
        const cloudLoc = { ...doc.data(), id: doc.id } as unknown as LocationOption;
        const initialLoc = INITIAL_LOCATIONS.find(l => l.id === cloudLoc.id);

        if (initialLoc) {
          // Enrich DB data with local data (translations, static info)
          // Priority: Cloud Data -> Initial Data (Fallback for empty strings)
          // We iterate keys of initialLoc to fill in gaps if cloudLoc has empty/undefined values.
          const enriched = { ...cloudLoc };

          Object.keys(initialLoc).forEach((key) => {
            const k = key as keyof LocationOption;
            // If cloud data is missing or empty string, use initial data
            if (enriched[k] === undefined || enriched[k] === "" || enriched[k] === null) {
              (enriched as any)[k] = initialLoc[k];
            }
          });

          return enriched;
        }
        return cloudLoc;
      });

      console.log("[Storage] Loaded & Synced", mergedLocations.length, "locations from cloud.");
      return mergedLocations;
    } catch (e) {
      console.error("Error fetching locations from cloud", e);
      // On error, we might want to return empty or fallback. 
      // But for resilience, let's return [] to avoid confusing UI.
      return [];
    }
  },

  syncLocationsWithConstants: async (): Promise<void> => {
    try {
      console.log("[Storage] Starting Full Sync from Constants to DB...");
      const batch = writeBatch(db);

      INITIAL_LOCATIONS.forEach(loc => {
        const locRef = doc(db, "locations", loc.id);
        const dataToSave = JSON.parse(JSON.stringify(loc)); // Deep copy & sanitization

        // Remove NaNs or undefineds just in case
        if (Number.isNaN(dataToSave.lat)) delete dataToSave.lat;
        if (Number.isNaN(dataToSave.lng)) delete dataToSave.lng;

        // Use setDoc with merge: true to update existing or create new
        batch.set(locRef, dataToSave, { merge: true });
      });

      await batch.commit();
      console.log("[Storage] Full Sync Completed Successfully.");
    } catch (e) {
      console.error("[Storage] Full Sync Failed:", e);
      throw e;
    }
  },

  saveLocation: async (location: LocationOption): Promise<void> => {
    const sanitized = { ...location };
    // Remove NaNs which Firestore hates
    if (Number.isNaN(sanitized.lat)) delete sanitized.lat;
    if (Number.isNaN(sanitized.lng)) delete sanitized.lng;
    const safeLocation = JSON.parse(JSON.stringify(sanitized));

    try {
      // Allow saving with custom ID if provided, else it's a new doc if no ID? 
      // AdminDashboard usually provides ID.
      if (!safeLocation.id) throw new Error("Location ID required");
      await setDoc(doc(db, "locations", safeLocation.id), safeLocation);
    } catch (e) {
      console.error("Cloud Save Failed (Location):", e);
      throw e;
    }
  },

  deleteLocation: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, "locations", id));
    } catch (e) {
      console.error("Cloud Delete Failed:", e);
      throw e;
    }
  },

  // --- Storage Tiers ---
  getStorageTiers: async (): Promise<StorageTier[] | null> => {
    try {
      const snap = await getDoc(doc(db, "settings", "storage_tiers"));
      if (snap.exists()) {
        const data = snap.data();
        return data.tiers || null;
      }
      return null;
    } catch (e) {
      console.error("Failed to get storage tiers", e);
      return null;
    }
  },

  saveStorageTiers: async (tiers: StorageTier[]): Promise<void> => {
    try {
      await setDoc(doc(db, "settings", "storage_tiers"), { tiers });
    } catch (e) {
      console.error("Failed to save storage tiers", e);
      throw e;
    }
  },

  // --- Hero Config ---
  getHeroConfig: async (): Promise<HeroConfig | null> => {
    try {
      const snap = await getDoc(doc(db, "settings", "hero"));
      return snap.exists() ? snap.data() as HeroConfig : null;
    } catch { return null; }
  },

  // --- Price Settings ---
  getDeliveryPrices: async (): Promise<PriceSettings | null> => {
    try {
      const snap = await getDoc(doc(db, "settings", "delivery_prices"));
      if (snap.exists()) {
        return snap.data() as PriceSettings;
      }
      return null;
    } catch (e) {
      console.error("Failed to get delivery prices", e);
      return null;
    }
  },

  saveDeliveryPrices: async (prices: PriceSettings): Promise<void> => {
    try {
      await setDoc(doc(db, "settings", "delivery_prices"), prices);
    } catch (e) {
      console.error("Failed to save delivery prices", e);
      throw e;
    }
  },

  saveHeroConfig: async (config: HeroConfig) => {
    try {
      await setDoc(doc(db, "settings", "hero"), config);
    } catch (e) { console.error("Hero save failed", e); }
  },

  subscribeHeroConfig: (callback: (config: HeroConfig | null) => void): (() => void) => {
    try {
      const heroRef = doc(db, "settings", "hero");
      return onSnapshot(heroRef, (snap) => {
        if (snap.exists()) {
          callback(snap.data() as HeroConfig);
        } else {
          callback(null);
        }
      });
    } catch (e) {
      console.error("Failed to subscribe hero config", e);
      return () => { };
    }
  },

  // --- Inquiries ---
  getInquiries: async (): Promise<PartnershipInquiry[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, "inquiries"));
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PartnershipInquiry));
    } catch (e) { return []; }
  },

  subscribeInquiries: (callback: (data: PartnershipInquiry[]) => void): (() => void) => {
    try {
      const q = query(collection(db, "inquiries"));
      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PartnershipInquiry));
        items.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        callback(items);
      }, (error) => console.error(error));
    } catch (e) { return () => { }; }
  },

  saveInquiry: async (inquiry: PartnershipInquiry): Promise<void> => {
    const safeInquiry = JSON.parse(JSON.stringify(inquiry));
    try {
      if (inquiry.id) {
        await setDoc(doc(db, "inquiries", inquiry.id), safeInquiry);
      } else {
        await addDoc(collection(db, "inquiries"), safeInquiry);
      }
    } catch (e) { throw e; }
  },

  deleteInquiry: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, "inquiries", id));
    } catch (e) {
      console.error("Failed to delete inquiry", e);
      throw e;
    }
  },

  // --- Privacy & Terms ---
  getPrivacyPolicy: async (): Promise<PrivacyPolicyData | null> => {
    try {
      const snap = await getDoc(doc(db, "settings", "privacy_policy"));
      return snap.exists() ? snap.data() as PrivacyPolicyData : null;
    } catch { return null; }
  },

  savePrivacyPolicy: async (data: PrivacyPolicyData): Promise<void> => {
    await setDoc(doc(db, "settings", "privacy_policy"), data);
  },

  getTermsPolicy: async (): Promise<TermsPolicyData | null> => {
    try {
      const snap = await getDoc(doc(db, "settings", "terms_policy"));
      return snap.exists() ? snap.data() as TermsPolicyData : null;
    } catch { return null; }
  },

  saveTermsPolicy: async (data: TermsPolicyData): Promise<void> => {
    await setDoc(doc(db, "settings", "terms_policy"), data);
  },

  // Migration support (One-way from legacy local to cloud)
  migrateLocalToCloud: async (): Promise<void> => {
    // No-op or implementation if user wants to push old localstorage data once
    console.log("Migration triggered");
  },

  // --- Accounting / Cash Closing ---
  saveCashClosing: async (closing: CashClosing): Promise<void> => {
    const safeClosing = JSON.parse(JSON.stringify(closing));
    try {
      if (closing.id) {
        await setDoc(doc(db, "daily_closings", closing.id), safeClosing);
      } else {
        await addDoc(collection(db, "daily_closings"), safeClosing);
      }
    } catch (e) {
      console.error("Failed to save cash closing", e);
      throw e;
    }
  },

  getCashClosings: async (): Promise<CashClosing[]> => {
    try {
      const q = query(collection(db, "daily_closings"), orderBy("date", "desc"), limit(500));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as CashClosing));
    } catch (e) {
      console.error("Failed to get closings", e);
      return [];
    }
  },

  subscribeCashClosings: (callback: (data: CashClosing[]) => void): (() => void) => {
    try {
      const q = query(collection(db, "daily_closings"), orderBy("date", "desc"), limit(500));
      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CashClosing));
        callback(items);
      }, (error) => console.error("Closings sub error", error));
    } catch (e) {
      return () => { };
    }
  },

  clearCashClosings: async (): Promise<void> => {
    try {
      const snap = await getDocs(collection(db, "daily_closings"));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (e) {
      console.error("Failed to clear cash closings", e);
      throw e;
    }
  },

  // --- External Notifications ---
  notifyNewBookingInChat: async (booking: BookingState): Promise<void> => {
    // [Server-Side Handled] Notification is now handled by Cloud Functions (sendBookingVoucherFinal)
    // to ensure reliability and avoid CORS issues.
    console.log(`[Storage] Notification for ${booking.id} will be handled by server-side trigger.`);
  },

  // --- Expenditures ---
  saveExpenditure: async (expenditure: Expenditure): Promise<void> => {
    const safeExp = JSON.parse(JSON.stringify(expenditure));
    try {
      if (expenditure.id) {
        await setDoc(doc(db, "expenditures", expenditure.id), safeExp);
      } else {
        await addDoc(collection(db, "expenditures"), safeExp);
      }
    } catch (e) {
      console.error("Failed to save expenditure", e);
      throw e;
    }
  },

  getExpenditures: async (): Promise<Expenditure[]> => {
    try {
      const q = query(collection(db, "expenditures"), orderBy("date", "desc"), limit(1000));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Expenditure));
    } catch (e) {
      console.error("Failed to get expenditures", e);
      return [];
    }
  },

  subscribeExpenditures: (callback: (data: Expenditure[]) => void): (() => void) => {
    try {
      const q = query(collection(db, "expenditures"), orderBy("date", "desc"), limit(1000));
      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Expenditure));
        callback(items);
      }, (error) => console.error("Expenditure sub error", error));
    } catch (e) {
      return () => { };
    }
  },

  // --- Admins (HR) ---
  saveAdmin: async (admin: AdminUser): Promise<void> => {
    const safeAdmin = JSON.parse(JSON.stringify(admin));
    try {
      if (admin.id) {
        await setDoc(doc(db, "admins", admin.id), safeAdmin);
      } else {
        await addDoc(collection(db, "admins"), safeAdmin);
      }
    } catch (e) {
      console.error("Failed to save admin", e);
      throw e;
    }
  },

  getAdmins: async (): Promise<AdminUser[]> => {
    try {
      const snap = await getDocs(collection(db, "admins"));
      return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as AdminUser));
    } catch (e) {
      console.error("Failed to get admins", e);
      return [];
    }
  },

  deleteAdmin: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, "admins", id));
    } catch (e) {
      console.error("Failed to delete admin", e);
      throw e;
    }
  },

  subscribeAdmins: (callback: (data: AdminUser[]) => void): (() => void) => {
    try {
      const q = query(collection(db, "admins"), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AdminUser));
        callback(items);
      }, (error) => console.error("Admins sub error", error));
    } catch (e) {
      return () => { };
    }
  },

  // --- AI Translation Service (Gemini) ---
  translateLocationData: async (data: { name: string; address: string; pickupGuide: string; description: string }): Promise<any> => {
    const config = StorageService.getCloudConfig();
    if (!config || !config.apiKey) throw new Error("Google Cloud API Key is missing.");

    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.apiKey}`;

    const prompt = `
      Translate the following Korean location information into English (en), Japanese (ja), and Simplified Chinese (zh).
      Provide the result in a strict JSON format with the following keys:
      {
        "name_en": "...", "name_ja": "...", "name_zh": "...",
        "address_en": "...", "address_ja": "...", "address_zh": "...",
        "pickupGuide_en": "...", "pickupGuide_ja": "...", "pickupGuide_zh": "...",
        "description_en": "...", "description_ja": "...", "description_zh": "..."
      }

      Korean Data:
      Name: ${data.name}
      Address: ${data.address}
      Pickup Guide: ${data.pickupGuide}
      Description: ${data.description}
    `;

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: "application/json" }
        })
      });

      const result = await response.json();
      const translatedText = result.candidates[0].content.parts[0].text;
      return JSON.parse(translatedText);
    } catch (e) {
      console.error("[Storage] AI Translation Failed:", e);
      throw e;
    }
  },

  // --- Real-time Chat ---
  saveChatMessage: async (message: ChatMessage): Promise<void> => {
    try {
      const msgRef = collection(db, "chats");
      await addDoc(msgRef, {
        ...message,
        timestamp: message.timestamp || new Date().toISOString()
      });
    } catch (e) {
      console.error("Failed to save chat message", e);
    }
  },

  saveChatSession: async (session: ChatSession): Promise<void> => {
    try {
      const sessionRef = doc(db, "chat_sessions", session.sessionId);
      await setDoc(sessionRef, {
        ...session,
        timestamp: session.timestamp || new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.error("Failed to save chat session", e);
    }
  },

  updateChatSession: async (sessionId: string, updates: Partial<ChatSession>): Promise<void> => {
    try {
      const sessionRef = doc(db, "chat_sessions", sessionId);
      await updateDoc(sessionRef, updates);
    } catch (e) {
      console.error("Failed to update chat session", e);
    }
  },

  subscribeChatMessages: (sessionId: string, callback: (messages: ChatMessage[]) => void): (() => void) => {
    try {
      const q = query(
        collection(db, "chats"),
        where("sessionId", "==", sessionId)
      );
      return onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ChatMessage));
        // Client-side sort to avoid composite index requirement
        msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        callback(msgs);
      });
    } catch (e) {
      console.error("Chat sub error", e);
      return () => { };
    }
  },

  // For Admin to see all active sessions
  subscribeChatSessions: (callback: (sessions: ChatSession[]) => void): (() => void) => {
    try {
      const q = query(collection(db, "chat_sessions"), limit(100));
      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ChatSession));
        // Sort by timestamp descending in memory
        items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        callback(items);
      });
    } catch (e) {
      console.error("Chat sessions sub error", e);
      return () => { };
    }
  },

  deleteChatSession: async (sessionId: string): Promise<void> => {
    try {
      // 1. Delete all messages associated with this session
      const q = query(collection(db, "chats"), where("sessionId", "==", sessionId));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // 2. Delete the session document
      await deleteDoc(doc(db, "chat_sessions", sessionId));
      console.log(`[Storage] Deleted chat session: ${sessionId} and all its messages.`);
    } catch (e) {
      console.error("Failed to delete chat session", e);
      throw e;
    }
  },

  // Legacy fallback or internal helper
  subscribeActiveChatSessions: (callback: (sessions: { sessionId: string; userName: string; userEmail: string; lastMessage: string; timestamp: string }[]) => void): (() => void) => {
    try {
      const q = query(collection(db, "chats"), orderBy("timestamp", "desc"), limit(500));
      return onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => doc.data() as ChatMessage);
        const sessionMap = new Map();

        msgs.forEach(m => {
          if (!sessionMap.has(m.sessionId)) {
            sessionMap.set(m.sessionId, {
              sessionId: m.sessionId,
              userName: m.userName || 'Anonymous',
              userEmail: m.userEmail || 'N/A',
              lastMessage: m.text,
              timestamp: m.timestamp
            });
          }
        });

        callback(Array.from(sessionMap.values()));
      });
    } catch (e) {
      console.error("Active sessions sub error", e);
      return () => { };
    }
  },

  // --- Discount Codes ---
  getDiscountCodes: async (): Promise<DiscountCode[]> => {
    try {
      const snap = await getDocs(collection(db, "promo_codes"));
      return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as DiscountCode));
    } catch (e) {
      console.error("Failed to get discount codes", e);
      return [];
    }
  },

  saveDiscountCode: async (code: DiscountCode): Promise<void> => {
    const safeData = JSON.parse(JSON.stringify(code));
    try {
      if (code.id) {
        await setDoc(doc(db, "promo_codes", code.id), safeData);
      } else {
        await addDoc(collection(db, "promo_codes"), safeData);
      }
    } catch (e) {
      console.error("Failed to save discount code", e);
      throw e;
    }
  },

  deleteDiscountCode: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, "promo_codes", id));
    } catch (e) {
      console.error("Failed to delete discount code", e);
      throw e;
    }
  },

  subscribeDiscountCodes: (callback: (data: DiscountCode[]) => void): (() => void) => {
    try {
      const q = query(collection(db, "promo_codes"), orderBy("code", "asc"));
      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as DiscountCode));
        callback(items);
      }, (error) => {
        console.error("Discount codes sub error", error);
        // Fallback for missing index
        const simpleQ = query(collection(db, "promo_codes"));
        onSnapshot(simpleQ, (snap) => {
          const items = snap.docs.map(d => ({ ...d.data(), id: d.id } as DiscountCode));
          callback(items);
        });
      });
    } catch (e) {
      return () => { };
    }
  },

  validateDiscountCode: async (codeStr: string): Promise<DiscountCode | null> => {
    try {
      const q = query(collection(db, "promo_codes"), where("code", "==", codeStr.toUpperCase()), where("isActive", "==", true));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return { ...snap.docs[0].data(), id: snap.docs[0].id } as DiscountCode;
    } catch (e) {
      console.error("Failed to validate discount code", e);
      return null;
    }
  }
};
