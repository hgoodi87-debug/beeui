import { ko } from './translations_split/ko';
import { en } from './translations_split/en';
import { zh } from './translations_split/zh';
import { zhHK } from './translations_split/zh-HK';
import { zhTW } from './translations_split/zh-TW';
import { ja } from './translations_split/ja';

export const translations: Record<string, any> = {
  ko,
  en,
  'zh': zh,
  'zh-CN': zh,
  'zh-HK': zhHK,
  'zh-TW': zhTW,
  ja
};
