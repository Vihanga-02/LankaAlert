import React from 'react';
import { FileText, CloudRain, Mountain, Waves, Calendar, MapPin } from 'lucide-react';

const SituationReports = () => {
  const reports = [
    {
      id: 1,
      title: 'Heavy Rainfall - Western Province',
      type: 'Weather Report',
      icon: <CloudRain className="h-6 w-6" />,
      status: 'Active',
      severity: 'High',
      location: 'Colombo, Gampaha, Kalutara',
      time: '2 hours ago',
      description: 'Continuous heavy rainfall with thunderstorms expected for the next 12 hours.'
    },
    {
      id: 2,
      title: 'Landslide Warning - Central Province',
      type: 'Landslide Warning',
      icon: <Mountain className="h-6 w-6" />,
      status: 'Active',
      severity: 'medium',
      location: 'Kandy, Matale, Nuwara Eliya',
      time: '1 hour ago',
      description: 'Some risk of landslides in hilly areas. Evacuation advised for vulnerable locations.'
    },
    {
      id: 3,
      title: 'High Wind Alets',
      type: 'Wind Warning',
      icon: <Waves className="h-6 w-6" />,
      status: 'Active',
      severity: 'Medium',
      location: 'Galle, Matara, Hambantota',
      time: '3 hours ago',
      description: 'High wind alerts is active for coastal areas. Secure loose objects and avoid outdoor activities.'
    },
    {
      id: 4,
      title: 'Daily Weather Summary',
      type: 'Situation Report',
      icon: <FileText className="h-6 w-6" />,
      status: 'Updated',
      severity: 'Info',
      location: 'Island-wide',
      time: '6 hours ago',
      description: 'Comprehensive weather situation analysis and forecast for all provinces.'
    }
  ];

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
      default:
        return 'text-gray-700 bg-gray-50';
    }
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Current Situation Reports
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Stay updated with the latest weather conditions, warnings, and situation reports from across Sri Lanka
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    {report.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {report.title}
                    </h3>
                    <p className="text-sm text-gray-500">{report.type}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                    {report.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(report.severity)}`}>
                    {report.severity}
                  </span>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{report.description}</p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{report.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{report.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            View All Reports
          </button>
        </div>
      </div>
    </section>
  );
};

export default SituationReports;