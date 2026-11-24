import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageSliderProps {
    images: string[];
    alt: string;
    imageClassName?: string;
    fallback: ReactNode;
}

export function ImageSlider({ images, alt, imageClassName = "", fallback }: ImageSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const hasMultipleImages = images.length > 1;

    function showImage(step: number) {
        setCurrentIndex((index) => (index + step + images.length) % images.length);
    }

    if (images.length === 0) {
        return <>{fallback}</>;
    }

    return (
        <div
            className="group/slider w-full h-full"
            onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
            onTouchEnd={(e) => {
                if (touchStartX === null) return;
                const deltaX = e.changedTouches[0].clientX - touchStartX;
                setTouchStartX(null);
                if (Math.abs(deltaX) < 40) return;
                // In RTL the "next" image is on the left, so the swipe direction flips.
                const isRtl = document.documentElement.dir === "rtl";
                const swipedToNext = isRtl ? deltaX > 0 : deltaX < 0;
                showImage(swipedToNext ? 1 : -1);
            }}
        >
            <img
                src={images[currentIndex]}
                alt={alt}
                loading="lazy"
                className={`w-full h-full object-cover ${imageClassName}`}
            />

            {hasMultipleImages && (
                <>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            showImage(-1);
                        }}
                        aria-label="Previous image"
                        className="absolute start-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white shadow-md flex items-center justify-center md:opacity-0 md:group-hover/slider:opacity-100 transition cursor-pointer"
                    >
                        <ChevronLeft className="w-4 h-4 text-gray-800 rtl:rotate-180" />
                    </button>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            showImage(1);
                        }}
                        aria-label="Next image"
                        className="absolute end-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white shadow-md flex items-center justify-center md:opacity-0 md:group-hover/slider:opacity-100 transition cursor-pointer"
                    >
                        <ChevronRight className="w-4 h-4 text-gray-800 rtl:rotate-180" />
                    </button>

                    <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 pointer-events-none">
                        {images.map((image, index) => (
                            <button
                                key={image + index}
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentIndex(index);
                                }}
                                aria-label={`Image ${index + 1}`}
                                className={`pointer-events-auto h-1.5 rounded-full shadow transition-all cursor-pointer ${
                                    index === currentIndex ? "w-4 bg-white" : "w-1.5 bg-white/60"
                                }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export function getListingImages(item: { images?: string[]; imageUrl?: string }): string[] {
    if (item.images?.length) return item.images;
    return item.imageUrl ? [item.imageUrl] : [];
}
