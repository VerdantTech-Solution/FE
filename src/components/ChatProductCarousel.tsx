import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { ChatProductCard, type ChatProduct } from './ChatProductCard';

interface ChatProductCarouselProps {
  products: ChatProduct[];
}

export const ChatProductCarousel = ({ products }: ChatProductCarouselProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    });
  }, [api]);

  if (products.length === 0) {
    return null;
  }

  // If only one product, show it without carousel
  if (products.length === 1) {
    return (
      <div className="w-full">
        <ChatProductCard product={products[0]} />
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-full overflow-hidden">
      <Carousel
        setApi={setApi}
        opts={{
          align: 'start',
          loop: false,
          dragFree: true,
        }}
        className="w-full max-w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-3 max-w-full">
          {products.map((product, index) => (
            <CarouselItem
              key={index}
              className="pl-2 md:pl-3 basis-full sm:basis-[85%] md:basis-[75%] lg:basis-[65%] max-w-full"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <ChatProductCard product={product} />
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Custom Navigation Buttons */}
        {canScrollPrev && (
          <CarouselPrevious className="left-1 h-7 w-7 bg-white/95 hover:bg-white shadow-md border border-green-200 text-green-600 hover:text-green-700 hover:shadow-lg transition-all z-10" />
        )}
        {canScrollNext && (
          <CarouselNext className="right-1 h-7 w-7 bg-white/95 hover:bg-white shadow-md border border-green-200 text-green-600 hover:text-green-700 hover:shadow-lg transition-all z-10" />
        )}
      </Carousel>

      {/* Dots Indicator */}
      {products.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                index === current
                  ? 'w-6 bg-green-500'
                  : 'w-1.5 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

