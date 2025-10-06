import React, { useState, useEffect } from 'react';
import { FileText, CloudRain, Mountain, Waves, Calendar, MapPin, AlertTriangle, TrendingUp, Activity, RefreshCw } from 'lucide-react';
import { useWeatherAlertContext } from '../context/weatherAlertContext';
import { getDisasterAlerts } from '../services/disasterAlertService';
import aiWeatherService from '../services/aiWeatherService';

const SituationReports = () => {
  const { alerts: weatherAlerts } = useWeatherAlertContext();
  const [disasterAlerts, setDisasterAlerts] = useState([]);
  const [weatherSummary, setWeatherSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch disaster alerts
  useEffect(() => {
    const fetchDisasterAlerts = async () => {
      try {
        const data = await getDisasterAlerts();
        setDisasterAlerts(data);
      } catch (error) {
        console.error('Error fetching disaster alerts:', error);
      }
    };
    fetchDisasterAlerts();
  }, []);

  // Generate weather summary
  useEffect(() => {
    const generateWeatherSummary = async () => {
      try {
        const summary = await aiWeatherService.getCurrentWeather(6.9271, 79.8612); // Colombo coordinates
        setWeatherSummary(summary);
      } catch (error) {
        console.error('Error generating weather summary:', error);
      }
    };
    generateWeatherSummary();
  }, []);

  // Update loading state
  useEffect(() => {
    if (weatherAlerts.length > 0 || disasterAlerts.length > 0) {
      setLoading(false);
    }
  }, [weatherAlerts, disasterAlerts]);

  // Generate 4 summary reports from weather and disaster data only
  const generateSummaryReports = () => {
    const reports = [];

    // 1. Weather Alerts Summary
    if (weatherAlerts.length > 0) {
      const highRiskCount = weatherAlerts.filter(alert => alert.dangerLevel === 'High Risk').length;
      const mediumRiskCount = weatherAlerts.filter(alert => alert.dangerLevel === 'Medium Risk').length;
      const totalCities = [...new Set(weatherAlerts.map(alert => alert.cityName))].length;
      
      reports.push({
        id: 'weather-summary',
        title: 'Weather Alerts Summary',
        type: 'Weather',
        icon: <CloudRain className="h-6 w-6" />,
        status: highRiskCount > 0 ? 'High Risk' : mediumRiskCount > 0 ? 'Medium Risk' : 'Normal',
        severity: highRiskCount > 0 ? 'High' : mediumRiskCount > 0 ? 'Medium' : 'Info',
        location: `${totalCities} Cities`,
        time: getTimeAgo(weatherAlerts[0]?.createdAt),
        description: `${weatherAlerts.length} weather alerts across ${totalCities} cities. ${highRiskCount} high risk, ${mediumRiskCount} medium risk.`,
        alertCount: weatherAlerts.length
      });
    }

    // 2. Disaster Alerts Summary
    if (disasterAlerts.length > 0) {
      const activeDisasters = disasterAlerts.filter(alert => {
        const now = new Date();
        const start = new Date(`${alert.startDate}T${alert.startTime}`);
        const validUntil = new Date(`${alert.validUntilDate}T${alert.validUntilTime}`);
        return now >= start && now <= validUntil;
      });

      const highSeverityCount = activeDisasters.filter(alert => alert.severity === 'high').length;
      const totalDistricts = [...new Set(activeDisasters.map(alert => alert.district))].length;
      
      reports.push({
        id: 'disaster-summary',
        title: 'Disaster Alerts Summary',
        type: 'Disaster',
        icon: <AlertTriangle className="h-6 w-6" />,
        status: activeDisasters.length > 0 ? 'Active' : 'Normal',
        severity: highSeverityCount > 0 ? 'High' : activeDisasters.length > 0 ? 'Medium' : 'Info',
        location: `${totalDistricts} Districts`,
        time: activeDisasters.length > 0 ? getTimeAgo(activeDisasters[0].createdAt) : 'No active alerts',
        description: `${activeDisasters.length} active disaster alerts across ${totalDistricts} districts. ${highSeverityCount} high severity.`,
        alertCount: activeDisasters.length
      });
    }

    // 3. Current Weather Summary
    if (weatherSummary) {
      reports.push({
        id: 'current-weather',
        title: 'Current Weather',
        type: 'Weather',
        icon: <Activity className="h-6 w-6" />,
        status: 'Updated',
        severity: 'Info',
        location: 'Colombo',
        time: 'Just now',
        description: `${weatherSummary.weatherCondition?.description?.text || 'Partly Cloudy'}, ${Math.round(weatherSummary.temperature?.degrees || 28)}°C`,
        alertCount: 0
      });
    }

    // 4. Overall Situation Summary
    const totalAlerts = weatherAlerts.length + disasterAlerts.length;
    const overallStatus = totalAlerts > 10 ? 'High Alert' : totalAlerts > 5 ? 'Medium Alert' : 'Normal';
    
    reports.push({
      id: 'overall-summary',
      title: 'Overall Situation',
      type: 'Summary',
      icon: <FileText className="h-6 w-6" />,
      status: overallStatus,
      severity: totalAlerts > 10 ? 'High' : totalAlerts > 5 ? 'Medium' : 'Info',
      location: 'Island-wide',
      time: 'Live',
      description: `Total ${totalAlerts} active alerts. ${weatherAlerts.length} weather alerts, ${disasterAlerts.length} disaster alerts.`,
      alertCount: totalAlerts
    });

    return reports;
  };

  const getWeatherIcon = (type) => {
    switch (type) {
      case 'Flood':
        return <CloudRain className="h-6 w-6" />;
      case 'Wind':
        return <Waves className="h-6 w-6" />;
      case 'UV':
        return <Activity className="h-6 w-6" />;
      case 'Temperature':
        return <TrendingUp className="h-6 w-6" />;
      default:
        return <FileText className="h-6 w-6" />;
    }
  };

  const getDisasterIcon = (disasterName) => {
    const name = disasterName.toLowerCase();
    if (name.includes('flood')) return <CloudRain className="h-6 w-6" />;
    if (name.includes('landslide')) return <Mountain className="h-6 w-6" />;
    if (name.includes('wind') || name.includes('cyclone')) return <Waves className="h-6 w-6" />;
    return <AlertTriangle className="h-6 w-6" />;
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const now = new Date();
    const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const reports = generateSummaryReports();

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      default:
        return 'text-blue-600 bg-blue-100 border-blue-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'critical':
        return 'text-red-700 bg-red-50';
      case 'active':
        return 'text-green-700 bg-green-50';
      case 'available':
        return 'text-blue-700 bg-blue-50';
      default:
        return 'text-gray-700 bg-gray-50';
    }
  };

  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel.toLowerCase()) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'safe':
        return 'bg-green-500';
      default:
        return 'bg-blue-500';
    }
  };

  const refreshData = () => {
    setLoading(true);
    setLastUpdated(new Date());
    // Trigger re-fetch of data
    window.location.reload();
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl text-gray-700">Loading situation reports...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-blue-100 rounded-2xl mr-6">
              <Activity className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900">
              Situation Summary
            </h2>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Current weather and disaster alert summaries
          </p>
          
          {/* Refresh Button */}
          <div className="flex items-center justify-center space-x-6">
            <button 
              onClick={refreshData}
              className="flex items-center space-x-3 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <RefreshCw className="h-5 w-5" />
              <span className="font-semibold">Refresh Data</span>
            </button>
            <div className="bg-white rounded-lg px-4 py-2 shadow-md">
              <p className="text-sm text-gray-600 font-medium">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* 4 Summary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {reports.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No Data Available
              </h3>
              <p className="text-gray-500">
                No situation data is currently available. Check back later for updates.
              </p>
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border-l-4 ${
                  report.severity === 'High' ? 'border-red-500' :
                  report.severity === 'Medium' ? 'border-yellow-500' :
                  'border-blue-500'
                } transform hover:scale-105 hover:-translate-y-1`}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${
                      report.severity === 'High' ? 'bg-red-100' :
                      report.severity === 'Medium' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                      {report.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{report.title}</h3>
                      <p className="text-sm text-gray-500 font-medium">{report.type}</p>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${getSeverityColor(report.severity)}`}>
                    {report.severity}
                  </span>
                </div>

                {/* Card Content */}
                <div className="mb-6">
                  <p className="text-gray-700 leading-relaxed text-base">{report.description}</p>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{report.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{report.time}</span>
                    </div>
                  </div>
                  {report.alertCount > 0 && (
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                      {report.alertCount} alerts
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Enhanced Footer */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-3xl mx-auto border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Stay Informed, Stay Safe
            </h3>
            <p className="text-gray-600 text-lg leading-relaxed">
              For detailed information and emergency contacts, visit our main alert pages.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SituationReports;