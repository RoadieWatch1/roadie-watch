import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TrialStatus {
  isActive: boolean;
  daysRemaining: number;
  startDate: string;
  endDate: string;
}

class TrialService {
  private static readonly TRIAL_KEY = 'emergency_app_trial';
  private static readonly TRIAL_DURATION_DAYS = 15;

  async initializeTrial(): Promise<TrialStatus> {
    try {
      const existingTrial = await AsyncStorage.getItem(TrialService.TRIAL_KEY);
      
      if (existingTrial) {
        return JSON.parse(existingTrial);
      }

      // Start new trial
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + TrialService.TRIAL_DURATION_DAYS);

      const trialStatus: TrialStatus = {
        isActive: true,
        daysRemaining: TrialService.TRIAL_DURATION_DAYS,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };

      await AsyncStorage.setItem(TrialService.TRIAL_KEY, JSON.stringify(trialStatus));
      return trialStatus;
    } catch (error) {
      console.error('Trial initialization error:', error);
      return {
        isActive: false,
        daysRemaining: 0,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString()
      };
    }
  }

  async getTrialStatus(): Promise<TrialStatus> {
    try {
      const trialData = await AsyncStorage.getItem(TrialService.TRIAL_KEY);
      if (!trialData) {
        return await this.initializeTrial();
      }

      const trial: TrialStatus = JSON.parse(trialData);
      const now = new Date();
      const endDate = new Date(trial.endDate);
      
      if (now > endDate) {
        trial.isActive = false;
        trial.daysRemaining = 0;
      } else {
        const diffTime = endDate.getTime() - now.getTime();
        trial.daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      await AsyncStorage.setItem(TrialService.TRIAL_KEY, JSON.stringify(trial));
      return trial;
    } catch (error) {
      console.error('Get trial status error:', error);
      return await this.initializeTrial();
    }
  }

  async extendTrial(days: number): Promise<boolean> {
    try {
      const trial = await this.getTrialStatus();
      const endDate = new Date(trial.endDate);
      endDate.setDate(endDate.getDate() + days);
      
      trial.endDate = endDate.toISOString();
      trial.isActive = true;
      
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      trial.daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      await AsyncStorage.setItem(TrialService.TRIAL_KEY, JSON.stringify(trial));
      return true;
    } catch (error) {
      console.error('Extend trial error:', error);
      return false;
    }
  }
}

export default new TrialService();