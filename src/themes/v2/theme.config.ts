import type { ThemeConfig } from 'antd';

export const v2Theme: ThemeConfig = {
  token: {
    colorPrimary: '#2B3C5F',
    colorPrimaryHover: '#3B5382',
    colorBgBase: '#F9FAFC',
    colorBgContainer: '#FFFFFF',
    colorBgElevated: '#FFFFFF',
    colorText: '#363B44',
    colorTextSecondary: '#69788E',
    colorBorder: '#CED3DD',
    colorBorderSecondary: '#EAEEF6',
    fontFamily: 'Inter, sans-serif',
    borderRadius: 6,
    colorLink: '#2B3C5F',
    colorLinkHover: '#3B5382',
    colorError: '#e05c5c',
    colorSuccess: '#4caf7d',
  },
  components: {
    Button: {
      colorPrimary: '#2B3C5F',
      colorPrimaryHover: '#3B5382',
      colorPrimaryActive: '#1c273e',
      defaultBorderColor: '#CED3DD',
      defaultColor: '#363B44',
    },
    Menu: {
      itemColor: '#69788E',
      itemSelectedColor: '#2B3C5F',
      itemSelectedBg: '#EAEEF6',
      itemHoverColor: '#2B3C5F',
      itemHoverBg: '#F9FAFC',
      horizontalItemSelectedColor: '#2B3C5F',
      horizontalItemHoverColor: '#3B5382',
    },
    Input: {
      colorBgContainer: '#FFFFFF',
      colorBorder: '#CED3DD',
      hoverBorderColor: '#2B3C5F',
      activeBorderColor: '#2B3C5F',
      colorText: '#363B44',
    },
    Card: {
      colorBgContainer: '#FFFFFF',
      colorBorderSecondary: '#CED3DD',
    },
    Select: {
      colorBgContainer: '#FFFFFF',
      colorBorder: '#CED3DD',
      optionSelectedBg: '#EAEEF6',
      optionSelectedColor: '#2B3C5F',
    },
    Badge: {
      colorBgContainer: '#2B3C5F',
    },
    Drawer: {
      colorBgElevated: '#FFFFFF',
    },
    Modal: {
      contentBg: '#FFFFFF',
      headerBg: '#FFFFFF',
    },
    Table: {
      colorBgContainer: '#FFFFFF',
      headerBg: '#F9FAFC',
      rowHoverBg: '#EAEEF6',
    },
    Descriptions: {
      colorBgContainer: '#FFFFFF',
    },
    Skeleton: {
      gradientFromColor: '#EAEEF6',
      gradientToColor: '#F9FAFC',
    },
    FloatButton: {
      borderRadiusLG: 999,
    },
    Segmented: {
      trackBg: '#EAEEF6',
      trackPadding: 4,
      itemColor: '#69788E',
      itemHoverColor: '#2B3C5F',
      itemHoverBg: 'rgba(43, 60, 95, 0.06)',
      itemSelectedBg: '#2B3C5F',
      itemSelectedColor: '#FFFFFF',
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
