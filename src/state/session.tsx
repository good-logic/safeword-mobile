import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabase";

type SessionState = {
  session: Session | null;
  isHydrated: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Ensure we only hydrate once (prevents double-routing issues downstream)
  const hydratedOnceRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (error) {
        // Still mark hydrated so Gate can route to auth
        setSession(null);
        setIsHydrated(true);
        hydratedOnceRef.current = true;
        return;
      }

      setSession(data.session ?? null);
      setIsHydrated(true);
      hydratedOnceRef.current = true;
    }

    hydrate();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // If auth event fires before hydrate, still accept it,
      // but keep isHydrated false until hydrate completes.
      setSession(newSession ?? null);
      if (hydratedOnceRef.current) setIsHydrated(true);
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<SessionState>(
    () => ({
      session,
      isHydrated,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, isHydrated]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession must be used within SessionProvider");
  return v;
}
