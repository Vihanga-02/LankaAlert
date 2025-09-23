// firebaseService.js
import {
  db
} from './firebase';
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
    this.inventoryCollection = collection(db, 'inventoryItems');

    // Mapped Sri Lankan locations in both English and Sinhala for easy lookup
    this.sriLankanLocations = {
      'colombo': 'කොළඹ',
      'kandy': 'මහනුවර',
      'galle': 'ගාල්ල',
      'jaffna': 'යාපනය',
      'negombo': 'මීගමුව',
      'trincomalee': 'ත්‍රිකුණාමලය',
      'batticaloa': 'මඩකලපුව',
      'anuradhapura': 'අනුරාධපුරය',
      'polonnaruwa': 'පොලොන්නරුව',
      'ratnapura': 'රත්නපුරය',
      'matara': 'මාතර',
      'nuwara eliya': 'නුවරඑළිය',
      'badulla': 'බදුල්ල',
      'kurunegala': 'කුරුණෑගල',
      'puttalam': 'පුත්තලම',
      'gampaha': 'ගම්පහ',
      'kalutara': 'කළුතර',
      'hambantota': 'හම්බන්තොට',
      'monaragala': 'මොනරාගල',
      'vavuniya': 'වවුනියාව',
      'mannar': 'මන්නාරම',
      'mullaitivu': 'මුලතිව්',
      'kilinochchi': 'කිලිනොච්චිය',
      'ampara': 'අම්පාර',
      'kegalle': 'කෑගල්ල',
    };
  }

  // Helper function to detect if the query is in Sinhala
  isSinhalaQuery(query) {
    // Check for a range of Sinhala Unicode characters
    const sinhalaRegex = /[\u0D80-\u0DFF]/;
    return sinhalaRegex.test(query);
  }

  // Helper functions to check query intent in both languages
  _isRecentQuery(query, isSinhala) {
    const keywords = isSinhala ? ['අලුත්ම', 'නව', 'නවතම'] : ['recent', 'latest', 'current', 'new'];
    return keywords.some(k => query.includes(k));
  }

  _isSeverityQuery(query, isSinhala) {
    const keywords = isSinhala ? ['අධික', 'දැඩි', 'බරපතල'] : ['high', 'critical', 'severe'];
    return keywords.some(k => query.includes(k));
  }

  _isLocationQuery(query) {
    const locations = Object.keys(this.sriLankanLocations).concat(Object.values(this.sriLankanLocations));
    return locations.some(location => query.includes(location.toLowerCase()));
  }

  _isInventoryQuery(query, isSinhala) {
    const keywords = isSinhala ? ['තොග', 'සම්පත්', 'උපකරණ', 'බඩු'] : ['stock', 'inventory', 'supplies', 'equipment'];
    return keywords.some(k => query.includes(k));
  }

  _isLowStockQuery(query, isSinhala) {
    const keywords = isSinhala ? ['අඩු', 'හිඟයක්'] : ['low', 'shortage'];
    return keywords.some(k => query.includes(k));
  }

  _isSafeZoneQuery(query, isSinhala) {
    const keywords = isSinhala ? ['ආරක්ෂිත', 'ඉවත් කිරීම', 'ආරක්ෂිත කලාප'] : ['safe', 'evacuation', 'shelter'];
    return keywords.some(k => query.includes(k));
  }

  _isDangerZoneQuery(query, isSinhala) {
    const keywords = isSinhala ? ['අවදානම්', 'අවදානම', 'අවදානම් කලාප'] : ['danger', 'risk', 'avoid', 'danger'];
    return keywords.some(k => query.includes(k));
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

  // Get active alerts (within valid time)
  async getActiveDisasterAlerts() {
    try {
      const now = new Date();
      const q = query(
        this.disasterAlertsCollection,
        where('active', '==', true),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return alerts.filter(alert => {
        if (alert.validUntil && typeof alert.validUntil.toDate === 'function') {
          return alert.validUntil.toDate() > now;
        }
        return true;
      });
    } catch (error) {
      console.error('Error fetching active disaster alerts:', error);
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

  // Get all inventory items
  async getInventoryItems() {
    try {
      const snapshot = await getDocs(this.inventoryCollection);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      return [];
    }
  }

  // Get low stock inventory items
  async getLowStockItems() {
    try {
      const q = query(
        this.inventoryCollection,
        where('stockLevel', '==', 'low')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      return [];
    }
  }
  
  // Search inventory items by name
  async searchInventoryItems(name) {
    try {
      const q = query(
        this.inventoryCollection,
        where('itemName', '==', name),
        limit(5)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(`Error searching for inventory item "${name}":`, error);
      return [];
    }
  }

  // Format disaster alert for AI context
  formatDisasterAlertForAI(alert, isSinhala) {
    const severityEmoji = {
      low: '🟢',
      medium: '🟡',
      high: '🔴'
    };
    
    const severityText = {
      low: isSinhala ? 'අඩු' : 'Low',
      medium: isSinhala ? 'මධ්‍යම' : 'Medium',
      high: isSinhala ? 'අධික' : 'High'
    };
    
    const titles = {
      severity: isSinhala ? 'බරපතලකම' : 'Severity',
      description: isSinhala ? 'විස්තරය' : 'Description',
      start: isSinhala ? 'ආරම්භය' : 'Start',
      validUntil: isSinhala ? 'වලංගු කාලය' : 'Valid until',
      nearestSafeZone: isSinhala ? 'ළඟම ආරක්ෂිත කලාපය' : 'Nearest Safe Zone'
    };

    let validUntilText = '';
    if (alert.validUntil && typeof alert.validUntil.toDate === 'function') {
      const validDate = alert.validUntil.toDate();
      const locale = isSinhala ? 'si-LK' : 'en-US';
      validUntilText = `${titles.validUntil}: ${validDate.toLocaleDateString(locale)} ${validDate.toLocaleTimeString(locale)}`;
    } else if (alert.validUntilDate && alert.validUntilTime) {
      validUntilText = `${titles.validUntil}: ${alert.validUntilDate} ${alert.validUntilTime}`;
    }

    return `${severityEmoji[alert.severity]} ${alert.disasterName} in ${alert.city || 'N/A'}, ${alert.district || 'N/A'}
    - ${titles.severity}: ${severityText[alert.severity].toUpperCase()}
    - ${titles.description}: ${alert.description}
    - ${titles.start}: ${alert.startDate || 'N/A'} at ${alert.startTime || 'N/A'}
    ${validUntilText ? `- ${validUntilText}` : ''}
    ${alert.nearestSafeZone ? `- ${titles.nearestSafeZone}: ${alert.nearestSafeZone.name}` : ''}`;
  }

  // Format map zone for AI context
  formatMapZoneForAI(zone, isSinhala) {
    const categoryEmoji = zone.category === 'safe' ? '🟢' : '🔴';
    const categoryText = {
      safe: isSinhala ? 'ආරක්ෂිත' : 'Safe',
      danger: isSinhala ? 'අවදානම්' : 'Danger'
    };
    const titles = {
      location: isSinhala ? 'ස්ථානය' : 'Location',
      coordinates: isSinhala ? 'ඛණ්ඩාංක' : 'Coordinates',
      dangerType: isSinhala ? 'අවදානම් වර්ගය' : 'Danger Type',
      description: isSinhala ? 'විස්තරය' : 'Description'
    };

    return `${categoryEmoji} ${zone.name} (${categoryText[zone.category].toUpperCase()} ZONE)
    - ${titles.location}: ${zone.city || 'N/A'}, ${zone.district || 'N/A'}
    - ${titles.coordinates}: ${zone.latitude}, ${zone.longitude}
    ${zone.category === 'danger' ? `- ${titles.dangerType}: ${zone.subCategory || 'N/A'}` : ''}
    ${zone.category === 'safe' ? `- ${titles.description}: ${zone.safeDescription || (isSinhala ? 'ආරක්ෂිත ඉවත් කිරීමේ ස්ථානය' : 'Safe evacuation point')}` : ''}`;
  }

  // Format inventory item for AI context
  formatInventoryItemForAI(item, isSinhala) {
    const stockEmoji = item.stockLevel === 'low' ? '🔴' : '🟢';
    const stockText = {
      low: isSinhala ? 'අඩුයි' : 'Low',
      normal: isSinhala ? 'සාමාන්‍යයි' : 'Normal',
      high: isSinhala ? 'ඉහළයි' : 'High'
    };
    const titles = {
      status: isSinhala ? 'තත්ත්වය' : 'Status',
      lastUpdated: isSinhala ? 'අවසන් වරට යාවත්කාලීන කරන ලදි' : 'Last Updated'
    };

    return `${stockEmoji} ${item.itemName}: ${item.quantity} ${item.unit}
    - ${titles.status}: ${stockText[item.stockLevel].toUpperCase()}
    - ${titles.lastUpdated}: ${item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString(isSinhala ? 'si-LK' : 'en-US') : 'N/A'}`;
  }

  // Search function for AI queries
  async searchRelevantData(query) {
    const lowerQuery = query.toLowerCase();
    const isSinhala = this.isSinhalaQuery(query);
    const results = {
      alerts: [],
      zones: [],
      inventory: [],
      summary: ''
    };

    try {
      // Prioritize specific, actionable queries
      if (this._isSeverityQuery(lowerQuery, isSinhala)) {
        results.alerts = await this.getDisasterAlertsBySeverity('high');
      } else if (this._isLowStockQuery(lowerQuery, isSinhala)) {
        results.inventory = await this.getLowStockItems();
      } else if (this._isSafeZoneQuery(lowerQuery, isSinhala)) {
        results.zones = await this.getSafeZones();
      } else if (this._isDangerZoneQuery(lowerQuery, isSinhala)) {
        results.zones = await this.getDangerZones();
      } else if (this._isRecentQuery(lowerQuery, isSinhala)) {
        results.alerts = await this.getRecentDisasterAlerts();
      } else if (this._isLocationQuery(lowerQuery)) {
        let englishLocation = '';
        for (const [en, si] of Object.entries(this.sriLankanLocations)) {
          if (lowerQuery.includes(en) || lowerQuery.includes(si)) {
            englishLocation = en;
            break;
          }
        }
        if (englishLocation) {
          const capitalizedLocation = englishLocation.charAt(0).toUpperCase() + englishLocation.slice(1);
          results.alerts = await this.getDisasterAlertsByLocation(capitalizedLocation);
          results.zones = await this.getZonesByLocation(capitalizedLocation);
        }
      } else if (this._isInventoryQuery(lowerQuery, isSinhala)) {
        const searchTerms = lowerQuery.split(' ').filter(term =>
          !['stock', 'inventory', 'supplies', 'equipment', 'what', 'is', 'the', 'do', 'we', 'have', 'are', 'තොග', 'සම්පත්', 'උපකරණ', 'බඩු', 'කොහොමද'].includes(term)
        );
        if (searchTerms.length > 0) {
          results.inventory = await this.searchInventoryItems(searchTerms[0]);
        } else {
          results.inventory = await this.getInventoryItems();
        }
      } else {
        // Fallback for general queries
        results.alerts = await this.getActiveDisasterAlerts();
        results.zones = await this.getSafeZones();
      }

      // Remove duplicates from results
      results.alerts = results.alerts.filter((alert, index, self) =>
        index === self.findIndex(a => a.id === alert.id)
      );
      results.zones = results.zones.filter((zone, index, self) =>
        index === self.findIndex(z => z.id === zone.id)
      );
      results.inventory = results.inventory.filter((item, index, self) =>
        index === self.findIndex(i => i.id === item.id)
      );

      return results;
    } catch (error) {
      console.error('Error searching relevant data:', error);
      return results;
    }
  }
}

export default new FirebaseService();