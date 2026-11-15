// 轻量 DOM 组件

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else e.setAttribute(k, v);
  }
  for (const c of children) e.append(typeof c === 'string' ? document.createTextNode(c) : c);
  return e;
}

export interface SliderOpts {
  label: string;
  min: number; max: number; step: number;
  value: number;
  unit?: string;
  format?: (v: number) => string;
  onInput: (v: number) => void;
}

export function sliderRow(o: SliderOpts): HTMLElement {
  const val = el('span', { class: 'row-val' });
  const show = () => { val.textContent = (o.format ? o.format(o.value) : o.value.toFixed(2)) + (o.unit ?? ''); };
  show();
  const input = el('input', { type: 'range', min: String(o.min), max: String(o.max), step: String(o.step), value: String(o.value) });
  input.addEventListener('input', () => {
    o.value = parseFloat(input.value);
    show();
    o.onInput(o.value);
  });
  return el('div', { class: 'ctrl-row' }, [
    el('label', {}, [o.label]),
    input,
    val,
  ]);
}

export function colorRow(label: string, value: string, onInput: (v: string) => void): HTMLElement {
  const input = el('input', { type: 'color', value });
  input.addEventListener('input', () => onInput(input.value));
  return el('div', { class: 'ctrl-row' }, [el('label', {}, [label]), input]);
}

export function selectRow(label: string, options: [string, string][], value: string, onChange: (v: string) => void): HTMLElement {
  const sel = el('select');
  for (const [v, t] of options) {
    const opt = el('option', { value: v }, [t]);
    if (v === value) opt.selected = true;
    sel.append(opt);
  }
  sel.addEventListener('change', () => onChange(sel.value));
  return el('div', { class: 'ctrl-row' }, [el('label', {}, [label]), sel]);
}

export function checkRow(label: string, value: boolean, onChange: (v: boolean) => void): HTMLElement {
  const input = el('input', { type: 'checkbox' });
  input.checked = value;
  input.addEventListener('change', () => onChange(input.checked));
  return el('div', { class: 'ctrl-row' }, [el('label', {}, [label]), input]);
}

export function numberRow(label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void): HTMLElement {
  const input = el('input', { type: 'number', min: String(min), max: String(max), step: String(step), value: String(value) });
  input.addEventListener('change', () => {
    const v = parseFloat(input.value);
    if (isFinite(v)) onChange(Math.min(max, Math.max(min, v)));
  });
  return el('div', { class: 'ctrl-row' }, [el('label', {}, [label]), input]);
}

export function textRow(label: string, value: string, onChange: (v: string) => void): HTMLElement {
  const input = el('input', { type: 'text', value });
  input.addEventListener('change', () => onChange(input.value.trim() || value));
  return el('div', { class: 'ctrl-row' }, [el('label', {}, [label]), input]);
}

export function button(label: string, onClick: () => void, cls = ''): HTMLButtonElement {
  const b = el('button', { class: `btn ${cls}` }, [label]);
  b.addEventListener('click', onClick);
  return b;
}

export function confirmDialog(message: string): Promise<boolean> {
  return new Promise(resolve => {
    const overlay = el('div', { class: 'modal-overlay' });
    const box = el('div', { class: 'modal' }, [
      el('p', {}, [message]),
      el('div', { class: 'modal-btns' }, [
        button('取消', () => { overlay.remove(); resolve(false); }),
        button('确定', () => { overlay.remove(); resolve(true); }, 'danger'),
      ]),
    ]);
    overlay.append(box);
    overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.remove(); resolve(false); } });
    document.body.append(overlay);
  });
}

export function toast(msg: string): void {
  const t = el('div', { class: 'toast' }, [msg]);
  document.body.append(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2200);
}
