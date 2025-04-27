import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { 
  insertUserSchema, 
  type User,
  loginUserSchema,
  type LoginUser
} from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { clearVoteData } from "../lib/api";
import { z } from "zod";
import { useLocation } from "wouter";

// Registration schema with password confirmation
export const registerFormSchema = insertUserSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine(
  data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  }
);

// Registration form data type
export type RegisterFormData = z.infer<typeof registerFormSchema>;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginUser>;
  registerMutation: UseMutationResult<User, Error, RegisterFormData>;
  logoutMutation: UseMutationResult<void, Error, void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: async ({ signal }) => {
      console.log('Fetching user data...');
      const data = await getQueryFn({ on401: "returnNull" })({ 
        queryKey: ["/api/user"],
        signal,
        client: queryClient,
        meta: undefined
      });
      console.log('User data received:', data);
      return data as User | null;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const loginMutation = useMutation<User, Error, LoginUser>({
    mutationFn: async (credentials) => {
      console.log('Attempting login with:', credentials.username);
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        const error = await res.json();
        console.error('Login response not ok:', error);
        throw new Error(error.message || 'Login failed');
      }
      const userData = await res.json();
      console.log('Login successful:', userData);
      return userData;
    },
    onSuccess: (user) => {
      console.log('Login mutation success:', user);
      // Clear any previous voting data in localStorage
      clearVoteData();
      
      // Update global state
      queryClient.setQueryData(["/api/user"], user);
      
      // Show welcome message
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`,
      });

      // Navigate based on user role
      if (user.role === 'admin') {
        setLocation('/admin');
      } else if (user.faceRegistered) {
        setLocation('/');
      }
    },
    onError: (error) => {
      console.error('Login mutation error:', error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterFormData) => {
      // Remove confirm password before sending to API
      const { confirmPassword, ...registerData } = userData;
      const res = await apiRequest("POST", "/api/register", registerData);
      return await res.json();
    },
    onSuccess: (user: User) => {
      // Clear any previous voting data in localStorage
      clearVoteData();
      
      // Update global state
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Clear voting data in localStorage
      clearVoteData();
      
      // Update global state
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      
      // Redirect to login page
      setLocation('/auth');
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message || "Could not log out",
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}