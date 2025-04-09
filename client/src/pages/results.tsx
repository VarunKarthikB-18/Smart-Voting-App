import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResultCard } from '@/components/result-card';
import { Avatar } from '@/components/ui/custom-avatar';
import { fetchResults } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function ResultsPage() {
  // Fetch election results with automatic polling
  const { data: results, isLoading } = useQuery({
    queryKey: ['/api/results'],
    queryFn: fetchResults,
    refetchInterval: 5000, // Poll every 5 seconds for real-time updates
    staleTime: 1000 // Consider data stale after 1 second
  });
  
  // Prepare data for chart
  const chartData = results?.results.map(result => ({
    name: result.candidate.name,
    votes: result.votes,
    percentage: result.percentage
  })) || [];
  
  // Generate initials for leading candidate avatar
  const leadingCandidateInitials = results?.leadingCandidate?.candidate.name
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase();
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Election Results</h2>
        <p className="text-gray-500 dark:text-gray-300">
          Total votes: {isLoading 
            ? <Skeleton className="h-4 w-16 inline-block" /> 
            : <span>{results?.totalVotes.toLocaleString()}</span>
          }
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Vote Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {isLoading ? (
                  <div className="w-full h-full bg-gray-100 animate-pulse rounded"></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis label={{ value: 'Number of Votes', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'votes') return [`${value} votes`, 'Votes'];
                          return [value, name];
                        }}
                      />
                      <Bar 
                        dataKey="votes" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vote Percentages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                ))
              ) : (
                results?.results.map((result) => (
                  <ResultCard key={result.candidate.id} result={result} />
                ))
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Leading Candidate</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center animate-pulse">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mr-4"></div>
                  <div className="space-y-2">
                    <div className="h-6 bg-gray-200 rounded w-40"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 rounded w-48"></div>
                  </div>
                </div>
              ) : (
                results?.leadingCandidate ? (
                  <div className="flex items-center">
                    <Avatar 
                      src={results.leadingCandidate.candidate.avatarUrl} 
                      alt={results.leadingCandidate.candidate.name}
                      fallback={leadingCandidateInitials || ""}
                      size="lg"
                      className="mr-4"
                    />
                    <div>
                      <div className="text-xl font-bold mb-1 dark:text-white">
                        {results.leadingCandidate.candidate.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-300 mb-2">
                        {results.leadingCandidate.candidate.party}
                      </div>
                      <div className="text-sm font-medium text-primary">
                        {results.results[1] && (
                          <>
                            Leading by {results.leadingCandidate.percentage - results.results[1].percentage}% 
                            ({results.leadingCandidate.votes - results.results[1].votes} votes)
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">No votes have been cast yet.</div>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
