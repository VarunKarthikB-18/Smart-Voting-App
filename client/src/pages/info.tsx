import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function InfoPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Election Information</h2>
        <p className="text-gray-500">Details about the current election and voting process</p>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Presidential Election {new Date().getFullYear()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Election Details</h4>
              <dl className="space-y-2">
                <div className="flex">
                  <dt className="w-36 text-sm text-gray-500">Election Type:</dt>
                  <dd className="flex-1 text-sm">Presidential</dd>
                </div>
                <div className="flex">
                  <dt className="w-36 text-sm text-gray-500">Start Date:</dt>
                  <dd className="flex-1 text-sm">{new Date().toLocaleDateString()} - 12:00 AM</dd>
                </div>
                <div className="flex">
                  <dt className="w-36 text-sm text-gray-500">End Date:</dt>
                  <dd className="flex-1 text-sm">{new Date().toLocaleDateString()} - 12:00 PM</dd>
                </div>
                <div className="flex">
                  <dt className="w-36 text-sm text-gray-500">Eligible Voters:</dt>
                  <dd className="flex-1 text-sm">3,245,678</dd>
                </div>
                <div className="flex">
                  <dt className="w-36 text-sm text-gray-500">Candidates:</dt>
                  <dd className="flex-1 text-sm">4 candidates</dd>
                </div>
              </dl>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Voting Rules</h4>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-500">
                <li>Each registered voter can cast one vote</li>
                <li>Face verification is required for registration and voting</li>
                <li>Voters must complete face registration before voting</li>
                <li>Results are updated in real-time</li>
                <li>Voting cannot be changed after submission</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>How Voting Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <span className="text-primary font-semibold">1</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Review Candidates</h4>
                <p className="text-sm text-gray-500">View all available candidates and their information</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <span className="text-primary font-semibold">2</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Cast Your Vote</h4>
                <p className="text-sm text-gray-500">Click the "Vote" button for your chosen candidate</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <span className="text-primary font-semibold">3</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Face Verification</h4>
                <p className="text-sm text-gray-500">Complete facial recognition to confirm your identity</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <span className="text-primary font-semibold">4</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Confirm Your Selection</h4>
                <p className="text-sm text-gray-500">Verify your choice and submit your final vote</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <span className="text-primary font-semibold">5</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">View Results</h4>
                <p className="text-sm text-gray-500">Check real-time results and statistics after voting</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
