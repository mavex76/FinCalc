import React, { useMemo, useState } from 'react'

export default function App() {
  return (
    <main className='min-h-screen bg-white text-neutral-900 font-sans antialiased'>
      <Header />
      <div className='mx-auto w-full max-w-md px-4 pb-24'>
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
        <p className='text-sm text-neutral-600'>Elegante. Minimal. Mobile-first.</p>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className='fixed bottom-0 left-0 right-0 border-t border-neutral-200 bg-white/95 backdrop-blur'>
      <div className='mx-auto max-w-md px-4 py-3 text-center text-xs text-neutral-600'>
        Prototipo – Usa con cautela. Controlla sempre i risultati.
      </div>
    </footer>
  )
}

function Section({ title, subtitle, children }) {
  return (
    <section className='py-6'>
      <h2 className='text-xl font-medium tracking-tight'>{title}</h2>
      {subtitle && <p className='mt-1 text-sm text-neutral-600'>{subtitle}</p>}
      <div className='mt-4 space-y-4'>{children}</div>
    </section>
  )
}

// VAT Card
function VatCard() {
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
        <LabeledInput id='vat-amount' label={mode === 'add' ? 'Imponibile (netto)' : 'Importo lordo'} value={amount} onChange={setAmount} inputMode='decimal' placeholder='0,00' />
        <div className='grid grid-cols-3 gap-3'>
          <KPI label='Netto' value={formatEUR(netto)} />
          <KPI label='IVA' value={formatEUR(iva)} />
          <KPI label='Lordo' value={formatEUR(lordo)} />
        </div>
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
    </Card>
  )
}

// UI Components
function Card({ children }) {return (<div className='rounded-2xl border border-neutral-200 bg-white shadow-sm p-4 sm:p-5'>{children}</div>)}
function ToggleGroup({ value, onChange, options }) {
  return (<div className='inline-grid grid-cols-2 rounded-xl border border-neutral-200 p-1 bg-neutral-50'>
    {options.map((opt) => {const active = value === opt.value; return (
      <button key={opt.value} onClick={() => onChange(opt.value)} className={'px-4 py-2 text-sm font-medium rounded-lg transition ' + (active ? 'bg-white shadow-sm border border-neutral-200' : 'text-neutral-600')} aria-pressed={active}>{opt.label}</button>)})}
  </div>)}
function LabeledInput({ id, label, value, onChange, placeholder, hint, inputMode = 'decimal' }) {
  return (<div>
    <label htmlFor={id} className='block text-sm text-neutral-700 mb-1'>{label}</label>
    <input id={id} className='w-full text-2xl leading-tight tracking-tight px-4 py-3 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-4 focus:ring-neutral-200 focus:border-neutral-400 placeholder-neutral-400' value={value} onChange={(e) => onChange(e.target.value)} inputMode={inputMode} placeholder={placeholder} autoComplete='off' />
    {hint && <Small>{hint}</Small>}
  </div>)}
function KPI({ label, value }) {return (<div className='rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-center'><div className='text-xs text-neutral-600'>{label}</div><div className='mt-1 text-lg font-medium tabular-nums'>{value}</div></div>)}
function Small({ children, muted }) {return (<p className={'mt-2 text-xs ' + (muted ? 'text-neutral-400' : 'text-neutral-600')}>{children}</p>)}

// Utils
function parseLocaleNumber(input) {if (input == null) return NaN;if (typeof input === 'number') return input;const s = String(input).trim().replace(/\s+/g, '');if (!s) return NaN;const lastComma = s.lastIndexOf(',');const lastDot = s.lastIndexOf('.');let normalized = s.replace(/[^0-9,\.\-]/g, '');if (lastComma > lastDot) {normalized = normalized.replace(/\./g, '').replace(',', '.')} else if (lastDot > lastComma) {normalized = normalized.replace(/,/g, '')} else {normalized = normalized.replace(',', '.')}return Number(normalized)}
function clampNumber(n, min, max) {if (!isFinite(n)) return min;return Math.min(Math.max(n, min), max)}
function roundMoney(n) {return Math.round((n + Number.EPSILON) * 100) / 100}
const eurFmt = typeof Intl !== 'undefined' ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }) : null
const numFmt = typeof Intl !== 'undefined' ? new Intl.NumberFormat('it-IT', { maximumFractionDigits: 4 }) : null
function formatEUR(n) {if (!isFinite(n)) return '–';return eurFmt ? eurFmt.format(n) : `€ ${n.toFixed(2)}`}
function formatNumber(n) {if (!isFinite(n)) return '';return numFmt ? numFmt.format(n) : String(n)}
