import { MaskedInput as Input } from 'antd-mask-input';
import { Form, type GetRef } from 'antd';
import { useEffect, useRef } from 'react';
import type { MaskedInputProps } from 'antd-mask-input/build/main/lib/MaskedInput';

export const MaskedInput = (props: MaskedInputProps) => {
  const { status } = Form.Item.useStatus();

  const ref = useRef<GetRef<typeof Input>>(null);

  useEffect(() => {
    if (ref?.current) {
      ref.current.focus();
      ref.current.blur();
    }
  }, []);

  return (
    <Input
      status={status === 'error' ? 'error' : ''}
      ref={ref}
      maskOptions={{
        placeholderChar: '  ',
        lazy: true,
      }}
      {...props}
    />
  );
};
