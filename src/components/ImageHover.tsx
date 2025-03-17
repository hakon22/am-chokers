import { useState, useEffect, CSSProperties, HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';
import { Rate } from 'antd';
import { LikeOutlined } from '@ant-design/icons';
import cn from 'classnames';

import image404 from '@/images/404.svg';
import type { ItemInterface } from '@/types/item/Item';

interface ImageHoverType extends HTMLAttributes<HTMLDivElement>, Pick<ItemInterface, 'images'> {
  height: number | string;
  width?: number | string;
  href?: string;
  name?: string;
  description?: string;
  marker?: boolean;
  rating?: { rating?: ItemInterface['rating']; grades: ItemInterface['grades'] };
  style?: CSSProperties;
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
  rating,
  style = {},
  ...props
}: ImageHoverType) => {
  const { t: tPrice } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });

  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const grade = rating?.rating?.rating ?? 0;

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
                style={{ borderRadius: 7 }}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                alt={`Image ${index + 1}`}
                className={i === index ? 'active object-fit-contain' : 'object-fit-contain'}
              />
            ))
            : <Image src={image404} alt="" className="active object-fit-contain" />}
        </Link>
        {marker || name || description ? (
          <div className="image-hover-sub mt-3" style={{ width, ...style }}>
            {marker ? [...images].sort((a, b) => b.order - a.order).map((image, i) => <span key={image.id} className={i === index ? 'sphere active' : 'sphere'} />) : null}
            {name ? <div className={cn('title lh-sm mb-2', { 'mb-3': !rating })} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width }}>{name}</div> : null}
            {rating ? (
              <div className="d-flex align-items-center gap-3 mb-3 text-muted">
                <div className="d-flex align-items-center gap-2" title={grade.toString()}>
                  <Rate disabled allowHalf count={1} value={grade} />
                  <span>{grade}</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <LikeOutlined />
                  <span>{tPrice('grades.gradeCount', { count: rating.grades.length })}</span>
                </div>
              </div>
            ) : null}
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
                style={{ borderRadius: 7 }}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                alt={`Image ${index + 1}`}
                className={i === index ? 'active object-fit-contain' : 'object-fit-contain'}
              />
            ))
            : <Image src={image404} alt="" className="active object-fit-contain" />}
        </div>
        {marker || name || description ? (
          <div className="image-hover-sub mt-3" style={{ width, ...style }}>
            {marker ? [...images].sort((a, b) => b.order - a.order).map((image, i) => <span key={image.id} className={i === index ? 'sphere active' : 'sphere'} />) : null}
            {name ? <div className="title lh-sm mb-3" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width }}>{name}</div> : null}
            {description ? <div className="description">{description}</div> : null}
          </div>
        ) : null}
      </div>
    );
};
