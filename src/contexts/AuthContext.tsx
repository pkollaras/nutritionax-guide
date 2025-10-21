import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getTranslation } from '@/i18n/translations';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: 'admin' | 'user' | 'super_admin' | null;
  nutritionistId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user' | 'super_admin' | null>(null);
  const [nutritionistId, setNutritionistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) throw error;
      
      // If user has multiple roles, prioritize super_admin, then admin
      if (data && data.length > 0) {
        const hasSuperAdmin = data.some(r => r.role === 'super_admin');
        const hasAdmin = data.some(r => r.role === 'admin');
        const role = hasSuperAdmin ? 'super_admin' : (hasAdmin ? 'admin' : data[0].role as 'admin' | 'user' | 'super_admin');
        setUserRole(role);
        
        // If admin or super_admin, fetch nutritionist_id
        if (role === 'admin' || role === 'super_admin') {
          const { data: nutritionistData } = await supabase
            .from('nutritionists')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();
          
          setNutritionistId(nutritionistData?.id || null);
        } else {
          setNutritionistId(null);
        }
      } else {
        setUserRole('user');
        setNutritionistId(null);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('user');
      setNutritionistId(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
      }
      
      return { error };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name,
          },
        },
      });
      
      if (error) {
        toast({
          title: "Signup Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Account created successfully!",
        });
      }
      
      return { error };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      // 403 errors are expected when session is already expired
      // Treat as successful logout since session is gone anyway
      if (error && error.status !== 403) {
        throw error;
      }
      
      setUserRole(null);
      const lang = localStorage.getItem('nutritionax-language') as 'el' | 'en' || 'el';
      
      toast({
        title: getTranslation(lang, 'auth.signedOut'),
        description: getTranslation(lang, 'auth.signedOutSuccess'),
      });
      
      // Redirect to auth page after logout
      setTimeout(() => {
        window.location.href = '/auth';
      }, 500);
      
    } catch (error: any) {
      const lang = localStorage.getItem('nutritionax-language') as 'el' | 'en' || 'el';
      toast({
        title: getTranslation(lang, 'common.error'),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
      
      return { error };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
      
      return { error };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      userRole, 
      nutritionistId,
      loading, 
      signIn, 
      signUp, 
      signOut,
      resetPassword,
      updatePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
