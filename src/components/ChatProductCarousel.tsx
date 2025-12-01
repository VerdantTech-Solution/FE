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
      <div className="w-full py-1">
        <ChatProductCard product={products[0]} />
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-full py-2 px-8">
      <Carousel
        setApi={setApi}
        opts={{
          align: 'start',
          loop: false,
          dragFree: true,
        }}
        className="w-full max-w-full"
      >
        <CarouselContent className="-ml-2 max-w-full">
          {products.map((product, index) => (
            <CarouselItem
              key={index}
              className="pl-2 basis-full sm:basis-[100%] max-w-full"
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
        
        {/* Custom Navigation Buttons - Positioned outside content */}
        {canScrollPrev && (
          <CarouselPrevious className="left-0 h-8 w-8 bg-white/95 hover:bg-white shadow-lg border-2 border-green-300 text-green-600 hover:text-green-700 hover:shadow-xl transition-all z-30 top-1/2 -translate-y-1/2 -translate-x-1/2" />
        )}
        {canScrollNext && (
          <CarouselNext className="right-0 h-8 w-8 bg-white/95 hover:bg-white shadow-lg border-2 border-green-300 text-green-600 hover:text-green-700 hover:shadow-xl transition-all z-30 top-1/2 -translate-y-1/2 translate-x-1/2" />
        )}
      </Carousel>

      {/* Dots Indicator */}
      {products.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === current
                  ? 'w-8 bg-gradient-to-r from-green-500 to-emerald-500 shadow-sm'
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

