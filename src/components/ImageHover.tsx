import { useState, useEffect, CSSProperties } from 'react';
import Image, { type StaticImageData } from 'next/image';

type ImageHoverType = {
  images: StaticImageData[];
  height: number | string;
  width?: number | string;
  title?: string;
  description?: string;
  marker?: boolean;
  style?: CSSProperties;
  className?: string;
};

export const ImageHover = ({
  images,
  height,
  width = undefined,
  title = '',
  description = '',
  marker = false,
  className = '',
  style = {},
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
      const interval = setInterval(changeImage, 3000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isHovered]);

  return (
    <div className={`d-flex flex-column ${className}`}>
      <div
        className="image-hover"
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
      {marker || title || description ? (
        <div className="image-hover-sub mt-3" style={{ width, ...style }}>
          {marker ? images.map((image, i) => <span key={image.src} className={i === index ? 'sphere active' : 'sphere'} />) : null}
          {title ? <div className="title">{title}</div> : null}
          {description ? <div className="description">{description}</div> : null}
        </div>
      ) : null}
    </div>
  );
};
