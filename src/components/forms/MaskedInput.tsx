import { MaskedInput as Input } from 'antd-mask-input';
import { Form, type GetRef } from 'antd';
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import type { MaskedInputProps } from 'antd-mask-input/build/main/lib/MaskedInput';

export const MaskedInput = forwardRef<any, MaskedInputProps>((props, forwardedRef) => {
  const { status } = Form.Item.useStatus();

  const ref = useRef<GetRef<typeof Input>>(null);

  useImperativeHandle(forwardedRef, () => ref.current, []);

  useEffect(() => {
    if (ref.current) {
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
});

MaskedInput.displayName = 'MaskedInput';
