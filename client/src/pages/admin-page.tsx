import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Candidate, insertCandidateSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Trash2, UserCheck, Edit, PlusCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Avatar } from "@/components/ui/custom-avatar";

// Define the candidate form schema
const candidateFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  party: z.string().min(2, "Party must be at least 2 characters"),
  slogan: z.string().min(5, "Slogan must be at least 5 characters"),
  avatarUrl: z.string().url("Please enter a valid URL"),
});

type CandidateFormData = z.infer<typeof candidateFormSchema>;

// Define the voters interface
interface VoterData {
  id: number;
  name: string;
  email: string;
  username: string;
  hasVoted: boolean;
  votedFor: number | null;
  createdAt: string;
  role: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<string>("candidates");
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

  // Redirect if not admin
  if (user && user.role !== "admin") {
    return <Redirect to="/" />;
  }

  // Fetch candidates
  const { 
    data: candidates = [], 
    isLoading: candidatesLoading,
    error: candidatesError
  } = useQuery<Candidate[]>({
    queryKey: ["/api/candidates"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch voters
  const { 
    data: voters = [], 
    isLoading: votersLoading,
    error: votersError
  } = useQuery<VoterData[]>({
    queryKey: ["/api/admin/voters"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Add Candidate Mutation
  const addCandidateMutation = useMutation({
    mutationFn: async (candidateData: CandidateFormData) => {
      const res = await apiRequest("POST", "/api/admin/candidates", candidateData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Candidate Added",
        description: "The candidate has been added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add candidate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Edit Candidate Mutation
  const editCandidateMutation = useMutation({
    mutationFn: async (candidateData: Candidate) => {
      const res = await apiRequest("PUT", `/api/admin/candidates/${candidateData.id}`, candidateData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Candidate Updated",
        description: "The candidate has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      setEditingCandidate(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update candidate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete Candidate Mutation
  const deleteCandidateMutation = useMutation({
    mutationFn: async (candidateId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/candidates/${candidateId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Candidate Deleted",
        description: "The candidate has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete candidate",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete Voter Mutation
  const deleteVoterMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "User Deleted",
        description: "The user has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/voters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Candidate form
  const form = useForm<CandidateFormData>({
    resolver: zodResolver(candidateFormSchema),
    defaultValues: {
      name: "",
      party: "",
      slogan: "",
      avatarUrl: "",
    }
  });

  // Update form values when editing candidate
  useEffect(() => {
    if (editingCandidate) {
      form.reset({
        name: editingCandidate.name,
        party: editingCandidate.party,
        slogan: editingCandidate.slogan,
        avatarUrl: editingCandidate.avatarUrl,
      });
    }
  }, [editingCandidate, form]);

  // Form submission handler
  const onSubmit = (data: CandidateFormData) => {
    if (editingCandidate) {
      editCandidateMutation.mutate({
        ...editingCandidate,
        ...data,
      });
    } else {
      addCandidateMutation.mutate(data);
    }
  };
  
  // Handle voter deletion
  const handleDeleteVoter = (userId: number) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      deleteVoterMutation.mutate(userId);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="candidates">Manage Candidates</TabsTrigger>
          <TabsTrigger value="voters">View Voters</TabsTrigger>
        </TabsList>

        <TabsContent value="candidates">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Candidate Form */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>{editingCandidate ? "Edit Candidate" : "Add New Candidate"}</CardTitle>
                <CardDescription>
                  {editingCandidate 
                    ? "Update the candidate information" 
                    : "Fill in the details to add a new candidate"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Candidate name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="party"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Party</FormLabel>
                          <FormControl>
                            <Input placeholder="Political party" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="slogan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slogan</FormLabel>
                          <FormControl>
                            <Input placeholder="Campaign slogan" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="avatarUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Avatar URL</FormLabel>
                          <FormControl>
                            <Input placeholder="URL to candidate's image" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex space-x-2">
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={addCandidateMutation.isPending || editCandidateMutation.isPending}
                      >
                        {(addCandidateMutation.isPending || editCandidateMutation.isPending) ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {editingCandidate ? "Updating..." : "Adding..."}
                          </>
                        ) : (
                          <>
                            {editingCandidate ? "Update Candidate" : "Add Candidate"}
                          </>
                        )}
                      </Button>
                      {editingCandidate && (
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            setEditingCandidate(null);
                            form.reset();
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Candidates List */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Current Candidates</CardTitle>
                <CardDescription>
                  List of all candidates in the election
                </CardDescription>
              </CardHeader>
              <CardContent>
                {candidatesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : candidatesError ? (
                  <div className="text-center py-8 text-destructive">
                    Error loading candidates
                  </div>
                ) : candidates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No candidates added yet
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Image</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Party</TableHead>
                          <TableHead>Slogan</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {candidates.map((candidate) => (
                          <TableRow key={candidate.id}>
                            <TableCell>
                              <Avatar 
                                src={candidate.avatarUrl} 
                                alt={candidate.name} 
                                fallback={candidate.name.charAt(0)}
                                size="sm"
                              />
                            </TableCell>
                            <TableCell className="font-medium">{candidate.name}</TableCell>
                            <TableCell>{candidate.party}</TableCell>
                            <TableCell>{candidate.slogan}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingCandidate(candidate)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteCandidateMutation.mutate(candidate.id)}
                                  disabled={deleteCandidateMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="voters">
          <Card>
            <CardHeader>
              <CardTitle>Registered Voters</CardTitle>
              <CardDescription>
                List of all registered voters and their voting status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {votersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : votersError ? (
                <div className="text-center py-8 text-destructive">
                  Error loading voters
                </div>
              ) : voters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No registered voters yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Registration Time</TableHead>
                        <TableHead>Voting Status</TableHead>
                        <TableHead>Voted For</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {voters.map((voter) => {
                        const votedForCandidate = candidates.find(c => c.id === voter.votedFor);
                        const registrationTime = new Date(parseInt(voter.createdAt)).toLocaleString();
                        
                        return (
                          <TableRow key={voter.id} className={voter.role === 'admin' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                            <TableCell className="font-medium">
                              {voter.name}
                              {voter.role === 'admin' && (
                                <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                                  Admin
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{voter.username}</TableCell>
                            <TableCell>{voter.email}</TableCell>
                            <TableCell>{registrationTime}</TableCell>
                            <TableCell>
                              {voter.hasVoted ? (
                                <span className="inline-flex items-center text-green-600 dark:text-green-400">
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  Voted
                                </span>
                              ) : (
                                <span className="text-amber-600 dark:text-amber-400">
                                  Not voted yet
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {votedForCandidate ? (
                                <div className="flex items-center space-x-2">
                                  <Avatar 
                                    src={votedForCandidate.avatarUrl} 
                                    alt={votedForCandidate.name} 
                                    fallback={votedForCandidate.name.charAt(0)}
                                    size="sm"
                                  />
                                  <span>{votedForCandidate.name}</span>
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {voter.role !== 'admin' && voter.id !== user?.id && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteVoter(voter.id)}
                                  className="ml-auto"
                                  disabled={deleteVoterMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}