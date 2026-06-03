import type { ThemeConfig } from 'antd';

export const v1Theme: ThemeConfig = {
  token: {
    colorPrimary: '#2b3c5f',
    colorBgBase: '#f7f9fc',
    colorLink: '#2b3c5f',
    colorLinkHover: '#4d689e',
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
    Segmented: {
      trackBg: '#EAEEF6',
      trackPadding: 4,
      itemColor: '#69788E',
      itemHoverColor: '#2B3C5F',
      itemHoverBg: 'rgba(43, 60, 95, 0.06)',
      itemSelectedBg: '#FFFFFF',
      itemSelectedColor: '#2B3C5F',
      borderRadius: 10,
      controlHeight: 36,
    },
    Radio: {
      buttonSolidCheckedBg: '#2B3C5F',
      buttonSolidCheckedColor: '#FFFFFF',
      buttonSolidCheckedHoverBg: '#3B5382',
      buttonSolidCheckedActiveBg: '#1c273e',
      buttonColor: '#69788E',
      buttonPaddingInline: 16,
    },
    DatePicker: {
      cellActiveWithRangeBg: '#EAEEF6',
      cellHoverWithRangeBg: '#D8DFEB',
      cellRangeBorderColor: '#CED3DD',
      cellHoverBg: '#F9FAFC',
    },
  },
};
