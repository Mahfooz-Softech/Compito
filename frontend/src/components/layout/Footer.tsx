import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { useContactInfo } from "@/hooks/useContactInfo";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { contactInfo, loading } = useContactInfo();

  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-[hsl(255,85%,62%)] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-2xl font-bold">Compito</span>
            </div>
            <p className="text-gray-300">
              Your trusted platform for professional services. Connect with skilled workers and get things done efficiently.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Services</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link to="/services/cleaning" className="hover:text-white transition-colors">
                  Cleaning
                </Link>
              </li>
              <li>
                <Link to="/services/handyman" className="hover:text-white transition-colors">
                  Handyman
                </Link>
              </li>
              <li>
                <Link to="/services/moving" className="hover:text-white transition-colors">
                  Moving
                </Link>
              </li>
              <li>
                <Link to="/services/gardening" className="hover:text-white transition-colors">
                  Gardening
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  View All Services
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Support</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link to="/help" className="hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/safety" className="hover:text-white transition-colors">
                  Safety
                </Link>
              </li>
              <li>
                <Link to="/trust" className="hover:text-white transition-colors">
                  Trust & Safety
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <div className="space-y-3 text-gray-300">
              {loading ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span className="animate-pulse bg-gray-600 h-4 w-32 rounded"></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span className="animate-pulse bg-gray-600 h-4 w-24 rounded"></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span className="animate-pulse bg-gray-600 h-4 w-28 rounded"></span>
                  </div>
                </div>
              ) : contactInfo ? (
                <>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>{contactInfo.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{contactInfo.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{contactInfo.address}</span>
                  </div>
                </>
              ) : ""}
            </div>
            <div className="pt-4">
              <Link to="/become-worker" className="btn-hero inline-block text-center">
                Become a Worker
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; {currentYear} Compito. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;