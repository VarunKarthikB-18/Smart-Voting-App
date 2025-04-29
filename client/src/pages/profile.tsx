import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';

function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* User Info */}
            <div>
              <h3 className="text-lg font-medium">Account Information</h3>
              <div className="mt-2 space-y-2">
                <p><span className="font-medium">Name:</span> {user?.name}</p>
                <p><span className="font-medium">Email:</span> {user?.email}</p>
                <p><span className="font-medium">Username:</span> {user?.username}</p>
              </div>
            </div>

            {/* Face Registration Section */}
            <div>
              <h3 className="text-lg font-medium">Face Verification</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-4">
                  {user?.faceRegistered 
                    ? "Your face is registered for verification. You can update it if needed."
                    : "Register your face to enable secure voting with face verification."}
                </p>
                <Button
                  onClick={() => window.location.href = '/register-face'}
                  variant={user?.faceRegistered ? "outline" : "default"}
                >
                  {user?.faceRegistered ? "Update Face Registration" : "Register Face"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProfilePage; 