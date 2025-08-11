import React from 'react';
import { MapPin, Mail, Phone, Facebook, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-blue-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="h-8 w-8 text-blue-300" />
              <span className="text-2xl font-bold">Lanka Alert</span>
            </div>
            <p className="text-blue-100 mb-6 max-w-md">
              Your trusted partner for weather alerts and disaster management in Sri Lanka. 
              Stay informed, stay safe, and help build a resilient community.
            </p>
            <div className="flex space-x-4">
              <Facebook className="h-6 w-6 text-blue-300 hover:text-white cursor-pointer transition-colors" />
              <Twitter className="h-6 w-6 text-blue-300 hover:text-white cursor-pointer transition-colors" />
              <Instagram className="h-6 w-6 text-blue-300 hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-blue-100 hover:text-white transition-colors">Home</a></li>
              <li><a href="/alerts" className="text-blue-100 hover:text-white transition-colors">Alerts</a></li>
              <li><a href="/live-tracking" className="text-blue-100 hover:text-white transition-colors">Live Tracking</a></li>
              <li><a href="/emergency-help" className="text-blue-100 hover:text-white transition-colors">Emergency Help</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-blue-300" />
                <span className="text-blue-100">info@lankaalert.lk</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-blue-300" />
                <span className="text-blue-100">+94 112 136 136</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-blue-300 mt-1" />
                <span className="text-blue-100">
                  Ministry of Disaster Management<br />
                  Colombo 07, Sri Lanka
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-blue-800 mt-8 pt-8 text-center">
          <p className="text-blue-100">
            © 2025 Lanka Alert. All rights reserved. | Privacy Policy | Terms of Service
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;