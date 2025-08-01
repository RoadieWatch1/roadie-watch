import { supabase } from '@/app/lib/supabase';
import { revenueCatService } from './RevenueCatService';

export interface UserSubscription {
  id: string;
  user_id: string;
  product_id: string | null;
  is_active: boolean;
  expiration_date: string | null;
  will_renew: boolean;
  created_at: string;
  updated_at: string;
}

class SubscriptionService {
  async checkUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return null;
    }
  }

  async syncWithRevenueCat(userId: string): Promise<UserSubscription | null> {
    try {
      await revenueCatService.initialize(userId);
      const customerInfo = await revenueCatService.getCustomerInfo();
      const subscriptionInfo = revenueCatService.getSubscriptionInfo(customerInfo);

      const { data, error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          product_id: subscriptionInfo.productId,
          is_active: subscriptionInfo.isActive,
          expiration_date: subscriptionInfo.expirationDate,
          will_renew: subscriptionInfo.willRenew,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error syncing with RevenueCat:', error);
      return null;
    }
  }

  async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const subscription = await this.checkUserSubscription(userId);
      
      if (!subscription) {
        // Try to sync with RevenueCat if no local record
        const syncedSubscription = await this.syncWithRevenueCat(userId);
        return syncedSubscription?.is_active || false;
      }

      // Check if subscription is still valid
      if (subscription.is_active && subscription.expiration_date) {
        const expirationDate = new Date(subscription.expiration_date);
        const now = new Date();
        
        if (expirationDate < now) {
          // Subscription expired, sync with RevenueCat to get latest status
          const syncedSubscription = await this.syncWithRevenueCat(userId);
          return syncedSubscription?.is_active || false;
        }
      }

      return subscription.is_active;
    } catch (error) {
      console.error('Error checking active subscription:', error);
      return false;
    }
  }

  async getSubscriptionFeatures(userId: string): Promise<string[]> {
    const hasSubscription = await this.hasActiveSubscription(userId);
    
    if (hasSubscription) {
      return [
        'voice_activation',
        'live_tracking',
        'custom_wake_words',
        'emergency_notifications',
        'medical_info_storage',
        'unlimited_contacts',
        'priority_support'
      ];
    }

    return [
      'basic_emergency_calls',
      'limited_contacts'
    ];
  }

  async canUseFeature(userId: string, feature: string): Promise<boolean> {
    const features = await this.getSubscriptionFeatures(userId);
    return features.includes(feature);
  }
}

export const subscriptionService = new SubscriptionService();