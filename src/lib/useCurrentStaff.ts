"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { StaffMember } from "@/lib/store";

type State = {
  user: User | null;
  staffDoc: StaffMember | null;
  loading: boolean;
};

export function useCurrentStaff() {
  const [state, setState] = useState<State>({ user: null, staffDoc: null, loading: true });

  useEffect(() => {
    let unsubStaffDoc: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubStaffDoc?.();

      if (!user) {
        setState({ user: null, staffDoc: null, loading: false });
        return;
      }

      unsubStaffDoc = onSnapshot(doc(db, "staff", user.uid), (snap) => {
        setState({
          user,
          staffDoc: snap.exists() ? ({ ...(snap.data() as StaffMember), id: snap.id }) : null,
          loading: false,
        });
      });
    });

    return () => {
      unsubAuth();
      unsubStaffDoc?.();
    };
  }, []);

  return state;
}
