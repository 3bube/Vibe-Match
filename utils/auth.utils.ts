import { supabase } from "../lib/supabase";

export const createAuthUser = async (
  name: string,
  email: string,
  password: string
): Promise<any> => {
  if (!email || !password) throw new Error("Email and password is required");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) throw new Error(error.message);

  return data;
};

export const createDbUser = async (
  name: string,
  email: string
): Promise<boolean> => {
  if (!email || !name) throw new Error("Email and name is required");

  const { error } = await supabase.from("users").insert({
    name,
    email,
  });

  if (error) throw new Error(error.message);

  return true;
};

export const login = async (email: string, password: string): Promise<any> => {
  if (!email || !password) throw new Error("Email and password is required");

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);

  return data;
};

export const setSession = async (session: any): Promise<boolean> => {
  if (!session) throw new Error("Session is required");

  const { error } = await supabase.auth.setSession(session);

  if (error) throw new Error(error.message);

  return true;
};
