"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

function DriverProfileSection() {
  const [paymentMethod, setPaymentMethod] = useState("bank");
  const [bankDetails, setBankDetails] = useState({
    accountName: "",
    accountNumber: "",
    routingNumber: "",
    bankName: ""
  });
  const [paypalEmail, setPaypalEmail] = useState("");
  const [isEditingPayment, setIsEditingPayment] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setBankDetails({
        accountName: "John Driver",
        accountNumber: "****4567",
        routingNumber: "****1234",
        bankName: "First National Bank"
      });
      setPaypalEmail("john.driver@example.com");
    }, 500);
  }, []);

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
  };

  const handleSavePaymentDetails = () => {
    setIsEditingPayment(false);
    alert("Payment details updated successfully!");
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Driver Information</CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage your driver profile and payment settings
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Driver Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$1,245.00</div>
              <p className="text-xs text-gray-500">
                Lifetime earnings
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">47</div>
              <p className="text-xs text-gray-500">
                All time
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Next Payout</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$124.50</div>
              <p className="text-xs text-gray-500">
                Scheduled for {new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Payment Method</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditingPayment(!isEditingPayment)}
            >
              {isEditingPayment ? "Cancel" : "Edit"}
            </Button>
          </div>

          {isEditingPayment ? (
            <div className="space-y-4">
              <div className="flex space-x-4">
                <Button
                  variant={paymentMethod === "bank" ? "default" : "outline"}
                  onClick={() => handlePaymentMethodChange("bank")}
                >
                  Bank Account
                </Button>
                <Button
                  variant={paymentMethod === "paypal" ? "default" : "outline"}
                  onClick={() => handlePaymentMethodChange("paypal")}
                >
                  PayPal
                </Button>
              </div>

              {paymentMethod === "bank" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="accountName" className="text-sm font-medium">Account Holder Name</label>
                      <Input
                        id="accountName"
                        value={bankDetails.accountName}
                        onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="bankName" className="text-sm font-medium">Bank Name</label>
                      <Input
                        id="bankName"
                        value={bankDetails.bankName}
                        onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="accountNumber" className="text-sm font-medium">Account Number</label>
                      <Input
                        id="accountNumber"
                        value={bankDetails.accountNumber}
                        type="password"
                        onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="routingNumber" className="text-sm font-medium">Routing Number</label>
                      <Input
                        id="routingNumber"
                        value={bankDetails.routingNumber}
                        type="password"
                        onChange={(e) => setBankDetails({...bankDetails, routingNumber: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label htmlFor="paypalEmail" className="text-sm font-medium">PayPal Email</label>
                  <Input
                    id="paypalEmail"
                    type="email"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                  />
                </div>
              )}

              <Button onClick={handleSavePaymentDetails}>
                Save Payment Details
              </Button>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              {paymentMethod === "bank" ? (
                <div>
                  <h4 className="font-medium mb-2">Bank Account</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Account Name: {bankDetails.accountName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Account Number: {bankDetails.accountNumber}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Bank: {bankDetails.bankName}</p>
                </div>
              ) : (
                <div>
                  <h4 className="font-medium mb-2">PayPal</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Email: {paypalEmail}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Driver Preferences */}
        <div>
          <h3 className="text-lg font-medium mb-4">Driver Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Receive Job Notifications</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get notified when new jobs are available in your area
                </p>
              </div>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700">
                <span className="absolute h-4 w-4 transform rounded-full bg-white dark:bg-gray-300 translate-x-6"></span>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Maximum Job Distance</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Set the maximum distance for available jobs
                </p>
              </div>
              <select 
                className="w-[100px] h-10 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                defaultValue="25"
              >
                <option value="10">10 miles</option>
                <option value="25">25 miles</option>
                <option value="50">50 miles</option>
                <option value="100">100 miles</option>
              </select>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Available for Work</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Toggle this when you're not available to receive job requests
                </p>
              </div>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700">
                <span className="absolute h-4 w-4 transform rounded-full bg-white dark:bg-gray-300 translate-x-6"></span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  // For demo purposes, hardcode the user role as "driver"
  const [userRole, setUserRole] = useState<"customer" | "mechanic" | "driver">("driver");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="mb-4">
        <Button onClick={() => setUserRole("customer")}>Customer View</Button>
        <Button onClick={() => setUserRole("mechanic")} className="mx-2">Mechanic View</Button>
        <Button onClick={() => setUserRole("driver")}>Driver View</Button>
        <p className="mt-2 text-sm text-gray-500">Current role: {userRole}</p>
      </div>
      
      {userRole === "driver" && <DriverProfileSection />}
    </div>
  )
} 