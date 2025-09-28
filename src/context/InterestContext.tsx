import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { ref, push, remove, onValue, off } from 'firebase/database';
import { db } from '@/firebase';

interface Interest {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  productPrice: number;
  dateAdded: string;
  userId: string;
}

interface InterestContextType {
  interests: Interest[];
  addInterest: (product: { id: string; name: string; image: string; price: number }) => Promise<void>;
  removeInterest: (productId: string) => Promise<void>;
  hasInterest: (productId: string) => boolean;
  isLoading: boolean;
}

const InterestContext = createContext<InterestContextType>({
  interests: [],
  addInterest: async () => {},
  removeInterest: async () => {},
  hasInterest: () => false,
  isLoading: false,
});

export const useInterest = () => {
  const context = useContext(InterestContext);
  if (!context) {
    throw new Error('useInterest must be used within an InterestProvider');
  }
  return context;
};

export const InterestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load user's interests from Firebase
  useEffect(() => {
    if (!user?.uid) {
      setInterests([]);
      return;
    }

    setIsLoading(true);
    const interestsRef = ref(db, `users/${user.uid}/interests`);
    
    const unsubscribe = onValue(interestsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const interestsList = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          ...value,
        }));
        setInterests(interestsList);
      } else {
        setInterests([]);
      }
      setIsLoading(false);
    });

    return () => {
      off(interestsRef);
      unsubscribe();
    };
  }, [user?.uid]);

  const addInterest = async (product: { id: string; name: string; image: string; price: number }) => {
    if (!user?.uid) {
      toast({
        title: "Login Required",
        description: "Please login to show interest in products",
        variant: "destructive"
      });
      return;
    }

    try {
      const interestsRef = ref(db, `users/${user.uid}/interests`);
      const newInterest = {
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        productPrice: product.price,
        dateAdded: new Date().toISOString(),
        userId: user.uid,
      };

      await push(interestsRef, newInterest);

      toast({
        title: "Interest Added",
        description: `We've recorded your interest in ${product.name}`,
      });
    } catch (error) {
      console.error('Error adding interest:', error);
      toast({
        title: "Error",
        description: "Failed to record your interest. Please try again.",
        variant: "destructive"
      });
    }
  };

  const removeInterest = async (productId: string) => {
    if (!user?.uid) return;

    try {
      const interest = interests.find(i => i.productId === productId);
      if (interest) {
        const interestRef = ref(db, `users/${user.uid}/interests/${interest.id}`);
        await remove(interestRef);

        toast({
          title: "Interest Removed",
          description: "Product has been removed from your interests",
        });
      }
    } catch (error) {
      console.error('Error removing interest:', error);
      toast({
        title: "Error",
        description: "Failed to remove interest. Please try again.",
        variant: "destructive"
      });
    }
  };

  const hasInterest = (productId: string) => {
    return interests.some(interest => interest.productId === productId);
  };

  return (
    <InterestContext.Provider
      value={{
        interests,
        addInterest,
        removeInterest,
        hasInterest,
        isLoading,
      }}
    >
      {children}
    </InterestContext.Provider>
  );
};
