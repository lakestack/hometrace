'use client';

import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogOut, ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function SignOutPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({
        callbackUrl: '/',
        redirect: true,
      });
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
    }
  };

  const handleCancel = () => {
    // Go back to the previous page or dashboard
    if (session?.user?.role === 'admin' || session?.user?.role === 'agent') {
      router.push('/admin/dashboard');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
            <LogOut className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign Out
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Are you sure you want to sign out?
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Confirm Sign Out</CardTitle>
            <CardDescription className="text-center">
              {session?.user && (
                <div className="flex items-center justify-center space-x-2 mt-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm text-gray-700">
                    {session.user.name || session.user.email}
                  </span>
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-gray-600">
              You will be signed out of your account and redirected to the home page.
            </div>
            
            <div className="flex flex-col space-y-3">
              <Button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {isSigningOut ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing out...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <LogOut className="h-4 w-4" />
                    <span>Yes, Sign Out</span>
                  </div>
                )}
              </Button>
              
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={isSigningOut}
                className="w-full"
              >
                <div className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Cancel</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Having trouble? Contact support for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
