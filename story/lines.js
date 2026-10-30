// Shorthands for writing scripts.
const say = who => (face, text, extra = {}) =>
  (text === undefined ? { say: who, face: 'normal', text: face, ...extra } : { say: who, face, text, ...extra });

export const che = say('ache');
export const man = say('xiaoman');
export const zhou = say('laozhou');
export const nico = say('nico');
export const cat = text => ({ say: 'cat', face: 'normal', text: text || '喵。' });
export const me = text => ({ say: 'me', face: 'normal', text });
export const t = text => ({ text });
export const note = (from, text) => ({ note: from, text });
export const bg = (bg, time, weather) => ({ bg, time, weather });
export const show = (...ids) => ({ show: ids });
export const choice = (...options) => ({ choice: options });
export const opt = (text, then = [], effects = {}) => ({ text, then, ...effects });
export const when = (cond, then, otherwise) => ({ if: cond, then, else: otherwise });
