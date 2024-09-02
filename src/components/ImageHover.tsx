import { useState, useEffect, CSSProperties } from 'react';
import Image, { type StaticImageData } from 'next/image';

type ImageHoverType = {
  images: StaticImageData[];
  width: number;
  height: number;
  style?: CSSProperties;
  className?: string;
};

export const ImageHover = ({
  images, width, height, className = '', style = {},
}: ImageHoverType) => {
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const changeImage = () => {
    setIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIndex(0);
    setIsHovered(false);
  };

  useEffect(() => {
    if (isHovered) {
      changeImage();
      const interval = setInterval(changeImage, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isHovered]);

  return (
    <div
      className={`image-hover ${className}`}
      style={{ width, height, ...style }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {images.map((image, i) => (
        <Image
          key={image.src}
          src={image}
          priority
          alt={`Image ${index + 1}`}
          className={i === index ? 'active' : ''}
        />
      ))}
    </div>
  );
};
