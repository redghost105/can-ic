"use client";

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, Save, ArrowRight, RefreshCcw, AlertCircle, Percent } from 'lucide-react';

interface FeeSplitterProps {
  initialRates?: {
    platform: number;
    shop: number;
    mechanic: number;
    driver?: number;
    tax: number;
  };
  canEdit?: boolean;
  onSave?: (rates: {
    platform: number;
    shop: number;
    mechanic: number;
    driver?: number;
    tax: number;
  }) => void;
}

export default function FeeSplitter({
  initialRates = {
    platform: 5,
    shop: 70,
    mechanic: 20,
    driver: 0,
    tax: 5
  },
  canEdit = false,
  onSave
}: FeeSplitterProps) {
  const [rates, setRates] = useState(initialRates);
  const [isEditing, setIsEditing] = useState(false);
  const [previewAmount, setPreviewAmount] = useState(100);
  const [useDriverFee, setUseDriverFee] = useState(initialRates.driver !== undefined && initialRates.driver > 0);
  const [error, setError] = useState<string | null>(null);

  const handleRateChange = (
    type: 'platform' | 'shop' | 'mechanic' | 'driver' | 'tax',
    value: number
  ) => {
    if (value < 0) value = 0;
    if (value > 100) value = 100;

    const newRates = { ...rates, [type]: value };
    const total = getTotalPercentage(newRates);

    if (total > 100) {
      setError('Total percentage cannot exceed 100%');
    } else {
      setError(null);
      setRates(newRates);
    }
  };

  const getTotalPercentage = (rateObj: typeof rates) => {
    const { platform, shop, mechanic, driver = 0, tax } = rateObj;
    return platform + shop + mechanic + (useDriverFee ? driver : 0) + tax;
  };

  const calculateAmount = (percentage: number) => {
    return (percentage / 100) * previewAmount;
  };

  const handleSave = () => {
    const total = getTotalPercentage(rates);
    if (total !== 100) {
      setError('Total percentage must equal 100% before saving');
      return;
    }

    if (onSave) {
      onSave(rates);
    }
    setIsEditing(false);
    setError(null);
  };

  const resetToDefaults = () => {
    setRates(initialRates);
    setUseDriverFee(initialRates.driver !== undefined && initialRates.driver > 0);
    setError(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const totalPercentage = getTotalPercentage(rates);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="percentage" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="percentage">Percentage</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="percentage" className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Fee Percentages</span>
                <span className={totalPercentage === 100 ? 'text-green-600' : 'text-amber-600'}>
                  Total: {totalPercentage}%
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Platform Fee */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="platform-fee">Platform Fee</Label>
                  <div className="flex items-center text-muted-foreground">
                    <Input
                      id="platform-percentage"
                      type="number"
                      value={rates.platform}
                      onChange={(e) => handleRateChange('platform', parseFloat(e.target.value))}
                      className="w-16 h-8 text-right mr-1"
                      disabled={!isEditing}
                      min={0}
                      max={100}
                      step={0.5}
                    />
                    <Percent className="h-4 w-4" />
                  </div>
                </div>
                <Slider
                  value={[rates.platform]}
                  onValueChange={(value) => handleRateChange('platform', value[0])}
                  min={0}
                  max={100}
                  step={0.5}
                  disabled={!isEditing}
                />
                <p className="text-xs text-muted-foreground">Platform fee for operating the service</p>
              </div>

              {/* Shop Fee */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="shop-fee">Shop Fee</Label>
                  <div className="flex items-center text-muted-foreground">
                    <Input
                      id="shop-percentage"
                      type="number"
                      value={rates.shop}
                      onChange={(e) => handleRateChange('shop', parseFloat(e.target.value))}
                      className="w-16 h-8 text-right mr-1"
                      disabled={!isEditing}
                      min={0}
                      max={100}
                      step={0.5}
                    />
                    <Percent className="h-4 w-4" />
                  </div>
                </div>
                <Slider
                  value={[rates.shop]}
                  onValueChange={(value) => handleRateChange('shop', value[0])}
                  min={0}
                  max={100}
                  step={0.5}
                  disabled={!isEditing}
                />
                <p className="text-xs text-muted-foreground">Fee paid to the repair shop</p>
              </div>

              {/* Mechanic Fee */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="mechanic-fee">Mechanic Fee</Label>
                  <div className="flex items-center text-muted-foreground">
                    <Input
                      id="mechanic-percentage"
                      type="number"
                      value={rates.mechanic}
                      onChange={(e) => handleRateChange('mechanic', parseFloat(e.target.value))}
                      className="w-16 h-8 text-right mr-1"
                      disabled={!isEditing}
                      min={0}
                      max={100}
                      step={0.5}
                    />
                    <Percent className="h-4 w-4" />
                  </div>
                </div>
                <Slider
                  value={[rates.mechanic]}
                  onValueChange={(value) => handleRateChange('mechanic', value[0])}
                  min={0}
                  max={100}
                  step={0.5}
                  disabled={!isEditing}
                />
                <p className="text-xs text-muted-foreground">Fee paid to the mechanic</p>
              </div>

              {/* Driver Fee */}
              {useDriverFee && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="driver-fee">Driver Fee</Label>
                    <div className="flex items-center text-muted-foreground">
                      <Input
                        id="driver-percentage"
                        type="number"
                        value={rates.driver}
                        onChange={(e) => handleRateChange('driver', parseFloat(e.target.value))}
                        className="w-16 h-8 text-right mr-1"
                        disabled={!isEditing}
                        min={0}
                        max={100}
                        step={0.5}
                      />
                      <Percent className="h-4 w-4" />
                    </div>
                  </div>
                  <Slider
                    value={[rates.driver || 0]}
                    onValueChange={(value) => handleRateChange('driver', value[0])}
                    min={0}
                    max={100}
                    step={0.5}
                    disabled={!isEditing}
                  />
                  <p className="text-xs text-muted-foreground">Fee paid to the driver (if applicable)</p>
                </div>
              )}

              {/* Tax */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="tax">Tax</Label>
                  <div className="flex items-center text-muted-foreground">
                    <Input
                      id="tax-percentage"
                      type="number"
                      value={rates.tax}
                      onChange={(e) => handleRateChange('tax', parseFloat(e.target.value))}
                      className="w-16 h-8 text-right mr-1"
                      disabled={!isEditing}
                      min={0}
                      max={100}
                      step={0.5}
                    />
                    <Percent className="h-4 w-4" />
                  </div>
                </div>
                <Slider
                  value={[rates.tax]}
                  onValueChange={(value) => handleRateChange('tax', value[0])}
                  min={0}
                  max={100}
                  step={0.5}
                  disabled={!isEditing}
                />
                <p className="text-xs text-muted-foreground">Sales tax (varies by location)</p>
              </div>
            </CardContent>
            
            {canEdit && (
              <CardFooter className="justify-between border-t p-4">
                {isEditing ? (
                  <>
                    <Button variant="ghost" onClick={resetToDefaults}>
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                    <div className="space-x-2">
                      <Button variant="outline" onClick={() => {
                        setIsEditing(false);
                        setRates(initialRates);
                        setError(null);
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={totalPercentage !== 100}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button className="ml-auto" onClick={() => setIsEditing(true)}>
                    Edit Percentages
                  </Button>
                )}
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Fee Preview</span>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={previewAmount}
                    onChange={(e) => setPreviewAmount(parseFloat(e.target.value) || 0)}
                    className="w-24 h-8"
                    min={0}
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Platform Fee ({rates.platform}%)</Label>
                  <div className="text-xl font-bold">{formatCurrency(calculateAmount(rates.platform))}</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Shop Fee ({rates.shop}%)</Label>
                  <div className="text-xl font-bold">{formatCurrency(calculateAmount(rates.shop))}</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Mechanic Fee ({rates.mechanic}%)</Label>
                  <div className="text-xl font-bold">{formatCurrency(calculateAmount(rates.mechanic))}</div>
                </div>
                
                {useDriverFee && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Driver Fee ({rates.driver}%)</Label>
                    <div className="text-xl font-bold">{formatCurrency(calculateAmount(rates.driver || 0))}</div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Tax ({rates.tax}%)</Label>
                  <div className="text-xl font-bold">{formatCurrency(calculateAmount(rates.tax))}</div>
                </div>
              </div>
              
              <div className="pt-4 border-t mt-4">
                <div className="flex justify-between items-center">
                  <Label className="text-lg">Total Amount</Label>
                  <div className="text-2xl font-bold">
                    {formatCurrency(previewAmount)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fee Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center">
                  <div className="bg-muted rounded-full p-3">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <ArrowRight className="mx-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 border rounded-lg p-3">
                    <div className="font-medium">Customer Payment</div>
                    <div className="text-sm text-muted-foreground">100% - {formatCurrency(previewAmount)}</div>
                  </div>
                </div>

                <ArrowRight className="mx-auto h-4 w-4 text-muted-foreground rotate-90" />

                <div className="flex items-center">
                  <div className="bg-muted rounded-full p-3">
                    <Percent className="h-6 w-6" />
                  </div>
                  <ArrowRight className="mx-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 border rounded-lg p-3">
                    <div className="font-medium">Platform Fee</div>
                    <div className="text-sm text-muted-foreground">{rates.platform}% - {formatCurrency(calculateAmount(rates.platform))}</div>
                  </div>
                </div>

                <ArrowRight className="mx-auto h-4 w-4 text-muted-foreground rotate-90" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-3">
                    <div className="font-medium">Shop</div>
                    <div className="text-sm text-muted-foreground">{rates.shop}% - {formatCurrency(calculateAmount(rates.shop))}</div>
                  </div>

                  <div className="border rounded-lg p-3">
                    <div className="font-medium">Mechanic</div>
                    <div className="text-sm text-muted-foreground">{rates.mechanic}% - {formatCurrency(calculateAmount(rates.mechanic))}</div>
                  </div>

                  {useDriverFee && (
                    <div className="border rounded-lg p-3">
                      <div className="font-medium">Driver</div>
                      <div className="text-sm text-muted-foreground">{rates.driver}% - {formatCurrency(calculateAmount(rates.driver || 0))}</div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 