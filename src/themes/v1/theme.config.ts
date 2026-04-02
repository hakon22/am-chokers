import type { ThemeConfig } from 'antd';

export const v1Theme: ThemeConfig = {
  token: {
    colorPrimary: '#2b3c5f',
    colorBgBase: '#f7f9fc',
    colorLink: '#2b3c5f',
    colorLinkHover: '#4d689e',
    borderRadius: 4,
  },
  components: {
    Button: {
      colorPrimary: '#2b3c5f',
      colorPrimaryHover: '#4d689e',
      colorPrimaryActive: '#1c273e',
    },
    Menu: {
      itemSelectedColor: '#391897',
      itemHoverColor: '#2e1377',
    },
    Select: {
      hoverBorderColor: '#4d689e',
      activeBorderColor: '#2b3c5f',
    },
    Input: {
      hoverBorderColor: '#2b3c5f',
      activeBorderColor: '#4d689e',
    },
  },
};
