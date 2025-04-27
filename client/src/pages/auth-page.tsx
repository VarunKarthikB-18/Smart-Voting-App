import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth, registerFormSchema, type RegisterFormData } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { loginUserSchema, type LoginUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { FaceRegistration } from "@/components/face-registration";
import { toast } from "@/components/ui/use-toast";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showFaceRegistration, setShowFaceRegistration] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [_, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();

  // Single useEffect to handle all auth-related redirects
  useEffect(() => {
    if (!user) {
      // If no user, reset face registration state
      setShowFaceRegistration(false);
      setRegistrationComplete(false);
      return;
    }

    // If user is logged in and face is registered, go to home
    if (user.faceRegistered) {
      setLocation("/");
    }
    // Only show face registration after new registration, not during login
    else if (activeTab === "register" && !showFaceRegistration && registrationComplete) {
      setShowFaceRegistration(true);
    }
  }, [user, showFaceRegistration, activeTab, registrationComplete, setLocation]);

  // Login Form
  const loginForm = useForm<LoginUser>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });

  const onLoginSubmit = async (data: LoginUser) => {
    try {
      await loginMutation.mutateAsync(data);
    } catch (error) {
      // Error is already handled by the mutation
      console.error('Login error:', error);
    }
  };

  // Register Form
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      name: "",
      email: "",
    }
  });

  const onRegisterSubmit = async (data: RegisterFormData) => {
    try {
      await registerMutation.mutateAsync(data);
      setRegistrationComplete(true);
      toast({
        title: "Registration Successful",
        description: "Please complete face registration to continue.",
      });
    } catch (error) {
      // Error is already handled by the mutation
      console.error('Registration error:', error);
    }
  };

  const handleFaceRegistrationComplete = () => {
    toast({
      title: "Face Registration Complete",
      description: "You can now proceed to login and vote.",
    });
    setRegistrationComplete(true);
    setLocation("/");
  };

  const handleFaceRegistrationCancel = () => {
    toast({
      title: "Face Registration Required",
      description: "You must complete face registration to use the voting system.",
      variant: "destructive"
    });
    // Stay on face registration
  };

  if (showFaceRegistration) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 bg-primary/5">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Face Registration Required</h2>
            <p className="text-gray-500">
              Please complete face registration to ensure secure voting.
              Your face will be verified each time you cast a vote.
            </p>
          </div>
          <FaceRegistration
            onRegistrationComplete={handleFaceRegistrationComplete}
            onCancel={handleFaceRegistrationCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Auth form column */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="username" 
                                {...field} 
                                disabled={loginMutation.isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                {...field} 
                                disabled={loginMutation.isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in...
                          </>
                        ) : "Login"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button 
                    variant="ghost" 
                    onClick={() => setActiveTab("register")}
                    disabled={loginMutation.isPending}
                  >
                    Don't have an account? Register
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>
                    Enter your information to register
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="John Doe" 
                                {...field} 
                                disabled={registerMutation.isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="name@example.com" 
                                {...field} 
                                disabled={registerMutation.isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="johndoe" 
                                {...field} 
                                disabled={registerMutation.isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                {...field} 
                                disabled={registerMutation.isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                {...field} 
                                disabled={registerMutation.isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Registering...
                          </>
                        ) : "Register"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button 
                    variant="ghost" 
                    onClick={() => setActiveTab("login")}
                    disabled={registerMutation.isPending}
                  >
                    Already have an account? Login
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Hero column */}
      <div className="flex-1 bg-primary/10 hidden lg:flex flex-col items-center justify-center p-12">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 text-transparent bg-clip-text">
            Secure Electronic Voting
          </h1>
          <div className="mb-6 space-y-4">
            <p className="text-lg">
              Welcome to the 2025 Election Voting Platform, a secure and transparent way to cast your vote.
            </p>
            <p>
              Our system implements advanced facial recognition technology to ensure the integrity of the electoral process.
            </p>
            <p>
              Your vote is secure, private, and matters. Join us in shaping the future through democratic participation.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-lg">
            <h3 className="font-semibold mb-2">Key Features:</h3>
            <ul className="space-y-2 text-left">
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>Biometric verification for secure voting</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>Real-time results and statistics</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>One-person, one-vote enforcement</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>Transparent electoral process</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}