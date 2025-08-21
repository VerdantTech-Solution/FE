import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import carousel1 from "@/assets/carousel1.jpg";
import carousel2 from "@/assets/carousel2.jpg";
import logo from "@/assets/logo.png";

export const CarouselComponent = () => {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const slides = [
    {
      id: 1,
      image: carousel1,
      title: "Nông nghiệp thông minh",
      subtitle: "Giải pháp công nghệ xanh cho tương lai bền vững",
      description: "Chuyển đổi nông nghiệp với AI, IoT và thực hành bền vững để tối ưu hóa năng suất và bảo vệ môi trường.",
      cta: "Khám phá ngay",
      color: "from-emerald-500/90 to-teal-600/90"
    },
    {
      id: 2,
      image: carousel2,
      title: "Thiết bị nông nghiệp hiện đại",
      subtitle: "Tích hợp công nghệ tiên tiến",
      description: "Hệ thống tưới thông minh, drone giám sát và thiết bị IoT giúp nông dân quản lý nông trại hiệu quả hơn.",
      cta: "Tìm hiểu thêm",
      color: "from-green-500/90 to-emerald-600/90"
    },
    {
      id: 3,
      image: logo,
      title: "VerdantTech",
      subtitle: "Đối tác tin cậy của nông dân Việt Nam",
      description: "Chúng tôi cam kết mang đến những công nghệ tiên tiến nhất để hỗ trợ người nông dân xây dựng tương lai nông nghiệp bền vững.",
      cta: "Liên hệ ngay",
      color: "from-teal-500/90 to-cyan-600/90"
    }
  ];

  useEffect(() => {
    if (!api) return;

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && api) {
      interval = setInterval(() => {
        api.scrollNext();
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, api]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
         <div className="w-full max-w-6xl mx-auto px-4">
             <Carousel
         setApi={setApi}
         className="w-full rounded-3xl overflow-hidden shadow-2xl"
         opts={{
           align: "start",
           loop: true,
         }}
       >
        <CarouselContent>
          {slides.map((slide) => (
            <CarouselItem key={slide.id} className="pl-0">
              <div className="relative w-full h-[600px] overflow-hidden rounded-2xl shadow-2xl">
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${slide.color}`} />
                </div>

                {/* Content */}
                <div className="relative z-10 flex items-center justify-center h-full px-8">
                  <div className="text-center text-white max-w-4xl">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      <span className="text-sm font-medium">VerdantTech</span>
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight drop-shadow-lg">
                      {slide.title}
                    </h1>

                    {/* Subtitle */}
                    <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-white/90 drop-shadow-md">
                      {slide.subtitle}
                    </h2>

                    {/* Description */}
                    <p className="text-lg md:text-xl text-white/80 mb-8 leading-relaxed drop-shadow-md max-w-3xl mx-auto">
                      {slide.description}
                    </p>

                    {/* CTA Button */}
                    <Button 
                      size="lg" 
                      className="text-lg px-8 py-4 bg-white text-gray-900 hover:bg-white/90 transition-all duration-300 hover:scale-105"
                    >
                      {slide.cta}
                    </Button>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

                 {/* Custom Navigation Arrows */}
         <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white border-0 hover:scale-110 transition-all duration-300 backdrop-blur-sm rounded-full" />
         <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white border-0 hover:scale-110 transition-all duration-300 backdrop-blur-sm rounded-full" />

        {/* Play/Pause Button */}
        <Button
          onClick={togglePlayPause}
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white rounded-full p-3 transition-all duration-300 hover:scale-110 backdrop-blur-sm border-0"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </Button>

        {/* Slide Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === current 
                  ? "bg-white scale-125" 
                  : "bg-white/50 hover:bg-white/70"
              }`}
            />
          ))}
        </div>

        {/* Slide Counter */}
        <div className="absolute bottom-6 right-6 bg-black/30 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
          {current + 1} / {slides.length}
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div 
            className="h-full bg-white transition-all duration-1000 ease-linear"
            style={{ 
              width: `${((current + 1) / slides.length) * 100}%` 
            }}
          />
        </div>
      </Carousel>
    </div>
  );
};
