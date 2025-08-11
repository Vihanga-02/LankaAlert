import React from 'react';
import { Shield, AlertTriangle, MapPin, Users } from 'lucide-react';

const HeroSection = () => {
  const features = [
    {
      icon: <AlertTriangle className="h-8 w-8 text-blue-600" />,
      title: 'Real-time Alerts',
      description: 'Get instant notifications about weather conditions and disasters in your area'
    },
    {
      icon: <MapPin className="h-8 w-8 text-blue-600" />,
      title: 'Live Tracking',
      description: 'Track disasters and weather conditions with our interactive map system'
    },
    {
      icon: <Shield className="h-8 w-8 text-blue-600" />,
      title: 'Emergency Help',
      description: 'Quick access to emergency services and disaster response resources'
    },
    {
      icon: <Users className="h-8 w-8 text-blue-600" />,
      title: 'Community Reports',
      description: 'Verified reports from local officials and community reporters'
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Stay <span className="text-blue-600">Safe</span>, Stay <span className="text-blue-600">Informed</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Lanka Alert is your comprehensive disaster management platform, providing real-time weather alerts, 
            live tracking, and emergency assistance for communities across Sri Lanka.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
              Get Weather Alerts
            </button>
            <button className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors">
              View Live Map
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow bg-gray-50 hover:bg-white border border-gray-200"
            >
              <div className="flex justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;