
import { db, storage } from '../firebaseApp';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, onSnapshot, setDoc, writeBatch, orderBy, limit, getDoc, or } from "firebase/firestore";
import { BookingState, BookingStatus, LocationOption, TermsPolicyData, PrivacyPolicyData, QnaData, HeroConfig, PriceSettings, GoogleCloudConfig, PartnershipInquiry, CashClosing, Expenditure, AdminUser, StorageTier, ChatMessage, DiscountCode, ChatSession, TranslatedLocationData, UserProfile, UserCoupon, BranchProspect, ProspectStatus, SystemNotice } from "../types";
import { LOCATIONS as INITIAL_LOCATIONS } from "../constants";

// Keys for LocalStorage (Only for minimal config cache if needed, but largely removed)
const KEYS = {
  CLOUD_CONFIG: 'beeliber_cloud_config',
};

const DEFAULT_CLOUD_CONFIG: GoogleCloudConfig = {
  apiKey: "AIzaSyCWCnernI5QA1UGRI080vjlzBEVpevAzt0",
  authDomain: "beeliber-main.firebaseapp.com",
  projectId: "beeliber-main", // [주의] 프로젝트 ID가 불일치할 경우 이 부분을 수정하세요. 💅
  storageBucket: "beeliber-main.firebasestorage.app",
  messagingSenderId: "591358308612",
  appId: "1:591358308612:web:fb3928d12b0e1bb000a051",
  measurementId: "G-PQBL1SG842",
  isActive: true, // Force Active
  enableGeminiAutomation: true,
  // [보안] 클라이언트 웹훅 노출 금지! 🛡️ 세팅은 DB 또는 환경변수(Server)에서 관리합니다.
  googleChatWebhookUrl: ""
};

// Helper for safe JSON parse (utility)
const safeJsonParse = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch { return fallback; }
};

const runSnapshotFallback = async <T>({
  sourceQuery,
  parser,
  callback,
  label
}: {
  sourceQuery: any;
  parser: (snapshot: any) => T;
  callback: (data: T) => void;
  label: string;
}) => {
  try {
    const snapshot = await getDocs(sourceQuery);
    callback(parser(snapshot));
  } catch (fallbackError) {
    console.error(`${label} fallback failed:`, fallbackError);
  }
};

export const StorageService = {
  // --- Configuration ---
  saveCloudConfig: (config: GoogleCloudConfig) => {
    localStorage.setItem(KEYS.CLOUD_CONFIG, JSON.stringify(config));
    window.location.reload();
  },

  getCloudConfig: (): GoogleCloudConfig | null => {
    // [스봉이] 로컬 스토리지의 낡은 캐시가 사고를 유발해서, 강제로 기본 설정을 쓰게 바꿨어요! 💅✨
    return { ...DEFAULT_CLOUD_CONFIG, isActive: true };
  },

  uploadFile: async (file: File | Blob, path: string): Promise<string> => {
    try {
      console.log("[Storage] Starting upload to:", path);
      // Ensure we have some level of auth context (Anonymous or regular)
      const { ensureAuth } = await import('../firebaseApp');
      await ensureAuth();

      const { auth } = await import('../firebaseApp');
      console.log("[Storage] Current User before upload:", auth.currentUser?.uid || "NULL");

      // [스봉이] 가끔 서버가 느리면 인증 정보가 바로 안 넘어갈 때가 있더라고요. 0.5초만 기다려 볼까요? 💅
      if (!auth.currentUser) {
        console.warn("[Storage] User is still NULL after ensureAuth! Retrying sign-in... 🙄");
        const { signInAnonymously } = await import('firebase/auth');
        await signInAnonymously(auth);
      }

      const storageRef = ref(storage, path);
      console.log("[Storage] Uploading bytes (Size:", file.size, ")...");
      const metadata = {
        contentType: (file as File).type || 'application/octet-stream',
      };

      await uploadBytes(storageRef, file, metadata);
      console.log("[Storage] Upload success, getting URL...");
      return await getDownloadURL(storageRef);
    } catch (err: unknown) {
      const e = err as any; // Cast for specific properties access
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


  // --- Helpers ---
  generateBookingId: (booking: Partial<BookingState>): string => {
    const getCode = (id: string) => INITIAL_LOCATIONS.find(l => l.id === id)?.shortCode || id.substring(0, 3).toUpperCase();

    const originCode = getCode(booking.pickupLocation || 'UNK');
    const destCode = booking.serviceType === 'DELIVERY'
      ? (booking.dropoffLocation ? getCode(booking.dropoffLocation) : (booking.serviceType === 'DELIVERY' ? 'ADDR' : 'UNK'))
      : originCode;

    const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
    return `${originCode}-${destCode}-${randomStr}`;
  },

  // --- Bookings ---
  saveBooking: async (booking: BookingState): Promise<void> => {
    const safeBooking = JSON.parse(JSON.stringify(booking));

    try {
      const { auth, ensureAuth, db } = await import('../firebaseApp');
      const { collection, doc, setDoc, onSnapshot } = await import('firebase/firestore');
      const currentUser = await ensureAuth();

      // 예약 저장 직전의 인증 UID를 문서에 고정해 두어야, 후속 onSnapshot 읽기가 규칙에 막히지 않습니다.
      const bookingOwnerUid = safeBooking.userId || auth.currentUser?.uid || currentUser?.uid;
      if (!bookingOwnerUid) {
        throw new Error('예약 저장용 사용자 인증을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }
      safeBooking.userId = bookingOwnerUid;

      const docRef = safeBooking.id ? doc(db, 'bookings', safeBooking.id) : doc(collection(db, 'bookings'));
      safeBooking.id = docRef.id;

      console.log("[StorageService] Initiating Event-Driven Booking flow... docId:", docRef.id);

      return new Promise((resolve, reject) => {
        let isResolved = false;

        const unsubscribe = onSnapshot(docRef, (snap) => {
          if (!snap.exists()) return;
          const data = snap.data();

          if (data.status === '접수완료') {
            isResolved = true;
            unsubscribe();
            console.log("[StorageService] Backend validation successful! 🎉", data);
            resolve();
          } else if (data.status === 'ERROR' || data.status === '예약실패') {
            isResolved = true;
            unsubscribe();
            console.error("[StorageService] Backend validation failed! 🚨", data);
            reject(new Error(data.error || 'Server validation failed.'));
          }
        }, (err) => {
          if (!isResolved) {
            isResolved = true;
            unsubscribe();
            reject(err);
          }
        });

        // [스봉이] Firestore는 NaN을 보면 화를 내요. 깍쟁이처럼 깨끗하게 씻겨서 보내야죠 💅
        const cleanData = (obj: any): any => {
          const newObj = { ...obj };
          Object.keys(newObj).forEach(key => {
            if (newObj[key] === undefined) delete newObj[key];
            else if (typeof newObj[key] === 'number' && isNaN(newObj[key])) newObj[key] = 0;
            else if (newObj[key] !== null && typeof newObj[key] === 'object') newObj[key] = cleanData(newObj[key]);
          });
          return newObj;
        };

        const finalizedBooking = cleanData({
          ...safeBooking,
          status: 'SERVER_VALIDATION_PENDING',
          price: isNaN(Number(safeBooking.price)) ? 0 : Number(safeBooking.price),
          finalPrice: isNaN(Number(safeBooking.finalPrice)) ? 0 : Number(safeBooking.finalPrice),
          createdAt: new Date().toISOString()
        });

        // Write the request to trigger the backend Cloud Function
        setDoc(docRef, finalizedBooking).catch(err => {
          if (!isResolved) {
            isResolved = true;
            unsubscribe();
            reject(err);
          }
        });
      });

    } catch (e: any) {
      console.error("Cloud Save Failed (Booking via API):", e);
      // Log more details if it's a Firebase error
      if (e.code) console.error("Firebase Error Code:", e.code);
      if (e.details) console.error("Firebase Error Details:", e.details);
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

  getArchivedBookings: async (): Promise<BookingState[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, "archived_bookings"));
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BookingState));
    } catch (e) {
      console.error("Error fetching archived bookings", e);
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

  getBooking: async (id: string): Promise<BookingState | null> => {
    try {
      if (!id) return null;
      const snap = await getDoc(doc(db, "bookings", id));
      if (snap.exists()) {
        return { ...snap.data(), id: snap.id } as BookingState;
      }

      // Try searching by reservationCode if direct ID fails 🛡️
      const q = query(collection(db, "bookings"), where("reservationCode", "==", id), limit(1));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const doc = querySnap.docs[0];
        return { ...doc.data(), id: doc.id } as BookingState;
      }

      return null;
    } catch (e) {
      console.error("Error fetching single booking:", e);
      return null;
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
        const simpleQ = query(collection(db, "bookings"), limit(1000));
        void runSnapshotFallback({
          sourceQuery: simpleQ,
          parser: (snap) => {
            const fallbackBookings = snap.docs.map((d: any) => ({ ...d.data(), id: d.id } as BookingState));
            fallbackBookings.sort((a, b) => new Date(b.pickupDate || '').getTime() - new Date(a.pickupDate || '').getTime());
            return fallbackBookings;
          },
          callback,
          label: "Booking subscription"
        });
      });
    } catch (e) {
      console.error("Failed to subscribe bookings", e);
      return () => { };
    }
  },

  subscribeBookingsByLocation: (locationId: string, callback: (data: BookingState[]) => void): (() => void) => {
    try {
      console.log(`[Storage] Subscribing to bookings for location: ${locationId}`);
      // OR query: pickupLocation is ID OR dropoffLocation is ID
      const q = query(
        collection(db, "bookings"),
        or(
          where("pickupLocation", "==", locationId),
          where("dropoffLocation", "==", locationId),
          where("branchId", "==", locationId)
        ),
        orderBy("pickupDate", "desc"),
        limit(500)
      );

      return onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BookingState));
        // Ensure strictly sorted and filtered in memory as back-up
        const filtered = bookings.filter(b => b.pickupLocation === locationId || b.dropoffLocation === locationId || b.branchId === locationId);
        filtered.sort((a, b) => new Date(b.pickupDate || '').getTime() - new Date(a.pickupDate || '').getTime());
        callback(filtered);
      }, (error) => {
        console.error("Location booking sub error, falling back to all-fetch filter:", error);
        const simpleQ = query(collection(db, "bookings"), orderBy("pickupDate", "desc"), limit(1000));
        void runSnapshotFallback({
          sourceQuery: simpleQ,
          parser: (snapshot) => {
            const fallbackBookings = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as BookingState));
            const filtered = fallbackBookings.filter((b: BookingState) => b.pickupLocation === locationId || b.dropoffLocation === locationId || b.branchId === locationId);
            filtered.sort((a, b) => new Date(b.pickupDate || '').getTime() - new Date(a.pickupDate || '').getTime());
            return filtered;
          },
          callback,
          label: "Location booking subscription"
        });
      });
    } catch (e) {
      console.error("Critical failure in location subscription", e);
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
      const { ensureAuth, functions } = await import('../firebaseApp');
      const { httpsCallable } = await import('firebase/functions');
      await ensureAuth();

      // [Phase 2] Call backend API for cancellation rules and status change
      const cancelBookingApi = httpsCallable(functions, 'cancelBooking');
      await cancelBookingApi({ bookingId: id });
    } catch (e) {
      console.error("Cancel error (via API):", e);
      throw e;
    }
  },

  // --- Locations ---
  subscribeLocations: (callback: (data: LocationOption[]) => void): (() => void) => {
    try {
      console.log("[Storage] Subscribing to locations real-time...");
      return onSnapshot(collection(db, "locations"), (snap) => {
        if (snap.empty) {
          callback([]);
          return;
        }
        const mergedLocations = snap.docs.map(doc => {
          const cloudLoc = { ...doc.data(), id: doc.id } as unknown as LocationOption;
          const initialLoc = INITIAL_LOCATIONS.find(l => l.id === cloudLoc.id);
          if (initialLoc) {
            const enriched = { ...cloudLoc };
            Object.keys(initialLoc).forEach((key) => {
              const k = key as keyof LocationOption;
              if (enriched[k] === undefined || enriched[k] === "" || enriched[k] === null) {
                (enriched as Record<string, any>)[k] = initialLoc[k];
              }
            });
            return enriched;
          }
          return cloudLoc;
        });
        callback(mergedLocations);
      });
    } catch (e) {
      console.error("Failed to subscribe locations", e);
      return () => { };
    }
  },

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
              (enriched as Record<string, any>)[k] = initialLoc[k];
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

        // [스봉이] Firestore가 싫어하는 NaN, undefined 사전에 차단! 🛡️
        if (dataToSave.lat === undefined || dataToSave.lat === null || isNaN(Number(dataToSave.lat))) {
          delete dataToSave.lat;
        } else {
          dataToSave.lat = Number(dataToSave.lat);
        }

        if (dataToSave.lng === undefined || dataToSave.lng === null || isNaN(Number(dataToSave.lng))) {
          delete dataToSave.lng;
        } else {
          dataToSave.lng = Number(dataToSave.lng);
        }

        // Use setDoc with merge: true to update existing or create new
        batch.set(locRef, dataToSave, { merge: true });
      });

      await batch.commit();
      console.log("[Storage] Full Sync Completed Successfully. ✨");
    } catch (e) {
      console.error("[Storage] Full Sync Failed:", e);
      throw e;
    }
  },

  saveLocation: async (location: LocationOption): Promise<void> => {
    const sanitized = { ...location };
    // [스봉이] Firestore는 NaN을 보면 화를 내요. 깍쟁이처럼 걸러내야죠 💅
    if (sanitized.lat === undefined || sanitized.lat === null || isNaN(Number(sanitized.lat))) {
      delete sanitized.lat;
    } else {
      sanitized.lat = Number(sanitized.lat);
    }

    if (sanitized.lng === undefined || sanitized.lng === null || isNaN(Number(sanitized.lng))) {
      delete sanitized.lng;
    } else {
      sanitized.lng = Number(sanitized.lng);
    }

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

  getQnaPolicy: async (): Promise<QnaData | null> => {
    try {
      const snap = await getDoc(doc(db, "settings", "qna_policy"));
      return snap.exists() ? snap.data() as QnaData : null;
    } catch { return null; }
  },

  saveQnaPolicy: async (data: QnaData): Promise<void> => {
    await setDoc(doc(db, "settings", "qna_policy"), data);
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

  /**
   * [스봉이] 인사관리 중복 데이터 정제 도구 🧹💅
   * 이름이 같은 데이터 중 가장 최근에 업데이트된 것만 남기고 나머지는 삭제합니다.
   */
  deduplicateAdmins: async (): Promise<{ total: number, removed: number }> => {
    try {
      const snap = await getDocs(collection(db, "admins"));
      const admins = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as AdminUser));
      
      const uniqueGroups: Record<string, AdminUser[]> = {};
      admins.forEach(admin => {
        const name = admin.name?.trim();
        const email = admin.email?.trim();
        if (!name) return;
        
        // [스봉이] 이름만 같다고 중복이 아니죠. 이메일까지 같아야 '진짜' 중복이에요! 💅
        const key = `${name}_${email || 'no-email'}`;
        if (!uniqueGroups[key]) uniqueGroups[key] = [];
        uniqueGroups[key].push(admin);
      });

      let removedCount = 0;
      const batchSize = 500;
      let currentBatch = writeBatch(db);
      let operationCount = 0;

      for (const key in uniqueGroups) {
        const group = uniqueGroups[key];

        if (group.length > 1) {
          // updatedAt 기준 내림차순 정렬 (가장 최신 것이 인덱스 0)
          group.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
          
          // 첫 번째(가장 최신) 하나만 남기고 나머지는 삭제 대상으로 배태 처리
          const toRemove = group.slice(1);
          for (const admin of toRemove) {
            currentBatch.delete(doc(db, "admins", admin.id));
            removedCount++;
            operationCount++;

            if (operationCount >= batchSize) {
              await currentBatch.commit();
              currentBatch = writeBatch(db);
              operationCount = 0;
            }
          }
        }
      }

      if (operationCount > 0) {
        await currentBatch.commit();
      }

      return { total: admins.length, removed: removedCount };
    } catch (e) {
      console.error("Deduplication failed", e);
      throw e;
    }
  },

  // --- User Profiles ---
  getUserProfile: async (uid: string): Promise<UserProfile | null> => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (err) {
      console.error("[Storage] Error getting user profile:", err);
      return null;
    }
  },

  updateUserProfile: async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
    try {
      const docRef = doc(db, "users", uid);
      await setDoc(docRef, updates, { merge: true });
    } catch (err) {
      console.error("[Storage] Error updating user profile:", err);
    }
  },

  // --- User Coupons ---
  getUserCoupons: async (uid: string): Promise<UserCoupon[]> => {
    try {
      const q = query(collection(db, "userCoupons"), where("uid", "==", uid), where("isUsed", "==", false));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as UserCoupon));
    } catch (err) {
      console.error("[Storage] Error getting user coupons:", err);
      return [];
    }
  },

  issueWelcomeCoupon: async (uid: string): Promise<void> => {
    try {
      const q = query(collection(db, "discountCodes"), where("code", "==", "WELCOME"), where("isActive", "==", true));
      const snap = await getDocs(q);
      if (snap.empty) return;

      const discount = snap.docs[0].data() as DiscountCode;
      const coupon: Omit<UserCoupon, 'id'> = {
        uid,
        codeId: snap.docs[0].id || '',
        code: discount.code,
        amountPerBag: discount.amountPerBag,
        description: discount.description,
        isUsed: false,
        issuedAt: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      };
      await addDoc(collection(db, "userCoupons"), coupon);
    } catch (err) {
      console.error("[Storage] Error issuing welcome coupon:", err);
    }
  },

  subscribeAdmins: (callback: (data: AdminUser[]) => void): (() => void) => {
    try {
      const dbRef = collection(db, "admins");
      const q = query(dbRef, orderBy("createdAt", "desc"));
      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AdminUser));
        callback(items);
      }, (error) => {
        console.error("Admins subscription error (likely index missing):", error);
        const simpleQ = query(dbRef, limit(100));
        void runSnapshotFallback({
          sourceQuery: simpleQ,
          parser: (snap) => {
            const items = snap.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as AdminUser));
            items.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
            return items;
          },
          callback,
          label: "Admins subscription"
        });
      });
    } catch (e) {
      console.error("Admins subscription critical failure:", e);
      return () => { };
    }
  },

  // --- AI Translation Service (Gemini) ---
  translateLocationData: async (data: { name: string; address: string; pickupGuide: string; description: string }): Promise<TranslatedLocationData> => {
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
        const simpleQ = query(collection(db, "promo_codes"));
        void runSnapshotFallback({
          sourceQuery: simpleQ,
          parser: (snap) => snap.docs.map((d: any) => ({ ...d.data(), id: d.id } as DiscountCode)),
          callback,
          label: "Discount codes subscription"
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
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as DiscountCode;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  // --- Branches ---
  getBranches: async (): Promise<any[]> => {
    try {
      const snap = await getDocs(collection(db, "branches"));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) { console.error(e); return []; }
  },
  getBranchByCode: async (code: string): Promise<any | null> => {
    try {
      if (!code) return null;
      const branchQuery = query(collection(db, "branches"), where("branchCode", "==", code), limit(1));
      const snap = await getDocs(branchQuery);
      if (snap.empty) return null;
      const branch = { id: snap.docs[0].id, ...snap.docs[0].data() };
      return branch.isActive === false ? null : branch;
    } catch (e) {
      console.error(e);
      return null;
    }
  },
  subscribeBranches: (callback: (data: any[]) => void) => {
    const q = query(collection(db, "branches"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  },
  saveBranch: async (branch: any): Promise<void> => {
    try {
      const safeData = { ...branch };
      if (!safeData.id) {
        safeData.createdAt = new Date().toISOString();
        await addDoc(collection(db, "branches"), safeData);
      } else {
        const id = safeData.id;
        delete safeData.id;
        await updateDoc(doc(db, "branches", id), safeData);
      }
    } catch (e) { console.error(e); throw e; }
  },
  deleteBranch: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, "branches", id));
    } catch (e) { throw e; }
  },

  // --- Branch Prospects (Expansion Scouts) ---
  getBranchProspects: async (): Promise<BranchProspect[]> => {
    try {
      const snap = await getDocs(collection(db, "branch_prospects"));
      return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as BranchProspect));
    } catch (e) { console.error(e); return []; }
  },
  subscribeBranchProspects: (callback: (data: BranchProspect[]) => void) => {
    const q = query(collection(db, "branch_prospects"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BranchProspect)));
    });
  },
  saveBranchProspect: async (prospect: BranchProspect): Promise<void> => {
    try {
      const safeData = { ...prospect, updatedAt: new Date().toISOString() };
      if (!safeData.id || safeData.id.startsWith('PROSPECT-TEMP-')) {
        // New prospect or unsaved temp id
        if (safeData.id) delete (safeData as any).id;
        safeData.createdAt = new Date().toISOString();
        await addDoc(collection(db, "branch_prospects"), safeData);
      } else {
        const id = safeData.id;
        delete (safeData as any).id;
        await updateDoc(doc(db, "branch_prospects", id), safeData);
      }
    } catch (e) { console.error(e); throw e; }
  },
  deleteBranchProspect: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, "branch_prospects", id));
    } catch (e) { throw e; }
  },

  // --- Notices ---
  subscribeNotices: (callback: (data: SystemNotice[]) => void): (() => void) => {
    try {
      const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SystemNotice));
        callback(items);
      }, (error) => {
        console.error("Notices sub error", error);
        const simpleQ = query(collection(db, "notices"));
        void runSnapshotFallback({
          sourceQuery: simpleQ,
          parser: (snap) => {
            const items = snap.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as SystemNotice));
            items.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
            return items;
          },
          callback,
          label: "Notices subscription"
        });
      });
    } catch (e) {
      return () => { };
    }
  },

  saveNotice: async (notice: SystemNotice): Promise<void> => {
    const safeData = JSON.parse(JSON.stringify(notice));
    try {
      if (notice.id) {
        await setDoc(doc(db, "notices", notice.id), safeData);
      } else {
        safeData.createdAt = new Date().toISOString();
        await addDoc(collection(db, "notices"), safeData);
      }
    } catch (e) {
      console.error("Failed to save notice", e);
      throw e;
    }
  },

  deleteNotice: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, "notices", id));
    } catch (e) {
      console.error("Failed to delete notice", e);
      throw e;
    }
  },

  // --- TIPS CMS ---
  getTipsAreas: async (): Promise<any[]> => {
    try {
      const snap = await getDocs(collection(db, "tips_areas"));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) { console.error(e); return []; }
  },

  subscribeTipsAreas: (callback: (data: any[]) => void) => {
    const q = query(collection(db, "tips_areas"), orderBy("order", "asc"));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.warn("Tips areas sub fallback (index?):", error);
      onSnapshot(collection(db, "tips_areas"), (snap) => {
        const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        items.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        callback(items);
      });
    });
  },

  saveTipsArea: async (area: any): Promise<void> => {
    try {
      const safeData = { ...area, updatedAt: new Date().toISOString() };
      const id = safeData.id;
      if (id) {
        delete safeData.id;
        await setDoc(doc(db, "tips_areas", id), safeData, { merge: true });
      } else {
        safeData.createdAt = new Date().toISOString();
        await addDoc(collection(db, "tips_areas"), safeData);
      }
    } catch (e) { console.error(e); throw e; }
  },

  deleteTipsArea: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "tips_areas", id));
  },

  getTipsThemes: async (): Promise<any[]> => {
    try {
      const snap = await getDocs(collection(db, "tips_themes"));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) { console.error(e); return []; }
  },

  subscribeTipsThemes: (callback: (data: any[]) => void) => {
    const q = query(collection(db, "tips_themes"), orderBy("order", "asc"));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      onSnapshot(collection(db, "tips_themes"), (snap) => {
        const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        items.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        callback(items);
      });
    });
  },

  saveTipsTheme: async (theme: any): Promise<void> => {
    try {
      const safeData = { ...theme, updatedAt: new Date().toISOString() };
      const id = safeData.id;
      if (id) {
        delete safeData.id;
        await setDoc(doc(db, "tips_themes", id), safeData, { merge: true });
      } else {
        safeData.createdAt = new Date().toISOString();
        await addDoc(collection(db, "tips_themes"), safeData);
      }
    } catch (e) { console.error(e); throw e; }
  },

  deleteTipsTheme: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "tips_themes", id));
  },

  subscribeTipsContents: (filters: { area_slug?: string, theme_tag?: string, slug?: string }, callback: (data: any[]) => void) => {
    let q = query(collection(db, "tips_contents"));
    if (filters.area_slug) q = query(q, where("area_slug", "==", filters.area_slug));
    if (filters.theme_tag) q = query(q, where("theme_tags", "array-contains", filters.theme_tag));
    if (filters.slug) q = query(q, where("slug", "==", filters.slug));
    
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      items.sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      callback(items);
    });
  },

  saveTipsContent: async (content: any): Promise<void> => {
    try {
      const safeData = { ...content, updatedAt: new Date().toISOString() };
      const id = safeData.id;
      if (id) {
        delete safeData.id;
        await setDoc(doc(db, "tips_contents", id), safeData, { merge: true });
      } else {
        safeData.createdAt = new Date().toISOString();
        await addDoc(collection(db, "tips_contents"), safeData);
      }
    } catch (e) { console.error(e); throw e; }
  },

  deleteTipsContent: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "tips_contents", id));
  }
};
