import { createContext, useContext, useEffect, useReducer } from "react";
import { supabase } from "../lib/supabase";
import { useRouter, useSegments } from "expo-router";

export interface AuthContextType {
  user: null | { id: string; email: string };
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useProtectedRoute(user: { id: string } | null) {
  const segments = useSegments();
  const router = useRouter();
  const inAuthGroup = segments[0] === "auth";

  useEffect(() => {
    if (!user && !inAuthGroup) {
      router.replace("/auth");
    }
  }, [user, inAuthGroup]);
}

interface AuthState {
  user: null | { id: string; email: string };
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: true,
};

function authReducer(
  state: AuthState,
  action: { type: string; payload?: any }
): AuthState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "CLEAR_USER":
      return { ...state, user: null, loading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error fetching session:", error);
        } else if (data.session) {
          dispatch({ type: "SET_USER", payload: data.session.user });
          router.push("/(swipe)");
        } else {
          dispatch({ type: "SET_LOADING", payload: false });
        }
      } catch (error) {
        console.error("Error initializing session:", error);
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    initializeSession();

    const { subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          dispatch({ type: "SET_USER", payload: session.user });
        } else {
          dispatch({ type: "CLEAR_USER" });
        }
      }
    );

    return () => {
      subscription?.unsubscribe?.();
    };
  }, []);

  const value = {
    user: state.user,
    loading: state.loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Example of using dispatch function:
// Inside a component:
// const { user, loading, dispatch } = useAuth();
// dispatch({ type: "SET_LOADING", payload: true });
