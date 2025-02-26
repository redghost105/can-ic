"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Award, Gift, Star, Crown, ChevronRight, Clock, Zap } from 'lucide-react';

interface LoyaltyProgram {
  totalPoints: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  tierProgress: number;
  nextTier: 'Silver' | 'Gold' | 'Platinum' | null;
  pointsToNextTier: number;
  availableRewards: Reward[];
  pointsHistory: PointsTransaction[];
  redeemedRewards: RedeemedReward[];
}

interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: 'discount' | 'service' | 'merchandise' | 'other';
  expiresAt?: string;
}

interface PointsTransaction {
  id: string;
  date: string;
  description: string;
  points: number;
  serviceRequestId?: string;
}

interface RedeemedReward {
  id: string;
  rewardId: string;
  rewardName: string;
  pointsCost: number;
  redeemedAt: string;
  expiresAt?: string;
  status: 'active' | 'used' | 'expired';
}

export default function LoyaltyProgramPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loyalty, setLoyalty] = useState<LoyaltyProgram | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // In a real app, fetch loyalty program data from API
    fetchLoyaltyProgram();
  }, [user, router]);

  const fetchLoyaltyProgram = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        const mockData = generateMockLoyaltyData();
        setLoyalty(mockData);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching loyalty program data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load loyalty program data. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const generateMockLoyaltyData = (): LoyaltyProgram => {
    const totalPoints = Math.floor(Math.random() * 5000) + 500;
    let tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' = 'Bronze';
    let nextTier: 'Silver' | 'Gold' | 'Platinum' | null = 'Silver';
    let tierProgress = 0;
    let pointsToNextTier = 0;

    // Determine tier based on points
    if (totalPoints >= 5000) {
      tier = 'Platinum';
      nextTier = null;
      tierProgress = 100;
      pointsToNextTier = 0;
    } else if (totalPoints >= 2500) {
      tier = 'Gold';
      nextTier = 'Platinum';
      tierProgress = ((totalPoints - 2500) / 2500) * 100;
      pointsToNextTier = 5000 - totalPoints;
    } else if (totalPoints >= 1000) {
      tier = 'Silver';
      nextTier = 'Gold';
      tierProgress = ((totalPoints - 1000) / 1500) * 100;
      pointsToNextTier = 2500 - totalPoints;
    } else {
      tier = 'Bronze';
      nextTier = 'Silver';
      tierProgress = (totalPoints / 1000) * 100;
      pointsToNextTier = 1000 - totalPoints;
    }

    // Generate rewards
    const availableRewards: Reward[] = [
      {
        id: '1',
        name: '10% Off Next Service',
        description: 'Get 10% off your next service request',
        pointsCost: 250,
        category: 'discount',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        name: 'Free Oil Change',
        description: 'Redeem for a free standard oil change service',
        pointsCost: 500,
        category: 'service',
      },
      {
        id: '3',
        name: 'Priority Scheduling',
        description: 'Get priority scheduling for your next service',
        pointsCost: 300,
        category: 'service',
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        name: 'Free Car Wash',
        description: 'Redeem for a free car wash with any service',
        pointsCost: 150,
        category: 'service',
      },
      {
        id: '5',
        name: 'MechanicOnDemand T-Shirt',
        description: 'Get a branded t-shirt',
        pointsCost: 400,
        category: 'merchandise',
      },
    ];

    // Generate points history
    const pointsHistory: PointsTransaction[] = [];
    for (let i = 1; i <= 10; i++) {
      const isEarned = Math.random() > 0.2;
      pointsHistory.push({
        id: i.toString(),
        date: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
        description: isEarned
          ? `Points earned for service #SR-${Math.floor(Math.random() * 10000)}`
          : `Redeemed for ${availableRewards[Math.floor(Math.random() * availableRewards.length)].name}`,
        points: isEarned
          ? Math.floor(Math.random() * 100) + 50
          : -Math.floor(Math.random() * 300) - 100,
        serviceRequestId: isEarned ? `SR-${Math.floor(Math.random() * 10000)}` : undefined,
      });
    }

    // Generate redeemed rewards
    const redeemedRewards: RedeemedReward[] = [];
    const statuses: ('active' | 'used' | 'expired')[] = ['active', 'used', 'expired'];
    for (let i = 1; i <= 3; i++) {
      const randomReward = availableRewards[Math.floor(Math.random() * availableRewards.length)];
      redeemedRewards.push({
        id: i.toString(),
        rewardId: randomReward.id,
        rewardName: randomReward.name,
        pointsCost: randomReward.pointsCost,
        redeemedAt: new Date(Date.now() - i * 15 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + (Math.random() > 0.5 ? 15 : -15) * 24 * 60 * 60 * 1000).toISOString(),
        status: statuses[Math.floor(Math.random() * statuses.length)]
      });
    }

    return {
      totalPoints,
      tier,
      tierProgress,
      nextTier,
      pointsToNextTier,
      availableRewards,
      pointsHistory,
      redeemedRewards,
    };
  };

  const handleRedeemPoints = (reward: Reward) => {
    setSelectedReward(reward);
  };

  const confirmRedemption = () => {
    if (!selectedReward || !loyalty) return;

    if (loyalty.totalPoints < selectedReward.pointsCost) {
      toast({
        title: 'Insufficient Points',
        description: `You need ${selectedReward.pointsCost - loyalty.totalPoints} more points to redeem this reward.`,
        variant: 'destructive',
      });
      return;
    }

    // In a real app, make API call to redeem points
    toast({
      title: 'Success!',
      description: `You've redeemed ${selectedReward.name} for ${selectedReward.pointsCost} points.`,
      variant: 'default',
    });

    // Update local state to reflect changes
    setLoyalty({
      ...loyalty,
      totalPoints: loyalty.totalPoints - selectedReward.pointsCost,
      redeemedRewards: [
        {
          id: (loyalty.redeemedRewards.length + 1).toString(),
          rewardId: selectedReward.id,
          rewardName: selectedReward.name,
          pointsCost: selectedReward.pointsCost,
          redeemedAt: new Date().toISOString(),
          expiresAt: selectedReward.expiresAt,
          status: 'active',
        },
        ...loyalty.redeemedRewards,
      ],
      pointsHistory: [
        {
          id: (loyalty.pointsHistory.length + 1).toString(),
          date: new Date().toISOString(),
          description: `Redeemed for ${selectedReward.name}`,
          points: -selectedReward.pointsCost,
        },
        ...loyalty.pointsHistory,
      ],
    });

    setSelectedReward(null);
  };

  const cancelRedemption = () => {
    setSelectedReward(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'used':
        return <Badge className="bg-gray-500">Used</Badge>;
      case 'expired':
        return <Badge className="bg-red-500">Expired</Badge>;
      default:
        return null;
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Bronze':
        return <Award className="h-6 w-6 text-amber-700" />;
      case 'Silver':
        return <Award className="h-6 w-6 text-gray-400" />;
      case 'Gold':
        return <Award className="h-6 w-6 text-amber-400" />;
      case 'Platinum':
        return <Crown className="h-6 w-6 text-purple-500" />;
      default:
        return <Award className="h-6 w-6" />;
    }
  };

  if (isLoading || !loyalty) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Loyalty Program</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300">
        Earn points with every service and redeem for rewards.
      </p>

      {selectedReward ? (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle>Confirm Redemption</CardTitle>
            <CardDescription>
              You are about to redeem the following reward:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
              <h3 className="font-bold text-lg">{selectedReward.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{selectedReward.description}</p>
              <div className="mt-2 flex items-center">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="font-medium">{selectedReward.pointsCost} Points</span>
              </div>
              {selectedReward.expiresAt && (
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Expires: {formatDate(selectedReward.expiresAt)}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-md">
              <div>
                <p className="font-medium">Your Current Balance</p>
                <p className="text-lg font-bold">{loyalty.totalPoints} Points</p>
              </div>
              <div>
                <p className="font-medium">After Redemption</p>
                <p className="text-lg font-bold">{loyalty.totalPoints - selectedReward.pointsCost} Points</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={cancelRedemption}>Cancel</Button>
            <Button onClick={confirmRedemption}>Confirm Redemption</Button>
          </CardFooter>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="md:col-span-2 lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Your Loyalty Status</CardTitle>
                  <div className="flex items-center">
                    {getTierIcon(loyalty.tier)}
                    <span className="ml-2 font-bold">{loyalty.tier} Tier</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{loyalty.totalPoints}</span>
                  <span className="text-lg text-gray-600 dark:text-gray-300">Available Points</span>
                </div>
                
                {loyalty.nextTier && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                      <span>Progress to {loyalty.nextTier}</span>
                      <span>{loyalty.pointsToNextTier} points needed</span>
                    </div>
                    <Progress value={loyalty.tierProgress} className="h-2" />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                    <div className="font-medium text-blue-700 dark:text-blue-300">Lifetime Points</div>
                    <div className="text-2xl font-bold mt-1">
                      {loyalty.totalPoints + Math.floor(Math.random() * 2000) + 500}
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
                    <div className="font-medium text-green-700 dark:text-green-300">Rewards Redeemed</div>
                    <div className="text-2xl font-bold mt-1">{loyalty.redeemedRewards.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Membership Benefits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Zap className="h-4 w-4 text-blue-500 mr-2 mt-1" />
                    <div>
                      <h4 className="font-medium">Earn Points with Every Service</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Earn 1 point for every $1 spent</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Zap className="h-4 w-4 text-blue-500 mr-2 mt-1" />
                    <div>
                      <h4 className="font-medium">Exclusive Discounts</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Access tier-specific discounts and offers</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Zap className="h-4 w-4 text-blue-500 mr-2 mt-1" />
                    <div>
                      <h4 className="font-medium">Birthday Bonus</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Double points during your birthday month</p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Your Tier Perks</h4>
                  <ul className="space-y-2 text-sm">
                    {loyalty.tier === 'Bronze' || loyalty.tier === 'Silver' || loyalty.tier === 'Gold' || loyalty.tier === 'Platinum' ? (
                      <li className="flex items-center text-gray-700 dark:text-gray-300">
                        <Star className="h-3 w-3 text-amber-700 mr-2" />
                        <span>Basic points earning rate</span>
                      </li>
                    ) : null}
                    
                    {loyalty.tier === 'Silver' || loyalty.tier === 'Gold' || loyalty.tier === 'Platinum' ? (
                      <li className="flex items-center text-gray-700 dark:text-gray-300">
                        <Star className="h-3 w-3 text-gray-400 mr-2" />
                        <span>10% bonus points on services</span>
                      </li>
                    ) : null}
                    
                    {loyalty.tier === 'Gold' || loyalty.tier === 'Platinum' ? (
                      <li className="flex items-center text-gray-700 dark:text-gray-300">
                        <Star className="h-3 w-3 text-amber-400 mr-2" />
                        <span>Priority scheduling</span>
                      </li>
                    ) : null}
                    
                    {loyalty.tier === 'Platinum' ? (
                      <li className="flex items-center text-gray-700 dark:text-gray-300">
                        <Star className="h-3 w-3 text-purple-500 mr-2" />
                        <span>Dedicated customer service line</span>
                      </li>
                    ) : null}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="rewards">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="rewards">Available Rewards</TabsTrigger>
              <TabsTrigger value="redeemed">Redeemed Rewards</TabsTrigger>
              <TabsTrigger value="history">Points History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="rewards" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loyalty.availableRewards.map((reward) => (
                  <Card key={reward.id} className="hover:border-blue-300 transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{reward.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm text-gray-600 dark:text-gray-300">{reward.description}</p>
                      <div className="mt-2 flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="font-medium">{reward.pointsCost} Points</span>
                      </div>
                      {reward.expiresAt && (
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>Expires: {formatDate(reward.expiresAt)}</span>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant={loyalty.totalPoints >= reward.pointsCost ? "default" : "outline"}
                        className="w-full"
                        disabled={loyalty.totalPoints < reward.pointsCost}
                        onClick={() => handleRedeemPoints(reward)}
                      >
                        {loyalty.totalPoints >= reward.pointsCost ? 'Redeem' : `Need ${reward.pointsCost - loyalty.totalPoints} more points`}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="redeemed" className="space-y-4 mt-6">
              {loyalty.redeemedRewards.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">You haven't redeemed any rewards yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {loyalty.redeemedRewards.map((reward) => (
                    <Card key={reward.id}>
                      <CardContent className="flex justify-between items-center p-4">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <h3 className="font-medium">{reward.rewardName}</h3>
                            <div className="ml-3">{getStatusBadge(reward.status)}</div>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Redeemed on {formatDate(reward.redeemedAt)} for {reward.pointsCost} points
                          </p>
                          {reward.expiresAt && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(reward.expiresAt) > new Date() 
                                ? `Expires on ${formatDate(reward.expiresAt)}`
                                : `Expired on ${formatDate(reward.expiresAt)}`
                              }
                            </p>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          disabled={reward.status !== 'active'}
                          className="text-blue-600 dark:text-blue-400"
                        >
                          {reward.status === 'active' ? 'View' : ''}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="history" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Points Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loyalty.pointsHistory.map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center border-b pb-3 last:border-0">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            {transaction.points > 0 ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 mr-2">
                                Earned
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 mr-2">
                                Redeemed
                              </Badge>
                            )}
                            <p className="font-medium">{transaction.description}</p>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(transaction.date)}</p>
                        </div>
                        <div className={`font-bold ${transaction.points > 0 ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                          {transaction.points > 0 ? '+' : ''}{transaction.points}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
} 