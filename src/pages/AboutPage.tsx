import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Leaf,
  Users,
  Target,
  Award,
  Globe,
  TrendingUp,
  Shield,
  Heart,
  Star,
  MapPin,
  Phone,
  Mail,
  Clock,
} from "lucide-react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export const AboutPage = () => {
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for better UX
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Page loading screen
  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
        <div className="text-center">
          {/* Spinner chính */}
          <div className=" flex justify-center mb-6">
            <Spinner
              variant="circle-filled"
              size={60}
              className="text-green-600 mx-auto"
            />
          </div>

          {/* Tiêu đề */}
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Đang tải trang giới thiệu
          </h2>

          {/* Mô tả */}
          <p className="text-gray-600 mb-6">Chuẩn bị thông tin về công ty...</p>

          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { number: "50,000+", label: "Nông dân được hỗ trợ", icon: Users },
    { number: "100,000+", label: "Ha đất được canh tác", icon: Target },
    { number: "95%", label: "Tỷ lệ hài lòng", icon: Star },
    { number: "15+", label: "Năm kinh nghiệm", icon: Award },
  ];

  const values = [
    {
      icon: Leaf,
      title: "Bền vững",
      description:
        "Cam kết phát triển nông nghiệp bền vững, bảo vệ môi trường và tài nguyên thiên nhiên",
    },
    {
      icon: Heart,
      title: "Tận tâm",
      description:
        "Luôn đặt lợi ích của nông dân lên hàng đầu, hỗ trợ tận tình mọi lúc mọi nơi",
    },
    {
      icon: Shield,
      title: "Tin cậy",
      description:
        "Cung cấp giải pháp an toàn, chất lượng cao, được kiểm chứng và tin tưởng",
    },
    {
      icon: TrendingUp,
      title: "Đổi mới",
      description:
        "Không ngừng cải tiến công nghệ, mang đến giải pháp nông nghiệp thông minh nhất",
    },
  ];

  const team = [
    {
      name: "Nguyễn Văn An",
      position: "CEO & Founder",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
      description:
        "15+ năm kinh nghiệm trong lĩnh vực nông nghiệp công nghệ cao",
    },
    {
      name: "Trần Thị Bình",
      position: "CTO",
      image:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face",
      description: "Chuyên gia về AI và IoT trong nông nghiệp thông minh",
    },
    {
      name: "Lê Văn Cường",
      position: "Head of Agriculture",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
      description: "Thạc sĩ nông nghiệp, 10+ năm nghiên cứu và phát triển",
    },
  ];

  const milestones = [
    {
      year: "2009",
      title: "Thành lập",
      description:
        "VerdantTech được thành lập với sứ mệnh cách mạng hóa nông nghiệp Việt Nam",
    },
    {
      year: "2015",
      title: "Mở rộng",
      description:
        "Phát triển hệ thống quản lý nông nghiệp thông minh đầu tiên",
    },
    {
      year: "2020",
      title: "Đột phá",
      description: "Ra mắt nền tảng marketplace nông nghiệp toàn diện",
    },
    {
      year: "2024",
      title: "Tương lai",
      description: "Tiên phong trong nông nghiệp 4.0 và bền vững",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white pt-32 pb-12 sm:pt-36 sm:pb-16 lg:pt-40 lg:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Leaf className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            Về VerdantTech
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-green-100 max-w-3xl mx-auto leading-relaxed px-4">
            Chúng tôi là đối tác tin cậy của nông dân Việt Nam, mang đến giải
            pháp nông nghiệp thông minh và bền vững để xây dựng tương lai nông
            nghiệp phát triển.
          </p>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-4 sm:mb-6">
                Sứ mệnh & Tầm nhìn
              </h2>
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-green-600 mb-2 sm:mb-3">
                    Sứ mệnh
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    Cung cấp giải pháp nông nghiệp thông minh, giúp nông dân
                    Việt Nam tăng năng suất, giảm chi phí và phát triển bền
                    vững, góp phần xây dựng nền nông nghiệp hiện đại.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-green-600 mb-2 sm:mb-3">
                    Tầm nhìn
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    Trở thành công ty hàng đầu về công nghệ nông nghiệp tại Đông
                    Nam Á, tiên phong trong cuộc cách mạng nông nghiệp 4.0 và
                    phát triển bền vững.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl p-8">
                <div className="text-center">
                  <Globe className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    Tác động toàn cầu
                  </h3>
                  <p className="text-gray-600">
                    Giải pháp của chúng tôi đã được áp dụng tại 15+ tỉnh thành
                    Việt Nam, hỗ trợ hơn 50,000 nông dân và canh tác trên
                    100,000 ha đất.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-12 sm:py-16 lg:py-20 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
              Thành tựu nổi bật
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600">
              Những con số ấn tượng về VerdantTech
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
              Giá trị cốt lõi
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600">
              Những nguyên tắc định hướng mọi hoạt động của chúng tôi
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-shadow duration-300 border-0 shadow-md"
              >
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-8 h-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl text-gray-800">
                    {value.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-12 sm:py-16 lg:py-20 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
              Đội ngũ lãnh đạo
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600">
              Những con người tài năng và tâm huyết
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-shadow duration-300 border-0 shadow-md"
              >
                <CardHeader className="pb-4">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                  />
                  <CardTitle className="text-xl text-gray-800">
                    {member.name}
                  </CardTitle>
                  <p className="text-green-600 font-semibold">
                    {member.position}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
              Hành trình phát triển
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600">
              15 năm xây dựng và phát triển
            </p>
          </div>
          <div className="relative">
            <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-1 bg-green-200 h-full"></div>
            <div className="space-y-8 sm:space-y-10 lg:space-y-12">
              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className={`flex flex-col lg:flex-row items-center ${
                    index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                  }`}
                >
                  <div
                    className={`w-full lg:w-1/2 ${
                      index % 2 === 0
                        ? "lg:pr-8 lg:text-right"
                        : "lg:pl-8 lg:text-left"
                    } mb-4 lg:mb-0`}
                  >
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-green-500">
                      <div className="text-xl sm:text-2xl font-bold text-green-600 mb-2">
                        {milestone.year}
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                        {milestone.title}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                  <div className="hidden lg:block w-4 h-4 bg-green-500 rounded-full border-4 border-white shadow-md z-10"></div>
                  <div className="hidden lg:block w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-green-600 to-emerald-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Liên hệ với chúng tôi
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-green-100">
              Hãy để lại thông tin, chúng tôi sẽ liên hệ sớm nhất
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12">
            <div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
                Thông tin liên hệ
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-green-300" />
                  <span>123 Đường ABC, Quận 1, TP. Hồ Chí Minh</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-green-300" />
                  <span>+84 28 1234 5678</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-green-300" />
                  <span>info@verdanttech.vn</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-green-300" />
                  <span>Thứ 2 - Thứ 6: 8:00 - 18:00</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
                Gửi tin nhắn
              </h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Họ và tên"
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder:text-white/70 focus:outline-none focus:border-white/50"
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder:text-white/70 focus:outline-none focus:border-white/50"
                />
                <textarea
                  placeholder="Nội dung tin nhắn"
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder:text-white/70 focus:outline-none focus:border-white/50 resize-none"
                ></textarea>
                <Button className="w-full bg-white text-green-600 hover:bg-gray-100 py-3 text-lg font-semibold">
                  Gửi tin nhắn
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
