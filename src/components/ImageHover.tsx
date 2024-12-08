import {
  useState, useEffect, CSSProperties, HTMLAttributes,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';

import image404 from '@/images/404.svg';
import type { ItemInterface } from '@/types/item/Item';

interface ImageHoverType extends HTMLAttributes<HTMLDivElement>, Pick<ItemInterface, 'images'> {
  height: number | string;
  width?: number | string;
  href?: string;
  name?: string;
  description?: string;
  marker?: boolean;
  style?: CSSProperties;
  props?: HTMLAttributes<HTMLDivElement>[];
}

export const ImageHover = ({
  images,
  height,
  href,
  width = undefined,
  name = '',
  description = '',
  marker = false,
  className = '',
  style = {},
  ...props
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

  return href
    ? (
      <div className={`d-flex flex-column ${className}`} {...props}>
        <Link
          href={href}
          className="image-hover"
          style={{ width, height, ...style }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {images.length
            ? [...images].sort((a, b) => a.order - b.order).map((image, i) => (
              <Image
                key={image.id}
                src={image.src}
                unoptimized
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                alt={`Image ${index + 1}`}
                className={i === index ? 'active' : ''}
              />
            ))
            : <Image src={image404} alt="" className="active" />}
        </Link>
        {marker || name || description ? (
          <div className="image-hover-sub mt-3" style={{ width, ...style }}>
            {marker ? [...images].sort((a, b) => b.order - a.order).map((image, i) => <span key={image.id} className={i === index ? 'sphere active' : 'sphere'} />) : null}
            {name ? <div className="title">{name}</div> : null}
            {description ? <div className="description">{description}</div> : null}
          </div>
        ) : null}
      </div>
    )
    :  (
      <div className={`d-flex flex-column ${className}`} {...props}>
        <div
          className="image-hover"
          style={{ width, height, ...style }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {images.length
            ? [...images].sort((a, b) => a.order - b.order).map((image, i) => (
              <Image
                key={image.id}
                src={image.src}
                unoptimized
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                alt={`Image ${index + 1}`}
                className={i === index ? 'active' : ''}
              />
            ))
            : <Image src={image404} alt="" className="active" />}
        </div>
        {marker || name || description ? (
          <div className="image-hover-sub mt-3" style={{ width, ...style }}>
            {marker ? [...images].sort((a, b) => b.order - a.order).map((image, i) => <span key={image.id} className={i === index ? 'sphere active' : 'sphere'} />) : null}
            {name ? <div className="title">{name}</div> : null}
            {description ? <div className="description">{description}</div> : null}
          </div>
        ) : null}
      </div>
    );
};
