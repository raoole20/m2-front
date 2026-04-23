"use client";

import AutoScroll from "embla-carousel-auto-scroll";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import type { LogoItem } from "../../../lib/content";

export function LogosCarousel({ items }: { items: LogoItem[] }) {
  return (
    <Carousel
      className="logos-track"
      opts={{
        loop: true,
        align: "start",
        dragFree: true,
        containScroll: false,
        watchDrag: false,
      }}
      plugins={[
        AutoScroll({
          speed: 1,
          startDelay: 0,
          stopOnInteraction: false,
          stopOnMouseEnter: true,
          playOnInit: true,
        }),
      ]}
    >
      <CarouselContent className="ml-0">
        {items.map((item, i) => (
          <CarouselItem
            key={`${item.text}-${i}`}
            className={`lg basis-auto pl-0 ${item.sans ? "sans" : ""}`}
          >
            {item.text}
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
