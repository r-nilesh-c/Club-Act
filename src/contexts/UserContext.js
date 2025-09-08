import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.REACT_APP_SUPABASE_ANON_KEY;
  
  const isConfigured = url && key && 
    url !== 'YOUR_SUPABASE_URL' && 
    url !== 'your-project-url' &&
    key !== 'YOUR_SUPABASE_ANON_KEY';
    
  return isConfigured;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [memberData, setMemberData] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const initializeSupabaseAuth = useCallback(async () => {
    // Local function to fetch member data
    const fetchMemberDataLocal = async (userId) => {
      if (!isSupabaseConfigured()) return;
      
      try {
        const { data, error } = await supabase
          .from('club_members')
          .select('*')
          .eq('id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          return;
        }

        setMemberData(data);
      } catch (error) {
        // Silent fail for security
      }
    };

    try {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchMemberDataLocal(session.user.id);
      }
      setLoading(false);

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            setUser(session.user);
            await fetchMemberDataLocal(session.user.id);
          } else {
            setUser(null);
            setMemberData(null);
          }
          setLoading(false);
        }
      );

      return () => subscription?.unsubscribe();
    } catch (error) {
      // Fallback to local auth without calling it directly to avoid dependency issue
      setLoading(false);
    }
  }, []); // Remove fetchMemberData dependency to avoid circular dependency

  const initializeLocalAuth = useCallback(() => {
    // Don't restore session if we're logging out
    if (isLoggingOut) {
      setLoading(false);
      return;
    }
    
    // Check sessionStorage for temporary auth (more secure than localStorage)
    const savedUser = sessionStorage.getItem('clubUserSession');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        // Only restore basic user info, not sensitive data
        setUser({
          userType: userData.userType,
          email: userData.email ? userData.email.split('@')[0] + '@***' : null // Mask email
        });
        if (userData.userType === 'member') {
          setMemberData({
            name: userData.name || 'Club Member',
            membership_type: userData.membershipType || 'regular'
          });
        }
      } catch (error) {
        sessionStorage.removeItem('clubUserSession');
      }
    }
    setLoading(false);
  }, [isLoggingOut]);

  useEffect(() => {
    // Don't initialize auth if we're in the middle of logging out
    if (isLoggingOut) return;
    
    if (isSupabaseConfigured()) {
      // Use Supabase auth
      initializeSupabaseAuth();
    } else {
      // Fallback to local storage auth
      initializeLocalAuth();
    }
  }, [isLoggingOut, initializeSupabaseAuth, initializeLocalAuth]);

  // Fetch member data from club_members table
  const fetchMemberData = useCallback(async (userId) => {
    if (!isSupabaseConfigured()) return;
    
    try {
      const { data, error } = await supabase
        .from('club_members')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        return;
      }

      setMemberData(data);
    } catch (error) {
      // Silent fail for security
    }
  }, []);

  // Login with email and password
  const loginWithEmail = async (email, password) => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;
        return { success: true, user: data.user };
      } catch (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Demo authentication for development only
      try {
        // IMPORTANT: This is for demo purposes only - never store credentials in production
        if (email === 'president@club.com' && password === 'password123') {
          const userData = {
            email: email.split('@')[0] + '@***', // Mask email
            userType: 'member',
            membershipType: 'executive'
          };
          setUser(userData);
          setMemberData({
            name: 'Club President',
            membership_type: 'executive'
          });
          // Use sessionStorage instead of localStorage for temporary session
          sessionStorage.setItem('clubUserSession', JSON.stringify({
            userType: 'member',
            membershipType: 'executive',
            name: 'Club President'
          }));
          return { success: true, user: userData };
        } else if (email === 'member@club.com' && password === 'password123') {
          const userData = {
            email: email.split('@')[0] + '@***', // Mask email
            userType: 'member',
            membershipType: 'regular'
          };
          setUser(userData);
          setMemberData({
            name: 'Club Member',
            membership_type: 'regular'
          });
          sessionStorage.setItem('clubUserSession', JSON.stringify({
            userType: 'member',
            membershipType: 'regular',
            name: 'Club Member'
          }));
          return { success: true, user: userData };
        } else {
          return { success: false, error: 'Invalid credentials' };
        }
      } catch (error) {
        return { success: false, error: 'Login failed' };
      }
    }
  };

  // Logout
  const logout = async () => {
    try {
      setIsLoggingOut(true);
      
      if (isSupabaseConfigured()) {
        try {
          const { error } = await supabase.auth.signOut();
          if (error) {
            // Even if Supabase logout fails, continue with local cleanup
          }
        } catch (supabaseError) {
          // Continue with local cleanup even if Supabase fails
        }
      }
      
      // Always clear session storage and state regardless of Supabase result
      sessionStorage.removeItem('clubUserSession');
      setUser(null);
      setMemberData(null);
      setLoading(false);
      setIsLoggingOut(false); // Reset the logout flag
      
      return { success: true };
    } catch (error) {
      // Even if there's an error, clear local state
      setUser(null);
      setMemberData(null);
      sessionStorage.removeItem('clubUserSession');
      setLoading(false);
      setIsLoggingOut(false); // Reset the logout flag
      
      return { success: true }; // Return success even if there was an error, since we cleared the state
    }
  };

  // Continue as student (no auth required)
  const continueAsStudent = () => {
    const studentUser = { userType: 'student' };
    setUser(studentUser);
    setMemberData(null);
    if (!isSupabaseConfigured()) {
      sessionStorage.setItem('clubUserSession', JSON.stringify(studentUser));
    }
  };

  // Helper functions
  const isAuthenticated = !!user;
  
  const isMember = () => {
    // For Supabase auth: check memberData
    if (memberData && user && user.email) return true;
    
    // For local auth: check userType
    if (user && user.userType === 'member') return true;
    
    return false;
  };

  const isStudent = () => {
    return user && user.userType === 'student';
  };

  const isExecutive = () => {
    // For Supabase auth: check memberData
    if (memberData && memberData.membership_type === 'executive') return true;
    
    // For local auth: check user object
    if (user && user.userType === 'member' && user.membershipType === 'executive') return true;
    
    return false;
  };

  const getMembershipType = () => {
    // For Supabase auth
    if (memberData?.membership_type) return memberData.membership_type;
    
    // For local auth
    if (user?.membershipType) return user.membershipType;
    
    return null;
  };

  const getUserType = () => {
    if (isMember()) return 'member';
    if (isStudent()) return 'student';
    return 'guest';
  };

  const getUserDisplayName = () => {
    // Check memberData first (Supabase auth)
    if (memberData?.name) return memberData.name;
    
    // Check user object name (local auth)
    if (user?.name) return user.name;
    
    // Check user metadata (Supabase auth)
    if (user?.user_metadata?.name) return user.user_metadata.name;
    
    // Fallback to email username
    if (user?.email) return user.email.split('@')[0];
    
    return 'User';
  };

  const getMemberDiscount = () => {
    if (!isMember()) return 0;
    
    // Get membership type from either source
    const membershipType = getMembershipType();
    
    switch (membershipType) {
      case 'executive': return 0.5; // 50% discount
      case 'regular': return 0.2;   // 20% discount
      case 'alumni': return 0.15;   // 15% discount
      default: return 0;
    }
  };

  const value = {
    // Auth state
    user,
    memberData,
    loading,
    isAuthenticated,
    
    // Auth methods
    loginWithEmail,
    logout,
    continueAsStudent,
    
    // User type helpers
    isMember,
    isStudent,
    isExecutive,
    getUserType,
    getUserDisplayName,
    getMembershipType,
    getMemberDiscount,
    
    // Refresh member data
    refreshMemberData: () => user && fetchMemberData(user.id)
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext };