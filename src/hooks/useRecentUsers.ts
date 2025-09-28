// src/hooks/useRecentUsers.ts
import { useEffect, useState } from "react";
import { db } from "../firebase"; // Adjust path if needed
import { ref, onValue } from "firebase/database";

export interface User {
  id: string;
  fullName?: string;
  name?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  role: string;
  registeredAt?: string;
  status?: string;
  specialization?: string;
  createdAt?: string;
  // ...other fields as needed
}

export function useRecentUsers(limit = 5) {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userList = Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          ...value,
        }));
        userList.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
        setUsers(userList.slice(0, limit));
      } else {
        setUsers([]);
      }
    });
    return () => unsubscribe();
  }, [limit]);

  return users;
}
