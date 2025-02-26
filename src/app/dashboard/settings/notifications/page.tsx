"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Loader, Save, AlertTriangle } from "lucide-react";

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  serviceStatusUpdates: boolean;
  paymentReminders: boolean;
  marketingEmails: boolean;
  driverUpdates: boolean;
}

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  key: keyof NotificationPreferences;
}

export default function NotificationSettings() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: false,
    serviceStatusUpdates: true,
    paymentReminders: true,
    marketingEmails: false,
    driverUpdates: user?.role === 'driver',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    fetchNotificationPreferences();
  }, [user, router]);

  const fetchNotificationPreferences = async () => {
    setLoading(true);
    setError(null);

    try {
      // In a real app, fetch from an API
      // For now, we'll simulate a delay and use default values
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Simulate preferences based on role
      if (user?.role === 'driver') {
        setPreferences({
          ...preferences,
          driverUpdates: true,
        });
      }
      
      setLoading(false);
    } catch (err) {
      setError('Failed to load notification preferences');
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // In a real app, save to an API
      // For now, we'll simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings updated",
        description: "Your notification preferences have been saved.",
      });
      
      setSaving(false);
    } catch (err) {
      setError('Failed to save preferences');
      setSaving(false);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save notification preferences. Please try again.",
      });
    }
  };

  const notificationSettings: NotificationSetting[] = [
    {
      id: "email-notifications",
      label: "Email Notifications",
      description: "Receive notifications via email",
      key: "emailNotifications",
    },
    {
      id: "push-notifications",
      label: "Push Notifications",
      description: "Receive push notifications on your device",
      key: "pushNotifications",
    },
    {
      id: "service-status-updates",
      label: "Service Status Updates",
      description: "Get notified when your service request status changes",
      key: "serviceStatusUpdates",
    },
    {
      id: "payment-reminders",
      label: "Payment Reminders",
      description: "Receive reminders about pending payments",
      key: "paymentReminders",
    },
    {
      id: "marketing-emails",
      label: "Marketing Emails",
      description: "Receive promotional offers and updates",
      key: "marketingEmails",
    },
  ];

  // Only show driver updates for drivers
  if (user?.role === 'driver') {
    notificationSettings.push({
      id: "driver-updates",
      label: "Driver Assignments",
      description: "Get notified about new job assignments",
      key: "driverUpdates",
    });
  }

  return (
    <div className="container max-w-2xl py-6">
      <h1 className="text-2xl font-bold mb-6">Notification Settings</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Manage Your Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-6">
              <Loader className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}
              
              {notificationSettings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between">
                  <div>
                    <label 
                      htmlFor={setting.id}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {setting.label}
                    </label>
                    <p className="text-sm text-gray-500">{setting.description}</p>
                  </div>
                  <Switch 
                    id={setting.id}
                    checked={preferences[setting.key]}
                    onCheckedChange={() => handleToggle(setting.key)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button 
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 