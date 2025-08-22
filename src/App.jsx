import React, { useMemo, useState, useEffect } from 'react'

export default function App() {
  return (
    <main className='min-h-screen bg-white text-neutral-900 font-sans antialiased'>
      <Header />
      <div className='mx-auto w-full max-w-md px-4 pb-24'>
        <Section title='Calcolo rapido' subtitle='Scrivi un’operazione (es. =70*100 o (12,5+7)*3).'>
          <QuickCalc />
        </Section>
        <Section title='Calcolo prestazione' subtitle='Costo orario × Ore × Consulenti'>
          <PerformanceCalc />
        </Section>
        <Section title='IVA (Italia)' subtitle="Aggiungi o scorpora l'IVA con aliquota personalizzabile.">
          <VatCard />
        </Section>
        <Section title='Cambio EUR ⇄ USD' subtitle='Converti importi con un tasso impostabile (aggiornabile).'>
          <FxCard />
        </Section>
        <Section title='Strumenti veloci' subtitle='Operazioni percentuali comuni.'>
          <QuickPercentTools />
        </Section>
      </div>
      <Footer />
    </main>
  )
}

function Header() {
  return (
    <header className='sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/95 border-b border-neutral-200'>
      <div className='mx-auto max-w-md px-4 py-4'>
        <h1 className='text-2xl font-medium tracking-tight'>Calcolatrice Finanziaria</h1>
        <p className='text-sm text-neutral-600 dark:text-neutral-300'>Elegante. Minimal. Mobile-first.</p>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className='fixed bottom-0 left-0 right-0 border-t border-neutral-200 bg-white/95 backdrop-blur'>
      <div className='mx-auto max-w-md px-4 py-3 text-center text-xs text-neutral-600 dark:text-neutral-300'>
        Prototipo – Usa con cautela. Controlla sempre i risultati.
      </div>
    </footer>
  )
}

function Section({ title, subtitle, children }) {
  return (
    <section className='py-6'>
      <h2 className='text-xl font-medium tracking-tight'>{title}</h2>
      {subtitle && <p className='mt-1 text-sm text-neutral-600 dark:text-neutral-300'>{subtitle}</p>}
      <div className='mt-4 space-y-4'>{children}</div>
    </section>
  )
}


// Quick Calc — expression input
function QuickCalc() {
  const dispatchVATAmount = (val) => {
    if (!isFinite(val) || val <= 0) return;
    window.dispatchEvent(new CustomEvent('set-vat-amount', { detail: { amount: roundMoney(val), mode: 'add' } }))
  }
  const [expr, setExpr] = React.useState('')
  const [error, setError] = React.useState(null)
  const [history, setHistory] = React.useState([])

  const cleanExpr = expr.trim().replace(/^=/, '').replace(/,/g, '.')

  const result = React.useMemo(() => {
    if (!cleanExpr) { setError(null); return '' }
    try {
      const val = evaluateExpression(cleanExpr)
      setError(null)
      if (!isFinite(val)) return '–'
      return formatNumber(val)
    } catch (e) {
      setError('Espressione non valida')
      return ''
    }
  }, [cleanExpr])

  return (
    <Card>
      <LabeledInput
        id='qc-expr'
        label='Operazione'
        value={expr}
        onChange={setExpr}
        onKeyDown={(e)=>{ if(e.key==='Enter' && cleanExpr && !error){ setHistory((h)=>[{ expr: expr.trim() || cleanExpr, result }, ...h].slice(0,10)); } }}
        inputMode='decimal'
        placeholder='=70*100'
        hint='Supportati: + − × ÷ ( ) . ,  — Usa = opzionale. Invio per salvare.'
      />
      <div className='mt-3 grid grid-cols-2 gap-3'>
        <KPI label='Risultato' value={result || '–'} />
        <div className='self-center'>
          {error && <Small muted={false}>{error}</Small>}
          {!error && cleanExpr && <Small>Calcolo aggiornato in tempo reale</Small>}
        </div>
      </div>
      <div className='mt-3'>
        <button onClick={() => dispatchVATAmount(parseLocaleNumber((expr.trim().replace(/^=/,''))).toString() ? evaluateExpression(cleanExpr) : NaN)} className='w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm font-medium'>Usa come imponibile IVA</button>
      </div>
    </Card>
  )
}

function PerformanceCalc() {
  const [costo, setCosto] = React.useState('70')
  const [ore, setOre] = React.useState('1')
  const [cons, setCons] = React.useState('1')

  const c = Math.max(0, parseLocaleNumber(costo))
  const h = Math.max(0, parseLocaleNumber(ore))
  const n = Math.max(0, parseLocaleNumber(cons))

  const imponibile = React.useMemo(() => roundMoney(c * h * n), [c,h,n])

  const push = () => {
    if (isFinite(imponibile) && imponibile > 0) {
      window.dispatchEvent(new CustomEvent('set-vat-amount', { detail: { amount: imponibile, mode: 'add' } }))
    }
  }

  return (
    <Card>
      <div className='grid grid-cols-1 gap-4'>
        <LabeledInput id='pc-costo' label='Costo orario' value={costo} onChange={setCosto} inputMode='decimal' placeholder='70' />
        <div className='grid grid-cols-2 gap-4'>
          <LabeledInput id='pc-ore' label='Ore' value={ore} onChange={setOre} inputMode='decimal' placeholder='1' />
          <LabeledInput id='pc-cons' label='Consulenti' value={cons} onChange={setCons} inputMode='decimal' placeholder='1' />
        </div>
        <div className='grid grid-cols-2 gap-3'>
          <KPI label='Imponibile' value={formatEUR(imponibile)} />
          <div className='self-center text-right'>
            <button onClick={push} className='rounded-xl border border-neutral-300 px-4 py-3 text-sm font-medium'>Usa come imponibile IVA</button>
          </div>
        </div>
      </div>
    </Card>
  )
}

// VAT Card
function PresetAliquote({ current, onPick }) {
  const presets = [4,5,10,22]
  return (
    <div className='flex gap-2 flex-wrap'>
      {presets.map(p => (
        <button key={p} onClick={()=> onPick(String(p))}
          className={'px-3 py-1.5 text-sm rounded-lg border ' + (String(current)===String(p) ? 'border-neutral-900' : 'border-neutral-200 hover:bg-neutral-50') }
          aria-pressed={String(current)===String(p)}>
          {p}%
        </button>
      ))}
    </div>
  )
}

function VatCard() {
  useEffect(() => {
    const handler = (e) => {
      const { amount, mode } = e.detail || {}
      if (mode) setMode(mode)
      if (isFinite(amount)) setAmount(formatNumber(amount))
    }
    window.addEventListener('set-vat-amount', handler)
    return () => window.removeEventListener('set-vat-amount', handler)
  }, [])
  const [mode, setMode] = useState('add')
  const [rate, setRate] = useState('22')
  const [amount, setAmount] = useState('')

  const parsedRate = clampNumber(parseLocaleNumber(rate), 0, 100)
  const parsedAmount = Math.max(0, parseLocaleNumber(amount))

  const { netto, iva, lordo } = useMemo(() => {
    const r = isFinite(parsedRate) ? parsedRate / 100 : 0
    const a = isFinite(parsedAmount) ? parsedAmount : 0
    if (mode === 'add') {
      const l = roundMoney(a * (1 + r))
      const i = roundMoney(l - a)
      return { netto: a, iva: i, lordo: l }
    } else {
      const n = r === 0 ? a : roundMoney(a / (1 + r))
      const i = roundMoney(a - n)
      return { netto: n, iva: i, lordo: a }
    }
  }, [mode, parsedRate, parsedAmount])

  return (
    <Card>
      <ToggleGroup
        value={mode}
        onChange={setMode}
        options={[{ value: 'add', label: 'Aggiungi IVA' },{ value: 'remove', label: 'Scorpora IVA' }]}
      />
      <div className='grid grid-cols-1 gap-4'>
        <LabeledInput id='vat-rate' label='Aliquota IVA (%)' value={rate} onChange={setRate} inputMode='decimal' placeholder='22' />
        <PresetAliquote current={rate} onPick={setRate} />
        <LabeledInput id='vat-amount' label={mode === 'add' ? 'Imponibile (netto)' : 'Importo lordo'} value={amount} onChange={setAmount} inputMode='decimal' placeholder='0,00' />
        <div className='grid grid-cols-3 gap-3'>
          <KPI label='Netto' value={formatEUR(netto)} />
          <KPI label='IVA' value={formatEUR(iva)} />
          <KPI label='Lordo' value={formatEUR(lordo)} />
        </div>
      </div>
      <div className='mt-3'>
        <button onClick={() => dispatchVATAmount(parseLocaleNumber((expr.trim().replace(/^=/,''))).toString() ? evaluateExpression(cleanExpr) : NaN)} className='w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm font-medium'>Usa come imponibile IVA</button>
      </div>
    </Card>
  )
}

// FX Card
function FxCard() {
  const [rate, setRate] = useState('1.1000')
  const [eur, setEur] = useState('')
  const [usd, setUsd] = useState('')
  const [side, setSide] = useState('eur')

  const r = parseLocaleNumber(rate)
  const validRate = isFinite(r) && r > 0 ? r : 0

  const eurValue = Math.max(0, parseLocaleNumber(eur))
  const usdValue = Math.max(0, parseLocaleNumber(usd))

  const computed = useMemo(() => {
    if (!validRate) return { eurOut: 0, usdOut: 0 }
    if (side === 'eur') {
      return { eurOut: eurValue, usdOut: roundMoney(eurValue * validRate) }
    } else {
      return { usdOut: usdValue, eurOut: roundMoney(usdValue / validRate) }
    }
  }, [validRate, eurValue, usdValue, side])

  return (
    <Card>
      <LabeledInput id='fx-rate' label='Tasso EUR→USD' value={rate} onChange={(v) => setRate(v)} inputMode='decimal' placeholder='1,1000' />
      <div className='grid grid-cols-1 gap-4 mt-2'>
        <LabeledInput id='fx-eur' label='Euro (EUR)' value={side === 'eur' ? eur : formatNumber(computed.eurOut)} onChange={(v) => { setSide('eur'); setEur(v) }} inputMode='decimal' placeholder='0,00' />
        <LabeledInput id='fx-usd' label='Dollari (USD)' value={side === 'usd' ? usd : formatNumber(computed.usdOut)} onChange={(v) => { setSide('usd'); setUsd(v) }} inputMode='decimal' placeholder='0.00' />
      </div>
      <Small muted={!validRate}>{validRate ? `Inverti con 1 / ${formatNumber(validRate)}` : 'Inserisci un tasso valido (> 0).'}</Small>
    </Card>
  )
}

// Quick Percent Tools
function QuickPercentTools() {
  const [amount, setAmount] = useState('')
  const [pct, setPct] = useState('10')
  const a = Math.max(0, parseLocaleNumber(amount))
  const p = clampNumber(parseLocaleNumber(pct), -1000, 1000)

  const add = roundMoney(a * (1 + (p/100)))
  const sub = roundMoney(a * (1 - (p/100)))
  const diff = roundMoney(add - a)

  return (
    <Card>
      <div className='grid grid-cols-1 gap-4'>
        <LabeledInput id='qp-amount' label='Importo di base' value={amount} onChange={setAmount} inputMode='decimal' placeholder='0,00' />
        <LabeledInput id='qp-pct' label='Percentuale (%)' value={pct} onChange={setPct} inputMode='decimal' placeholder='10' />
        <div className='grid grid-cols-3 gap-3'>
          <KPI label={`+${p}%`} value={formatEUR(add)} />
          <KPI label={`−${p}%`} value={formatEUR(sub)} />
          <KPI label={'Differenza'} value={formatEUR(diff)} />
        </div>
      </div>
      <div className='mt-3'>
        <button onClick={() => dispatchVATAmount(parseLocaleNumber((expr.trim().replace(/^=/,''))).toString() ? evaluateExpression(cleanExpr) : NaN)} className='w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm font-medium'>Usa come imponibile IVA</button>
      </div>
    </Card>
  )
}

// UI Components
function Card({ children }) {return (<div className='rounded-2xl border border-neutral-200 bg-white shadow-sm p-4 sm:p-5'>{children}</div>)}
function ToggleGroup({ value, onChange, options }) {
  return (<div className='inline-grid grid-cols-2 rounded-xl border border-neutral-200 p-1 bg-neutral-50'>
    {options.map((opt) => {const active = value === opt.value; return (
      <button key={opt.value} onClick={() => onChange(opt.value)} className={'px-4 py-2 text-sm font-medium rounded-lg transition ' + (active ? 'bg-white shadow-sm border border-neutral-200' : 'text-neutral-600 dark:text-neutral-300')} aria-pressed={active}>{opt.label}</button>)})}
  </div>)}
function LabeledInput({ id, label, value, onChange, placeholder, hint, inputMode = 'decimal' }) {
  return (<div>
    <label htmlFor={id} className='block text-sm text-neutral-700 mb-1'>{label}</label>
    <input id={id} className='w-full text-2xl leading-tight tracking-tight px-4 py-3 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-4 focus:ring-neutral-200 focus:border-neutral-400 placeholder-neutral-400' value={value} onChange={(e) => onChange(e.target.value)} inputMode={inputMode} placeholder={placeholder} autoComplete='off' />
    {hint && <Small>{hint}</Small>}
  </div>)}
function KPI({ label, value }) {return (<div className='rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-center'><div className='text-xs text-neutral-600 dark:text-neutral-300'>{label}</div><div className='mt-1 text-lg font-medium tabular-nums'>{value}</div></div>)}
function Small({ children, muted }) {return (<p className={'mt-2 text-xs ' + (muted ? 'text-neutral-400' : 'text-neutral-600 dark:text-neutral-300')}>{children}</p>)}

// Utils
function parseLocaleNumber(input) {if (input == null) return NaN;if (typeof input === 'number') return input;const s = String(input).trim().replace(/\s+/g, '');if (!s) return NaN;const lastComma = s.lastIndexOf(',');const lastDot = s.lastIndexOf('.');let normalized = s.replace(/[^0-9,\.\-]/g, '');if (lastComma > lastDot) {normalized = normalized.replace(/\./g, '').replace(',', '.')} else if (lastDot > lastComma) {normalized = normalized.replace(/,/g, '')} else {normalized = normalized.replace(',', '.')}return Number(normalized)}
function clampNumber(n, min, max) {if (!isFinite(n)) return min;return Math.min(Math.max(n, min), max)}
function roundMoney(n) {return Math.round((n + Number.EPSILON) * 100) / 100}
const eurFmt = typeof Intl !== 'undefined' ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }) : null
const numFmt = typeof Intl !== 'undefined' ? new Intl.NumberFormat('it-IT', { maximumFractionDigits: 4 }) : null
function formatEUR(n) {if (!isFinite(n)) return '–';return eurFmt ? eurFmt.format(n) : `€ ${n.toFixed(2)}`}
function formatNumber(n) {if (!isFinite(n)) return '';return numFmt ? numFmt.format(n) : String(n)}


// — Expression evaluator (shunting-yard) — supports + - * / and parentheses
function evaluateExpression(input) {
  const tokens = tokenize(input)
  const rpn = toRPN(tokens)
  return evalRPN(rpn)
}

function tokenize(s) {
  const tokens = []
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (c === ' ') { i++; continue }
    if ('+-*/()'.includes(c)) {
      // handle unary minus
      if (c === '-' && (tokens.length === 0 || (tokens[tokens.length-1].type !== 'number' && tokens[tokens.length-1].value !== ')'))) {
        // unary minus -> treat as 0 - x
        tokens.push({ type:'number', value: 0 })
        tokens.push({ type:'op', value:'-' })
        i++; continue
      }
      tokens.push({ type: c === '(' || c === ')' ? 'paren' : 'op', value: c })
      i++; continue
    }
    // number: digits with optional decimal point
    if (/[0-9.]/.test(c)) {
      let j = i
      while (j < s.length && /[0-9.]/.test(s[j])) j++
      const num = Number(s.slice(i, j))
      if (!isFinite(num)) throw new Error('bad number')
      tokens.push({ type:'number', value: num })
      i = j; continue
    }
    // Unicode operators × ÷
    if (c === '×') { tokens.push({ type:'op', value:'*' }); i++; continue }
    if (c === '÷') { tokens.push({ type:'op', value:'/' }); i++; continue }
    throw new Error('bad token')
  }
  return tokens
}

function toRPN(tokens) {
  const out = []
  const ops = []
  const prec = { '+':1, '-':1, '*':2, '/':2 }
  for (const t of tokens) {
    if (t.type === 'number') out.push(t)
    else if (t.type === 'op') {
      while (ops.length) {
        const top = ops[ops.length-1]
        if (top.type === 'op' && prec[top.value] >= prec[t.value]) out.push(ops.pop()); else break
      }
      ops.push(t)
    } else if (t.type === 'paren' && t.value === '(') {
      ops.push(t)
    } else if (t.type === 'paren' && t.value === ')') {
      while (ops.length && !(ops[ops.length-1].type === 'paren' && ops[ops.length-1].value === '(')) {
        out.push(ops.pop())
      }
      if (!ops.length) throw new Error('mismatched parens')
      ops.pop()
    }
  }
  while (ops.length) {
    const top = ops.pop()
    if (top.type === 'paren') throw new Error('mismatched parens')
    out.push(top)
  }
  return out
}

function evalRPN(rpn) {
  const st = []
  for (const t of rpn) {
    if (t.type === 'number') st.push(t.value)
    else if (t.type === 'op') {
      const b = st.pop(); const a = st.pop()
      if (a === undefined || b === undefined) throw new Error('bad expr')
      switch (t.value) {
        case '+': st.push(a + b); break
        case '-': st.push(a - b); break
        case '*': st.push(a * b); break
        case '/': st.push(a / b); break
        default: throw new Error('bad op')
      }
    }
  }
  if (st.length !== 1) throw new Error('bad expr')
  return st[0]
}
