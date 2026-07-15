import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Image as AntImage, Modal, Spin } from 'antd';
import { DislikeOutlined, LikeOutlined } from '@ant-design/icons';
import { isEmpty, isNil } from 'lodash';
import { useTranslation } from 'react-i18next';
import NextImage from 'next/image';
import type { UploadFile } from 'antd/lib';

import { MobileContext } from '@/components/Context';
import { UploadImage } from '@/components/UploadImage';
import { routes } from '@/routes';
import { getTryOnExampleImage } from '@/utilities/getTryOnExampleImage';
import { getTryOnInstructionKeyFromVtoType } from '@/utilities/isTryOnEnabledForGroupCode';
import { AiTryOnUserRatingEnum } from '@server/types/ai/enums/ai-try-on-user-rating.enum';
import { AiTryOnVtoTypeEnum } from '@server/types/ai/enums/ai-try-on-vto-type.enum';
import styles from '@/components/try-on/TryOnModal.module.scss';
import type { ItemInterface } from '@/types/item/Item';

interface TryOnModalProps {
  open: boolean;
  loading: boolean;
  resultImageSrc: string | null;
  error: string | null;
  rated: boolean;
  vtoType?: AiTryOnVtoTypeEnum | null;
  onClose: () => void;
  onSubmit: (userImageSrc: string) => Promise<void>;
  onRate: (rating: AiTryOnUserRatingEnum) => Promise<void>;
}

const exampleDisplayMaxWidth = 200;
const resultImageWidth = 360;
const resultImageHeight = Math.round(resultImageWidth * 1.3);
const imageBorderRadius = 7;

/**
 * Проверяет, полностью ли элемент виден во viewport
 * @param element - проверяемый DOM-элемент
 * @returns true, если элемент целиком в пределах экрана
 */
const isElementFullyVisible = (element: HTMLElement): boolean => {
  const { top, bottom, left, right, height, width } = element.getBoundingClientRect();

  if (height === 0 || width === 0) {
    return false;
  }

  return top >= 0
    && bottom <= window.innerHeight
    && left >= 0
    && right <= window.innerWidth;
};

/**
 * Прокручивает элемент в видимую область, если он обрезан
 * @param element - целевой DOM-элемент
 * @returns void
 */
const scrollIntoViewIfNeeded = (element: HTMLElement | null): void => {
  if (isNil(element) || isElementFullyVisible(element)) {
    return;
  }

  element.scrollIntoView({
    behavior: 'smooth',
    block: 'end',
    inline: 'nearest',
  });
};

/**
 * Планирует проверку видимости и скролл после отрисовки DOM
 * @param getElement - функция, возвращающая целевой элемент
 * @returns функция отмены запланированного кадра
 */
const scheduleScrollIntoViewIfNeeded = (getElement: () => HTMLElement | null): (() => void) => {
  const frameId = requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      scrollIntoViewIfNeeded(getElement());
    });
  });

  return () => {
    cancelAnimationFrame(frameId);
  };
};

/**
 * Модалка AI-примерки: инструкция, загрузка фото, результат и оценка
 * @param props - состояние примерки и колбэки
 * @returns JSX модалки
 */
export const TryOnModal = ({
  open,
  loading,
  resultImageSrc,
  error,
  rated,
  vtoType = null,
  onClose,
  onSubmit,
  onRate,
}: TryOnModalProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.tryOn' });
  const { isMobile } = useContext(MobileContext);

  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const errorTextRef = useRef<HTMLParagraphElement>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadedImages, setUploadedImages] = useState<ItemInterface['images']>([]);
  const [previewImage, setPreviewImage] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  const instructionKey = useMemo(() => getTryOnInstructionKeyFromVtoType(vtoType), [vtoType]);
  const exampleImage = useMemo(() => getTryOnExampleImage(instructionKey), [instructionKey]);
  const exampleImageLayout = useMemo(() => {
    if (isNil(exampleImage)) {
      return null;
    }

    const { width: intrinsicWidth, height: intrinsicHeight } = exampleImage;
    const displayWidth = Math.min(exampleDisplayMaxWidth, intrinsicWidth);
    const displayHeight = Math.round(displayWidth * (intrinsicHeight / intrinsicWidth));

    return {
      width: displayWidth,
      height: displayHeight,
    };
  }, [exampleImage]);
  const userImageSrc = uploadedImages[0]?.src;
  const hasUploadedPhoto = !isNil(userImageSrc) && !isEmpty(userImageSrc);
  const hasResult = !isNil(resultImageSrc) && !isEmpty(resultImageSrc);

  useEffect(() => {
    if (!open || !isMobile || isNil(userImageSrc) || isEmpty(userImageSrc)) {
      return undefined;
    }

    return scheduleScrollIntoViewIfNeeded(() => submitButtonRef.current);
  }, [open, isMobile, userImageSrc]);

  useEffect(() => {
    if (!open || !isMobile || loading || isNil(error) || isEmpty(error)) {
      return undefined;
    }

    return scheduleScrollIntoViewIfNeeded(() => errorTextRef.current);
  }, [open, isMobile, loading, error]);

  /**
   * Сбрасывает локальное состояние загрузки при закрытии
   * @returns void
   */
  const handleClose = () => {
    setFileList([]);
    setUploadedImages([]);
    setPreviewImage('');
    setPreviewOpen(false);
    onClose();
  };

  /**
   * Запускает генерацию по последнему загруженному фото
   * @returns void
   */
  const handleSubmit = async () => {
    if (!hasUploadedPhoto) {
      return;
    }
    await onSubmit(userImageSrc as string);
  };

  /**
   * Рендерит превью результата примерки с увеличением (Ant Design Image)
   * @returns JSX
   */
  const renderResultImage = () => (
    <div className={styles.resultImageWrap}>
      <AntImage
        src={resultImageSrc as string}
        alt={t('button')}
        width={resultImageWidth}
        height={resultImageHeight}
        className={styles.resultImage}
        style={{ objectFit: 'cover', borderRadius: imageBorderRadius }}
        preview={{ zIndex: 10001, maxScale: 5 }}
        classNames={{
          popup: {
            root: styles.resultPreviewPopup,
          },
        }}
        styles={{
          root: {
            width: resultImageWidth,
            height: resultImageHeight,
            borderRadius: imageBorderRadius,
            overflow: 'hidden',
          },
          image: {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: imageBorderRadius,
          },
          cover: {
            borderRadius: imageBorderRadius,
          },
          popup: {
            body: {
              borderRadius: imageBorderRadius,
              overflow: 'hidden',
            },
          },
        }}
      />
    </div>
  );

  /**
   * Рендерит форму загрузки: инструкция, пример, disclaimers, upload
   * @returns JSX
   */
  const renderUploadForm = () => (
    <>
      {!isNil(instructionKey) ? (
        <p className="mb-0">{t(`instructions.${instructionKey}`)}</p>
      ) : null}

      {!isNil(exampleImage) && !isNil(exampleImageLayout) ? (
        <div className={styles.exampleWrap}>
          <NextImage
            src={exampleImage}
            alt={t('exampleCaption')}
            width={exampleImageLayout.width}
            height={exampleImageLayout.height}
            className={styles.exampleImage}
            sizes={`${exampleImageLayout.width}px`}
            style={{ objectFit: 'contain' }}
          />
          <p className={styles.exampleCaption}>{t('exampleCaption')}</p>
        </div>
      ) : null}

      <ul className="mb-0 ps-3 small text-muted">
        <li>{t('uploadDisclaimer.privacy')}</li>
        <li>{t('uploadDisclaimer.resultStorage')}</li>
        <li>{t('uploadDisclaimer.noGuarantee')}</li>
      </ul>

      <div className={styles.uploadWrap}>
        <UploadImage
          crop
          preview
          withoutAuth
          maxCount={1}
          cropModalProps={{ zIndex: 10001 }}
          previewZIndex={10001}
          uploadAction={routes.integration.tryOn.upload}
          uploadButtonClassName={styles.uploadTrigger}
          filelist={fileList}
          setFileList={setFileList}
          setCommentImages={setUploadedImages}
          previewImage={previewImage}
          previewOpen={previewOpen}
          setPreviewImage={setPreviewImage}
          setPreviewOpen={setPreviewOpen}
        />
      </div>

      {hasUploadedPhoto ? (
        <button
          ref={submitButtonRef}
          type="button"
          className={styles.submitButton}
          disabled={loading}
          onClick={handleSubmit}
        >
          {t('button')}
        </button>
      ) : null}

      {!isNil(error) && !isEmpty(error) ? (
        <p ref={errorTextRef} className={styles.errorText}>{error}</p>
      ) : null}
    </>
  );

  /**
   * Рендерит экран результата с оценкой
   * @returns JSX
   */
  const renderResultScreen = () => (
    <div className={styles.resultWrap}>
      {renderResultImage()}
      <p className="small text-muted text-center mb-0">{t('resultDisclaimer')}</p>
      {rated ? (
        <p className="mb-0">{t('rating.thanks')}</p>
      ) : (
        <div className="d-flex flex-column align-items-center gap-2">
          <span>{t('rating.prompt')}</span>
          <div className={styles.ratingActions}>
            <button
              type="button"
              className={styles.ratingButton}
              onClick={() => onRate(AiTryOnUserRatingEnum.GOOD)}
              aria-label={AiTryOnUserRatingEnum.GOOD}
            >
              <LikeOutlined />
            </button>
            <button
              type="button"
              className={`${styles.ratingButton} ${styles.ratingButtonNegative}`}
              onClick={() => onRate(AiTryOnUserRatingEnum.BAD)}
              aria-label={AiTryOnUserRatingEnum.BAD}
            >
              <DislikeOutlined />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      centered
      destroyOnHidden
      zIndex={10000}
      width={520}
    >
      <div className="d-flex flex-column gap-3">
        {loading ? (
          <div className={styles.loadingWrap}>
            <Spin size="large" />
            <p className={styles.loadingText} aria-live="polite">
              <span className={styles.loadingTextShimmer}>{t('loading')}</span>
            </p>
          </div>
        ) : hasResult ? (
          renderResultScreen()
        ) : (
          renderUploadForm()
        )}
      </div>
    </Modal>
  );
};
