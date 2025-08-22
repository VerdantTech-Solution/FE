
import { CarouselComponent } from './CarouselComponent'
import AgricultureSolutions from './AgricultureSolutions'
import AgriculturalMarketplace from './AgriculturalMarketplace'
import WhyChoosePlatform from './WhyChoosePlatform'

export const HomePage = () => {
  return (
    <div className='my-[100px]'>
      <CarouselComponent/>
      <AgricultureSolutions />
      <AgriculturalMarketplace />
      <WhyChoosePlatform />
    </div>
  )
}

