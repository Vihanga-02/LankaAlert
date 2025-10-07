// firebaseService.js
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
    this.inventoryCollection = collection(db, 'inventoryItems');
    this.emergencyRequestsCollection = collection(db, 'emergencyRequests');

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

  _isEmergencyQuery(query, isSinhala) {
    const keywords = isSinhala ? ['හදිසි', 'උදව්', 'ආධාර'] : ['emergency', 'help', 'assistance', 'request'];
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
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter for active alerts based on valid time
      return alerts.filter(alert => {
        if (alert.validUntil && typeof alert.validUntil.toDate === 'function') {
          return alert.validUntil.toDate() > now;
        }
        if (alert.validUntilDate && alert.validUntilTime) {
          const validUntil = new Date(`${alert.validUntilDate}T${alert.validUntilTime}`);
          return validUntil > now;
        }
        return true; // If no valid time specified, consider active
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
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter for recent alerts
      return alerts.filter(alert => {
        if (alert.createdAt && typeof alert.createdAt.toDate === 'function') {
          return alert.createdAt.toDate() >= sevenDaysAgo;
        }
        return true;
      });
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
      // Fallback: get all alerts and filter client-side
      try {
        const allAlerts = await this.getDisasterAlerts();
        return allAlerts.filter(alert => 
          alert.district && alert.district.toLowerCase() === district.toLowerCase() &&
          (!city || (alert.city && alert.city.toLowerCase() === city.toLowerCase()))
        ).slice(0, 5);
      } catch (fallbackError) {
        console.error('Fallback location search also failed:', fallbackError);
        return [];
      }
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
      console.log('Fetching inventory items from collection:', this.inventoryCollection);
      const snapshot = await getDocs(this.inventoryCollection);
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Inventory item:', doc.id, data);
        return { id: doc.id, ...data };
      });
      console.log('Total inventory items fetched:', items.length);
      return items;
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      // Return mock inventory data for testing
      return this.getMockInventoryData();
    }
  }

  // Get low stock inventory items
  async getLowStockItems() {
    try {
      const allItems = await this.getInventoryItems();
      return allItems.filter(item => {
        // Check multiple possible field names for stock status
        const status = item.status || item.stockLevel || '';
        const currentStock = item.currentStock || item.stock || 0;
        const minThreshold = item.minThreshold || item.minStock || 0;
        
        return status.toLowerCase().includes('low') || 
               (currentStock > 0 && currentStock <= minThreshold);
      });
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      return [];
    }
  }
  
  // Search inventory items by name (case-insensitive)
  async searchInventoryItems(name) {
    try {
      console.log(`Searching for inventory item: "${name}"`);
      
      const allItems = await this.getInventoryItems();
      console.log(`Total items available for search: ${allItems.length}`);
      
      const results = allItems.filter(item => {
        // Try different possible field names
        const itemName = item.name || item.itemName || item.title || item.productName || '';
        const category = item.category || item.type || '';
        const description = item.description || '';
        
        const searchTerm = name.toLowerCase();
        return (
          itemName.toLowerCase().includes(searchTerm) ||
          category.toLowerCase().includes(searchTerm) ||
          description.toLowerCase().includes(searchTerm)
        );
      }).slice(0, 10);
      
      console.log(`Filtered results: ${results.length}`);
      return results;
    } catch (error) {
      console.error(`Error searching for inventory item "${name}":`, error);
      // Return mock data as fallback
      return this.getMockInventoryData().filter(item => 
        item.name.toLowerCase().includes(name.toLowerCase())
      ).slice(0, 5);
    }
  }

  // Get emergency requests
  async getEmergencyRequests() {
    try {
      const q = query(this.emergencyRequestsCollection, orderBy('createdAt', 'desc'), limit(10));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching emergency requests:', error);
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
    
    const now = new Date();
    let isActive = false;
    let validUntilText = '';
    
    if (alert.validUntil && typeof alert.validUntil.toDate === 'function') {
      const validDate = alert.validUntil.toDate();
      isActive = now <= validDate;
      validUntilText = `Valid until: ${validDate.toLocaleDateString()} ${validDate.toLocaleTimeString()}`;
    } else if (alert.validUntilDate && alert.validUntilTime) {
      const validDate = new Date(`${alert.validUntilDate}T${alert.validUntilTime}`);
      isActive = now <= validDate;
      validUntilText = `Valid until: ${alert.validUntilDate} ${alert.validUntilTime}`;
    }

    return `${severityEmoji[alert.severity]} ${alert.disasterName} in ${alert.city || 'N/A'}, ${alert.district || 'N/A'}
    - Severity: ${alert.severity?.toUpperCase()}
    - Status: ${isActive ? 'ACTIVE' : 'EXPIRED'}
    - Description: ${alert.description}
    - Start: ${alert.startDate || 'N/A'} at ${alert.startTime || 'N/A'}
    ${validUntilText ? `- ${validUntilText}` : ''}
    ${alert.nearestSafeZone ? `- Nearest Safe Zone: ${alert.nearestSafeZone.name}` : ''}`;
  }

  // Format map zone for AI context
  formatMapZoneForAI(zone) {
    const categoryEmoji = zone.category === 'safe' ? '🟢' : '🔴';
    
    return `${categoryEmoji} ${zone.name} (${zone.category?.toUpperCase()} ZONE)
    - Location: ${zone.city || 'N/A'}, ${zone.district || 'N/A'}
    - Coordinates: ${zone.latitude}, ${zone.longitude}
    ${zone.category === 'danger' ? `- Danger Type: ${zone.subCategory || 'N/A'}` : ''}
    ${zone.category === 'safe' ? `- Description: ${zone.safeDescription || 'Safe evacuation point'}` : ''}`;
  }

  // Format inventory item for AI context
  formatInventoryItemForAI(item) {
    const stockEmoji = (item.status || '').toLowerCase().includes('low') ? '🔴' : '🟢';
    const currentStock = item.currentStock || item.stock || 0;
    const minThreshold = item.minThreshold || item.minStock || 0;
    const itemName = item.name || item.itemName || 'Unknown Item';
    const category = item.category || 'General';
    
    return `${stockEmoji} ${itemName}: ${currentStock} units
    - Category: ${category}
    - Status: ${item.status || 'Unknown'}
    - Min Threshold: ${minThreshold}
    - Last Updated: ${item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : 'N/A'}`;
  }

  // Format emergency request for AI context
  formatEmergencyRequestForAI(request) {
    return `🆘 Emergency Request: ${request.type || 'General'}
    - Location: ${request.location || 'N/A'}
    - Status: ${request.status || 'Pending'}
    - Priority: ${request.priority || 'Normal'}
    - Description: ${request.description || 'N/A'}
    - Requested: ${request.createdAt ? new Date(request.createdAt.toDate()).toLocaleDateString() : 'N/A'}`;
  }

  // Search function for AI queries
  async searchRelevantData(query) {
    const lowerQuery = query.toLowerCase();
    const isSinhala = this.isSinhalaQuery(query);
    const results = {
      alerts: [],
      zones: [],
      inventory: [],
      emergencyRequests: [],
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
      } else if (this._isEmergencyQuery(lowerQuery, isSinhala)) {
        results.emergencyRequests = await this.getEmergencyRequests();
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
        console.log('Detected inventory query:', lowerQuery);
        
        // Extract potential item names from the query
        const stopWords = ['stock', 'inventory', 'supplies', 'equipment', 'what', 'is', 'the', 'do', 'we', 'have', 'are', 'how', 'much', 'many', 'available', 'status', 'level', 'levels', 'තොග', 'සම්පත්', 'උපකරණ', 'බඩු', 'කොහොමද', 'කීයක්', 'කීය', 'ලබාගත', 'හැකි', 'තත්ත්වය', 'මට්ටම'];
        const searchTerms = lowerQuery.split(' ').filter(term => 
          term.length > 2 && !stopWords.includes(term.toLowerCase())
        );
        
        console.log('Search terms extracted:', searchTerms);
        
        if (searchTerms.length > 0) {
          // Try searching for each term
          for (const term of searchTerms) {
            console.log(`Trying to search for: ${term}`);
            const searchResults = await this.searchInventoryItems(term);
            if (searchResults.length > 0) {
              results.inventory = searchResults;
              console.log(`Found ${searchResults.length} items for term: ${term}`);
              break;
            }
          }
          // If no specific item found, get all inventory
          if (results.inventory.length === 0) {
            console.log('No specific items found, getting all inventory');
            results.inventory = await this.getInventoryItems();
          }
        } else {
          // General inventory query - get all items
          console.log('General inventory query, getting all items');
          results.inventory = await this.getInventoryItems();
        }
        
        console.log('Final inventory results:', results.inventory.length, 'items');
      } else {
        // Fallback for general queries - get active alerts and safe zones
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
      results.emergencyRequests = results.emergencyRequests.filter((req, index, self) =>
        index === self.findIndex(r => r.id === req.id)
      );

      return results;
    } catch (error) {
      console.error('Error searching relevant data:', error);
      return results;
    }
  }

  // Mock inventory data for testing when Firebase is not available
  getMockInventoryData() {
    console.log('Using mock inventory data');
    return [
      {
        id: 'mock-1',
        name: 'Tents',
        currentStock: 50,
        minThreshold: 20,
        status: 'In Stock',
        category: 'Shelter',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'mock-2',
        name: 'Food Packets',
        currentStock: 200,
        minThreshold: 100,
        status: 'In Stock',
        category: 'Food',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'mock-3',
        name: 'Water Bottles',
        currentStock: 15,
        minThreshold: 50,
        status: 'Low Stock',
        category: 'Water',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'mock-4',
        name: 'First Aid Kits',
        currentStock: 30,
        minThreshold: 25,
        status: 'In Stock',
        category: 'Medical',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'mock-5',
        name: 'Blankets',
        currentStock: 5,
        minThreshold: 20,
        status: 'Low Stock',
        category: 'Comfort',
        lastUpdated: new Date().toISOString()
      }
    ];
  }
}

export default new FirebaseService();