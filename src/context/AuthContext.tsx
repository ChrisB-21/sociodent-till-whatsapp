import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "@/firebase";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { ref, get } from "firebase/database";

type User = {
  uid: string;
  role: string;
  name: string;
  email?: string;
  status?: string; // For doctors: 'pending', 'approved', 'rejected'
};

type AuthContextType = {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  login: (userData: User) => void;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  login: () => {},
  logout: () => {},
  refreshUserData: async () => {},
  isLoading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Firebase Auth state changed:", firebaseUser?.uid);
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        // User is signed in, try to get their data from localStorage first
        const storedRole = localStorage.getItem('userRole');
        const storedName = localStorage.getItem('userName');
        const storedEmail = localStorage.getItem('userEmail');
        const storedStatus = localStorage.getItem('userStatus');
        
        // For doctors, always fetch fresh data from database to check approval status
        if (storedRole === 'doctor') {
          try {
            console.log("AuthContext: Doctor detected, fetching fresh data from database");
            const userRef = ref(db, `users/${firebaseUser.uid}`);
            const userSnapshot = await get(userRef);
            
            if (userSnapshot.exists()) {
              const userData = userSnapshot.val();
              console.log("AuthContext: Fresh doctor data from database:", userData);
              
              const userInfo = {
                uid: firebaseUser.uid,
                role: userData.role || 'doctor',
                name: userData.fullName || 'Doctor',
                email: firebaseUser.email || undefined,
                status: userData.status, // Always get fresh status for doctors
              };
              
              console.log("AuthContext: Setting doctor user info:", userInfo);
              
              // Update localStorage with fresh data
              localStorage.setItem('isAuthenticated', 'true');
              localStorage.setItem('userRole', userInfo.role);
              localStorage.setItem('userName', userInfo.name);
              localStorage.setItem('uid', userInfo.uid);
              localStorage.setItem('userId', userInfo.uid);
              if (userInfo.email) {
                localStorage.setItem('userEmail', userInfo.email);
              }
              if (userInfo.status) {
                localStorage.setItem('userStatus', userInfo.status);
              }
              
              setUser(userInfo);
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.error("AuthContext: Error fetching fresh doctor data:", error);
          }
        }
        
        if (storedRole && storedName) {
          // Use stored data if available (for non-doctors or if doctor fetch failed)
          setUser({
            uid: firebaseUser.uid,
            role: storedRole,
            name: storedName,
            email: storedEmail || firebaseUser.email || undefined,
            status: storedStatus || undefined,
          });
          setIsLoading(false);
        } else {
          // Try to fetch user data from database
          try {
            const userRef = ref(db, `users/${firebaseUser.uid}`);
            const userSnapshot = await get(userRef);
            
            if (userSnapshot.exists()) {
              const userData = userSnapshot.val();
              const userInfo = {
                uid: firebaseUser.uid,
                role: userData.role || 'user',
                name: userData.fullName || 'User',
                email: firebaseUser.email || undefined,
                status: userData.status, // Include status for approval checking
              };
              
              // Store in localStorage for future use
              localStorage.setItem('isAuthenticated', 'true');
              localStorage.setItem('userRole', userInfo.role);
              localStorage.setItem('userName', userInfo.name);
              localStorage.setItem('uid', userInfo.uid);
              localStorage.setItem('userId', userInfo.uid);
              if (userInfo.email) {
                localStorage.setItem('userEmail', userInfo.email);
              }
              if (userInfo.status) {
                localStorage.setItem('userStatus', userInfo.status);
              }
              
              setUser(userInfo);
            } else {
              // Check other collections (doctors, admin)
              const doctorRef = ref(db, `doctors/${firebaseUser.uid}`);
              const doctorSnapshot = await get(doctorRef);
              
              if (doctorSnapshot.exists()) {
                const doctorData = doctorSnapshot.val();
                const userInfo = {
                  uid: firebaseUser.uid,
                  role: 'doctor',
                  name: doctorData.fullName || 'Doctor',
                  email: firebaseUser.email || undefined,
                  status: doctorData.status, // Include status for approval checking
                };
                
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('userRole', userInfo.role);
                localStorage.setItem('userName', userInfo.name);
                localStorage.setItem('uid', userInfo.uid);
                localStorage.setItem('userId', userInfo.uid);
                if (userInfo.email) {
                  localStorage.setItem('userEmail', userInfo.email);
                }
                if (userInfo.status) {
                  localStorage.setItem('userStatus', userInfo.status);
                }
                
                setUser(userInfo);
              } else {
                // Default user data
                const userInfo = {
                  uid: firebaseUser.uid,
                  role: 'user',
                  name: firebaseUser.displayName || 'User',
                  email: firebaseUser.email || undefined,
                };
                setUser(userInfo);
              }
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
            // Fallback to basic user info
            const userInfo = {
              uid: firebaseUser.uid,
              role: 'user',
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || undefined,
            };
            setUser(userInfo);
          }
          setIsLoading(false);
        }
      } else {
        // User is signed out
        setUser(null);
        // Clear localStorage
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('uid');
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userStatus');
        setIsLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = (userData: User) => {
    // Store in localStorage
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userRole', userData.role);
    localStorage.setItem('userName', userData.name);
    localStorage.setItem('uid', userData.uid);
    localStorage.setItem('userId', userData.uid); // For backward compatibility
    if (userData.email) {
      localStorage.setItem('userEmail', userData.email);
    }
    if (userData.status) {
      localStorage.setItem('userStatus', userData.status);
    }
    
    // Update state
    setUser(userData);
    
    // Firebase Auth state is already maintained by onAuthStateChanged
    window.dispatchEvent(new Event('authChange'));
  };

  const logout = async () => {
    try {
      // Sign out from Firebase
      await signOut(auth);
      // The onAuthStateChanged listener will handle the rest of the cleanup
    } catch (error) {
      console.error("Error signing out:", error);
      // Fallback cleanup
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('uid');
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userStatus');
      setUser(null);
      setFirebaseUser(null);
    }
    window.dispatchEvent(new Event('authChange'));
  };

  const refreshUserData = async () => {
    if (!firebaseUser) {
      console.log("AuthContext.refreshUserData: No firebaseUser, skipping refresh");
      return;
    }
    
    try {
      console.log("AuthContext.refreshUserData: Fetching fresh data for user:", firebaseUser.uid);
      const userRef = ref(db, `users/${firebaseUser.uid}`);
      const userSnapshot = await get(userRef);
      
      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        console.log("AuthContext.refreshUserData: Fresh data from database:", userData);
        
        const userInfo = {
          uid: firebaseUser.uid,
          role: userData.role || 'user',
          name: userData.fullName || 'User',
          email: firebaseUser.email || undefined,
          status: userData.status,
        };
        
        console.log("AuthContext.refreshUserData: Creating new user object:", userInfo);
        
        // Update localStorage with fresh data
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', userInfo.role);
        localStorage.setItem('userName', userInfo.name);
        localStorage.setItem('uid', userInfo.uid);
        localStorage.setItem('userId', userInfo.uid);
        if (userInfo.email) {
          localStorage.setItem('userEmail', userInfo.email);
        }
        if (userInfo.status) {
          localStorage.setItem('userStatus', userInfo.status);
        }
        
        console.log("AuthContext.refreshUserData: Updated localStorage and setting user state");
        setUser(userInfo);
      } else {
        console.log("AuthContext.refreshUserData: No user data found in database for:", firebaseUser.uid);
      }
    } catch (error) {
      console.error("AuthContext.refreshUserData: Error refreshing user data:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, login, logout, refreshUserData, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);