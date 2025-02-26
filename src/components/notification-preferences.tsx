"use client";

import React, { useState } from 'react';
import { useNotifications } from '@/contexts/notification-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { toast } from './ui/use-toast';
import { Loader2 } from 'lucide-react';

export function NotificationPreferences() {
  const { preferences, updatePreferences, preferencesLoading } = useNotifications();
  
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Handle preference changes
  const handleToggle = (key: keyof typeof localPreferences) => {
    setLocalPreferences((prev) => {
      const newPreferences = { ...prev, [key]: !prev[key] };
      setHasChanges(true);
      return newPreferences;
    });
  };
  
  // Save preferences
  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePreferences(localPreferences);
      setHasChanges(false);
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved.",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to update preferences:", error);
      toast({
        title: "Update failed",
        description: "There was a problem updating your preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Reset preferences to current saved values
  const handleCancel = () => {
    setLocalPreferences(preferences);
    setHasChanges(false);
  };
  
  if (preferencesLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Choose how and when you would like to be notified about activity related to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-medium text-sm">Notification Channels</h3>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="inApp">In-App Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications within the application
                </p>
              </div>
              <Switch
                id="inApp"
                checked={localPreferences.inApp}
                onCheckedChange={() => handleToggle('inApp')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                id="email"
                checked={localPreferences.email}
                onCheckedChange={() => handleToggle('email')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="pushNotifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive push notifications on your device
                </p>
              </div>
              <Switch
                id="pushNotifications"
                checked={localPreferences.pushNotifications}
                onCheckedChange={() => handleToggle('pushNotifications')}
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-medium text-sm">Notification Types</h3>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="serviceStatusUpdates">Service Status Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Updates about your service requests
                </p>
              </div>
              <Switch
                id="serviceStatusUpdates"
                checked={localPreferences.serviceStatusUpdates}
                onCheckedChange={() => handleToggle('serviceStatusUpdates')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="paymentUpdates">Payment Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications about payments and invoices
                </p>
              </div>
              <Switch
                id="paymentUpdates"
                checked={localPreferences.paymentUpdates}
                onCheckedChange={() => handleToggle('paymentUpdates')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="mechanicUpdates">Mechanic Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Updates from mechanics about your vehicle
                </p>
              </div>
              <Switch
                id="mechanicUpdates"
                checked={localPreferences.mechanicUpdates}
                onCheckedChange={() => handleToggle('mechanicUpdates')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketingUpdates">Marketing Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Promotions, news, and marketing communications
                </p>
              </div>
              <Switch
                id="marketingUpdates"
                checked={localPreferences.marketingUpdates}
                onCheckedChange={() => handleToggle('marketingUpdates')}
              />
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end space-x-2">
        {hasChanges && (
          <>
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
} 