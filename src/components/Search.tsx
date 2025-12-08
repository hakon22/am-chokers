import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { AutoComplete, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import Image from 'next/image';

import { routes } from '@/routes';
import { NotFoundContent } from '@/components/NotFoundContent';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { Spinner } from '@/components/Spinner';
import { onFocus } from '@/utilities/onFocus';
import type { ItemInterface } from '@/types/item/Item';
import type { ImageEntity } from '@server/db/entities/image.entity';

export type List = { id: number; name: string; image: ImageEntity; }[];

interface SearchPropsInterface {
  items?: ItemInterface[];
  search?: { value: string; onFetch: boolean; };
  withDeleted?: boolean;
  setSearch: React.Dispatch<React.SetStateAction<{ value: string; onFetch: boolean; } | undefined>>;
  fetch: () => Promise<void>;
}

export const Search = ({ search, setSearch, fetch, withDeleted = false }: SearchPropsInterface) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.search' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const [list, setList] = useState<List>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | undefined>();

  const clearData = (hasFocus = true) => {
    setSearch(undefined);
    setList([]);
    if (hasFocus) {
      setTimeout(onFocus, 1);
    }
  };

  const onInput = async (value: string) => {
    try {
      setSearch({ value, onFetch: false });
      if (timer) {
        clearTimeout(timer);
      }
      if (!value) {
        clearData(false);
        return;
      }
      const timeout = setTimeout(async () => {
        setIsLoading(true);
        const { data } = await axios.get<{ code: number; search: List; }>(routes.item.search, {
          params: {
            search: value,
            withDeleted,
          },
        });
        if (data.code === 1) {
          setList(data.search);
        }
        setTimer(undefined);
        setIsLoading(false);
      }, 500);
      setTimer(timeout);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsLoading);
    }
  };

  const options = (d: List) => d.map(({ name, image }) => ({
    label: (<Button
      className="w-100 h-100 py-0 ps-0 pe-5 d-flex justify-content-between align-items-center"
      title={name}
      onClick={() => {
        setSearch({ value: name, onFetch: true });
        onFocus();
      }}
    >
      {image.src.endsWith('.mp4')
        ? <video src={image.src} width={60} height={60} style={{ borderRadius: '5px' }} autoPlay loop muted playsInline />
        : <Image alt={name} width={60} height={60} unoptimized src={image.src} />
      }
      <span className="fs-6 text-wrap">{name}</span>
    </Button>),
  }));

  return (
    <AutoComplete
      value={search?.value}
      className="d-flex col-xl-4"
      classNames={{
        content: 'custom-placeholder not-padding fs-6',
        placeholder: 'custom-placeholder not-padding fs-6',
      }}
      placeholder={t('title')}
      notFoundContent={search && !isLoading ? <NotFoundContent /> : search && <Spinner isLoaded />}
      allowClear
      suffixIcon={<SearchOutlined />}
      onClear={clearData}
      options={options(list)}
      onChange={onInput}
      onInputKeyDown={({ key }) => {
        if (key === 'Enter') {
          fetch();
          onFocus();
        }
      }}
    />
  );
};
