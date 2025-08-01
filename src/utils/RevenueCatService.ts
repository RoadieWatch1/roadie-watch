import Purchases, { PurchasesOffering, PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { supabase } from '@/app/lib/supabase';

export interface SubscriptionInfo {
  isActive: boolean;
  productId: string | null;
  expirationDate: string | null;
  willRenew: boolean;
}

class RevenueCatService {
  private initialized = false;

  async initialize(userId: string): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize RevenueCat with API key
      await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      await Purchases.configure({
        apiKey: 'your_revenuecat_api_key', // Replace with actual key
        appUserID: userId,
      });

      this.initialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  async getOfferings(): Promise<PurchasesOffering[]> {
    try {
      const offerings = await Purchases.getOfferings();
      return Object.values(offerings.all);
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return [];
    }
  }

  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<CustomerInfo> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      
      // Log purchase to Supabase
      await this.logPurchase(customerInfo);
      
      return customerInfo;
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('Failed to get customer info:', error);
      throw error;
    }
  }

  getSubscriptionInfo(customerInfo: CustomerInfo): SubscriptionInfo {
    const activeEntitlements = customerInfo.entitlements.active;
    const premiumEntitlement = activeEntitlements['premium'];

    if (premiumEntitlement) {
      return {
        isActive: true,
        productId: premiumEntitlement.productIdentifier,
        expirationDate: premiumEntitlement.expirationDate,
        willRenew: premiumEntitlement.willRenew,
      };
    }

    return {
      isActive: false,
      productId: null,
      expirationDate: null,
      willRenew: false,
    };
  }

  private async logPurchase(customerInfo: CustomerInfo): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const subscriptionInfo = this.getSubscriptionInfo(customerInfo);
      
      await supabase.from('user_subscriptions').upsert({
        user_id: userData.user.id,
        product_id: subscriptionInfo.productId,
        is_active: subscriptionInfo.isActive,
        expiration_date: subscriptionInfo.expirationDate,
        will_renew: subscriptionInfo.willRenew,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log purchase:', error);
    }
  }
}

export const revenueCatService = new RevenueCatService();