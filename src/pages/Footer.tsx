import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Leaf, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Youtube } from "lucide-react";
import logo from "@/assets/logo.png";

export const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img 
                src={logo} 
                alt="VerdantTech Logo" 
                className="h-12 w-auto"
              />
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">VerdantTech</span>
              </div>
            </div>
            <p className="text-gray-300 mb-6 max-w-md leading-relaxed">
              Giải pháp công nghệ xanh hàng đầu cho tương lai nông nghiệp bền vững. 
              Chúng tôi cam kết mang đến những công nghệ tiên tiến nhất để hỗ trợ 
              người nông dân Việt Nam.
            </p>
            <div className="flex space-x-4">
              <Button variant="outline" size="sm" className="border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-white">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-white">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-white">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-white">
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-white">
                <Youtube className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-emerald-300">Liên kết nhanh</h3>
            <ul className="space-y-3">
              <li>
                <a href="/" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Trang chủ
                </a>
              </li>
              <li>
                <a href="/features" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Tính năng
                </a>
              </li>
              <li>
                <a href="/services" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Dịch vụ
                </a>
              </li>
              <li>
                <a href="/solutions" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Giải pháp
                </a>
              </li>
              <li>
                <a href="/about" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Về chúng tôi
                </a>
              </li>
              <li>
                <a href="/contact" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Liên hệ
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-emerald-300">Liên hệ</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-emerald-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-300 text-sm">
                    123 Đường ABC, Quận 1<br />
                    TP. Hồ Chí Minh, Việt Nam
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-emerald-400" />
                <span className="text-gray-300 text-sm">+84 28 1234 5678</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-emerald-400" />
                <span className="text-gray-300 text-sm">info@verdanttech.vn</span>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Subscription */}
        <div className="mt-16 pt-8 border-t border-gray-700">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-xl font-semibold mb-4 text-emerald-300">
              Đăng ký nhận tin tức
            </h3>
            <p className="text-gray-300 mb-6">
              Nhận những thông tin mới nhất về công nghệ nông nghiệp và các giải pháp bền vững
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input 
                type="email" 
                placeholder="Nhập email của bạn" 
                className="flex-1 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
              />
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Đăng ký
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="bg-black/20 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-sm">
              © 2024 VerdantTech. Tất cả quyền được bảo lưu.
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="/privacy" className="text-gray-400 hover:text-emerald-400 transition-colors">
                Chính sách bảo mật
              </a>
              <a href="/terms" className="text-gray-400 hover:text-emerald-400 transition-colors">
                Điều khoản sử dụng
              </a>
              <a href="/cookies" className="text-gray-400 hover:text-emerald-400 transition-colors">
                Chính sách cookie
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
