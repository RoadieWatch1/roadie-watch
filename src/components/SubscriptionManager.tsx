import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { revenueCatService, SubscriptionInfo } from '../utils/RevenueCatService';
import { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

interface SubscriptionManagerProps {
  userId: string;
  onSubscriptionChange?: (isActive: boolean) => void;
}

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ 
  userId, 
  onSubscriptionChange 
}) => {
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOffering[]>([]);

  useEffect(() => {
    initializeRevenueCat();
  }, [userId]);

  const initializeRevenueCat = async () => {
    try {
      setLoading(true);
      await revenueCatService.initialize(userId);
      
      const [customerInfo, availableOfferings] = await Promise.all([
        revenueCatService.getCustomerInfo(),
        revenueCatService.getOfferings()
      ]);

      const subInfo = revenueCatService.getSubscriptionInfo(customerInfo);
      setSubscriptionInfo(subInfo);
      setOfferings(availableOfferings);
      
      onSubscriptionChange?.(subInfo.isActive);
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      Alert.alert('Error', 'Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageToPurchase: PurchasesPackage) => {
    try {
      setPurchasing(true);
      const customerInfo = await revenueCatService.purchasePackage(packageToPurchase);
      
      const subInfo = revenueCatService.getSubscriptionInfo(customerInfo);
      setSubscriptionInfo(subInfo);
      onSubscriptionChange?.(subInfo.isActive);
      
      Alert.alert('Success', 'Subscription activated successfully!');
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Purchase Failed', error.message || 'An error occurred');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setLoading(true);
      const customerInfo = await revenueCatService.restorePurchases();
      
      const subInfo = revenueCatService.getSubscriptionInfo(customerInfo);
      setSubscriptionInfo(subInfo);
      onSubscriptionChange?.(subInfo.isActive);
      
      if (subInfo.isActive) {
        Alert.alert('Success', 'Subscription restored successfully!');
      } else {
        Alert.alert('No Purchases', 'No active subscriptions found to restore');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading subscription info...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {subscriptionInfo?.isActive ? (
        <View style={styles.activeSubscription}>
          <Text style={styles.statusText}>✅ Premium Active</Text>
          <Text style={styles.detailText}>
            Expires: {subscriptionInfo.expirationDate ? 
              new Date(subscriptionInfo.expirationDate).toLocaleDateString() : 'Never'}
          </Text>
          <Text style={styles.detailText}>
            Auto-renewal: {subscriptionInfo.willRenew ? 'On' : 'Off'}
          </Text>
        </View>
      ) : (
        <View style={styles.inactiveSubscription}>
          <Text style={styles.statusText}>Premium Subscription</Text>
          
          {offerings.map((offering) => (
            <View key={offering.identifier} style={styles.offeringContainer}>
              {offering.availablePackages.map((pkg) => (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={styles.packageButton}
                  onPress={() => handlePurchase(pkg)}
                  disabled={purchasing}
                >
                  <Text style={styles.packageTitle}>{pkg.product.title}</Text>
                  <Text style={styles.packagePrice}>{pkg.product.priceString}</Text>
                  <Text style={styles.packageDescription}>{pkg.product.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
          
          <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
            <Text style={styles.restoreText}>Restore Purchases</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
  },
  activeSubscription: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  inactiveSubscription: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 20,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  detailText: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 5,
  },
  offeringContainer: {
    marginVertical: 10,
  },
  packageButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    padding: 15,
    marginVertical: 5,
  },
  packageTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  packagePrice: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 5,
  },
  packageDescription: {
    color: '#CCCCCC',
    fontSize: 12,
    textAlign: 'center',
  },
  restoreButton: {
    marginTop: 20,
    padding: 10,
    alignItems: 'center',
  },
  restoreText: {
    color: '#4FC3F7',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});