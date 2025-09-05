import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  where, 
  limit 
} from 'firebase/firestore';

class FirebaseService {
  constructor() {
    this.disasterAlertsCollection = collection(db, 'disasterAlerts');
    this.mapZonesCollection = collection(db, 'mapZones');
  }

  // Get all disaster alerts
  async getDisasterAlerts() {
    try {
      const q = query(this.disasterAlertsCollection, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching disaster alerts:', error);
      return [];
    }
  }

  // Get recent disaster alerts (last 7 days)
  async getRecentDisasterAlerts() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const q = query(
        this.disasterAlertsCollection,
        where('createdAt', '>=', sevenDaysAgo),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching recent disaster alerts:', error);
      return [];
    }
  }

  // Get disaster alerts by severity
  async getDisasterAlertsBySeverity(severity) {
    try {
      const q = query(
        this.disasterAlertsCollection,
        where('severity', '==', severity),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching disaster alerts by severity:', error);
      return [];
    }
  }

  // Get disaster alerts by location
  async getDisasterAlertsByLocation(district, city = null) {
    try {
      let q;
      if (city) {
        q = query(
          this.disasterAlertsCollection,
          where('district', '==', district),
          where('city', '==', city),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
      } else {
        q = query(
          this.disasterAlertsCollection,
          where('district', '==', district),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching disaster alerts by location:', error);
      return [];
    }
  }

  // Get all map zones
  async getMapZones() {
    try {
      const snapshot = await getDocs(this.mapZonesCollection);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching map zones:', error);
      return [];
    }
  }

  // Get safe zones
  async getSafeZones() {
    try {
      const q = query(
        this.mapZonesCollection,
        where('category', '==', 'safe')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching safe zones:', error);
      return [];
    }
  }

  // Get danger zones
  async getDangerZones() {
    try {
      const q = query(
        this.mapZonesCollection,
        where('category', '==', 'danger')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching danger zones:', error);
      return [];
    }
  }

  // Get zones by location
  async getZonesByLocation(district, city = null) {
    try {
      let q;
      if (city) {
        q = query(
          this.mapZonesCollection,
          where('district', '==', district),
          where('city', '==', city)
        );
      } else {
        q = query(
          this.mapZonesCollection,
          where('district', '==', district)
        );
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching zones by location:', error);
      return [];
    }
  }

  // Get zones by danger type
  async getZonesByDangerType(dangerType) {
    try {
      const q = query(
        this.mapZonesCollection,
        where('category', '==', 'danger'),
        where('subCategory', '==', dangerType)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching zones by danger type:', error);
      return [];
    }
  }

  // Format disaster alert for AI context
  formatDisasterAlertForAI(alert) {
    const severityEmoji = {
      low: '🟢',
      medium: '🟡',
      high: '🔴'
    };

    return `${severityEmoji[alert.severity]} ${alert.disasterName} in ${alert.city}, ${alert.district}
    - Severity: ${alert.severity.toUpperCase()}
    - Description: ${alert.description}
    - Date: ${alert.date} at ${alert.time}
    ${alert.nearestSafeZone ? `- Nearest Safe Zone: ${alert.nearestSafeZone.name}` : ''}`;
  }

  // Format map zone for AI context
  formatMapZoneForAI(zone) {
    const categoryEmoji = zone.category === 'safe' ? '🟢' : '🔴';
    
    return `${categoryEmoji} ${zone.name} (${zone.category.toUpperCase()} ZONE)
    - Location: ${zone.city}, ${zone.district}
    - Coordinates: ${zone.latitude}, ${zone.longitude}
    ${zone.category === 'danger' ? `- Danger Type: ${zone.subCategory}` : ''}
    ${zone.category === 'safe' ? `- Description: ${zone.safeDescription || 'Safe evacuation point'}` : ''}`;
  }

  // Search function for AI queries
  async searchRelevantData(query) {
    const lowerQuery = query.toLowerCase();
    const results = {
      alerts: [],
      zones: [],
      summary: ''
    };

    try {
      // Check if query is about alerts
      if (lowerQuery.includes('alert') || lowerQuery.includes('disaster') || 
          lowerQuery.includes('emergency') || lowerQuery.includes('recent')) {
        results.alerts = await this.getRecentDisasterAlerts();
      }

      // Check if query is about specific severity
      if (lowerQuery.includes('high') || lowerQuery.includes('critical')) {
        const highAlerts = await this.getDisasterAlertsBySeverity('high');
        results.alerts = [...results.alerts, ...highAlerts];
      }

      // Check if query is about safe zones
      if (lowerQuery.includes('safe') || lowerQuery.includes('evacuation') || 
          lowerQuery.includes('shelter')) {
        results.zones = await this.getSafeZones();
      }

      // Check if query is about danger zones
      if (lowerQuery.includes('danger') || lowerQuery.includes('risk') || 
          lowerQuery.includes('avoid')) {
        const dangerZones = await this.getDangerZones();
        results.zones = [...results.zones, ...dangerZones];
      }

      // Check for specific locations (Sri Lankan cities/districts)
      const sriLankanLocations = [
        'colombo', 'kandy', 'galle', 'jaffna', 'negombo', 'trincomalee',
        'batticaloa', 'anuradhapura', 'polonnaruwa', 'ratnapura', 'matara',
        'nuwara eliya', 'badulla', 'kurunegala', 'puttalam', 'gampaha',
        'kalutara', 'hambantota', 'monaragala', 'vavuniya', 'mannar',
        'mullaitivu', 'kilinochchi', 'ampara', 'kegalle'
      ];

      for (const location of sriLankanLocations) {
        if (lowerQuery.includes(location)) {
          const locationAlerts = await this.getDisasterAlertsByLocation(
            location.charAt(0).toUpperCase() + location.slice(1)
          );
          const locationZones = await this.getZonesByLocation(
            location.charAt(0).toUpperCase() + location.slice(1)
          );
          results.alerts = [...results.alerts, ...locationAlerts];
          results.zones = [...results.zones, ...locationZones];
          break;
        }
      }

      // Remove duplicates
      results.alerts = results.alerts.filter((alert, index, self) => 
        index === self.findIndex(a => a.id === alert.id)
      );
      results.zones = results.zones.filter((zone, index, self) => 
        index === self.findIndex(z => z.id === zone.id)
      );

      return results;
    } catch (error) {
      console.error('Error searching relevant data:', error);
      return results;
    }
  }
}

export default new FirebaseService();