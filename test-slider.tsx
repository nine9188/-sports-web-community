'use client';

import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';

export default function TestSlider() {
  const [sliderRef] = useKeenSlider({
    slides: { perView: 4, spacing: 12 },
    breakpoints: {
      '(max-width: 768px)': {
        slides: { perView: 2, spacing: 12 },
      },
    },
  });

  const items = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div ref={sliderRef} className="keen-slider">
      {items.map((item) => (
        <div key={item} className="keen-slider__slide">
          <div className="bg-blue-500 h-20 text-white flex items-center justify-center">
            Item {item}
          </div>
        </div>
      ))}
    </div>
  );
}