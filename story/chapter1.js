import d00 from './ch1/d00-03.js';
import d04 from './ch1/d04-07.js';
import d08 from './ch1/d08-11.js';
import d12 from './ch1/d12-14.js';

const scenes = [...d00, ...d04, ...d08, ...d12];

export const chapter1 = {
  id: 'ch1',
  title: '第一章 · 四楼的灯',
  scenes,
  lastDay: Math.max(...scenes.map(s => s.day))
};
