import React from 'react'

export default function App(){
  const [theme,setTheme]=React.useState(()=>localStorage.getItem('theme')||'light')
  const [uiMode,setUiMode]=React.useState(()=>localStorage.getItem('uiMode')||'mobile')
  React.useEffect(()=>{localStorage.setItem('theme',theme);document.documentElement.classList.toggle('dark',theme==='dark')},[theme])
  React.useEffect(()=>{localStorage.setItem('uiMode',uiMode)},[uiMode])
  return(
    <main className='min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100'>
      <Header theme={theme} setTheme={setTheme} uiMode={uiMode} setUiMode={setUiMode}/>
      <div className={'mx-auto w-full '+(uiMode==='mobile'?'max-w-md':'max-w-3xl')+' px-4 pb-24'}>
        <Section title='Calcolo rapido' subtitle='Scrivi un’operazione (es. =70*100 o (12,5+7)*3).'>
          <QuickCalc />
        </Section>
        <Section title='IVA e altre aliquote' subtitle="Aggiungi o scorpora l'IVA (o altre aliquote) con valori personalizzabili.">
          <VatCard/>
        </Section>
        <Section title='Cambio EUR ⇄ USD' subtitle='Converti importi con un tasso impostabile.'>
          <FxCard/>
        </Section>
      </div>
      <Footer/>
    </main>
  )
}

function Header({theme,setTheme,uiMode,setUiMode}){
  return(
    <header className='sticky top-0 z-10 border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/80'>
      <div className={'mx-auto '+(uiMode==='mobile'?'max-w-md':'max-w-3xl')+' px-4 py-4 flex items-center justify-between'}>
        <div>
          <h1 className='text-2xl font-medium'>Calcolatrice Finanziaria</h1>
          
        </div>
        <div className='flex gap-2'>
          <ToggleGroup value={theme} onChange={setTheme} options={[{value:'light',label:'Light'},{value:'dark',label:'Dark'}]}/>
          <ToggleGroup value={uiMode} onChange={setUiMode} options={[{value:'mobile',label:'Mobile'},{value:'desktop',label:'Desktop'}]}/>
        </div>
      </div>
    </header>
  )
}

function Footer(){
  return(<footer className='fixed bottom-0 w-full border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/80 text-center text-xs py-3'>Prototipo – Usa con cautela.</footer>)
}

function Section({title,subtitle,children}){
  return(<section className='py-6'><h2 className='text-xl font-medium'>{title}</h2><p className='text-sm text-neutral-600 dark:text-neutral-400'>{subtitle}</p><div className='mt-4 space-y-4'>{children}</div></section>)
}


// QuickCalc — input riga formula con parser sicuro (+, -, *, /, parentesi)
function QuickCalc(){
  const [expr,setExpr]=React.useState('')
  const [error,setError]=React.useState(null)
  const [history,setHistory]=React.useState(()=>{
    try{ return JSON.parse(localStorage.getItem('qc_history')||'[]') }catch{ return [] }
  })
  const cleanExpr = expr.trim().replace(/^=/,'').replace(/,/g,'.')
  const result = React.useMemo(()=>{
    if(!cleanExpr){ setError(null); return '' }
    try{
      const val = evaluateExpression(cleanExpr)
      setError(null)
      return isFinite(val)? formatNumber(val) : '–'
    }catch(e){
      setError('Espressione non valida')
      return ''
    }
  },[cleanExpr])

  React.useEffect(()=>{
    try{ localStorage.setItem('qc_history', JSON.stringify(history.slice(0,10))) }catch{}
  },[history])

  return (<Card>
    <LabeledInput id='qc' label='Operazione' value={expr} onChange={setExpr} inputMode='decimal' placeholder='=70*100' hint='Supportati: + − × ÷ ( ) . ,  — Invio per salvare.'
      onKeyDown={(e)=>{ if(e.key==='Enter' && cleanExpr && !error){ setHistory(h=>[{expr:expr||('='+cleanExpr), result:result||''}, ...h].slice(0,10)) }}} />
    <div className='mt-3 grid grid-cols-2 gap-3'>
      <KPI label='Risultato' value={result || '–'}/>
      <div className='flex items-center justify-end'>
        <button className='px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
          onClick={async()=>{ if(result){ try{ await navigator.clipboard.writeText(result.toString()) }catch(e){} } }}>Copia</button>
      </div>
    </div>
    {history.length>0 && (<div className='mt-3'>
      <div className='text-xs text-neutral-600 dark:text-neutral-400 mb-2'>Cronologia</div>
      <ul className='space-y-1'>{history.map((h,i)=>(
        <li key={i}><button className='w-full text-left text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
          onClick={()=> setExpr(h.expr)}><span className='font-medium'>{h.expr}</span><span className='text-neutral-500 dark:text-neutral-400'> → {h.result}</span></button></li>
      ))}</ul>
    </div>)}
  </Card>)
}
// VAT
function VatCard(){
  const [mode,setMode]=React.useState('add')
  const [rate,setRate]=React.useState('22')
  const [amount,setAmount]=React.useState('')
  const parsedRate=parseFloat(rate)||0
  const parsedAmount=parseFloat(amount.replace(',','.'))||0
  let netto=0,iva=0,lordo=0
  if(mode==='add'){netto=parsedAmount;lordo=Math.round(netto*(1+parsedRate/100)*100)/100;iva=lordo-netto}
  else{lordo=parsedAmount;netto=Math.round(lordo/(1+parsedRate/100)*100)/100;iva=lordo-netto}
  return(<Card>
    <ToggleGroup value={mode} onChange={setMode} options={[{value:'add',label:'Aggiungi IVA'},{value:'remove',label:'Scorpora IVA'}]}/>
    <LabeledInput id='rate' label='Aliquota IVA (%)' value={rate} onChange={setRate} />
    <PresetAliquote current={rate} onPick={setRate}/>
    <LabeledInput id='amount' label={mode==='add'?'Imponibile (netto)':'Importo lordo'} value={amount} onChange={setAmount}/>
    <div className='grid grid-cols-3 gap-3 mt-3'>
      <KPI label='Netto' value={netto.toFixed(2)+' €'}/>
      <KPI label='IVA' value={iva.toFixed(2)+' €'}/>
      <KPI label='Lordo' value={lordo.toFixed(2)+' €'}/>
    </div>
  </Card>)
}

function PresetAliquote({current,onPick}){
  const presets=[4,5,10,22]
  return(<div className='flex gap-2 mt-2'>{presets.map(p=>(<button key={p} onClick={()=>onPick(String(p))} className={'px-3 py-1.5 text-sm rounded-lg border '+(String(current)===String(p)?'border-neutral-900 dark:border-neutral-100':'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800')}>{p}%</button>))}</div>)
}

// FX
function FxCard(){
  const [rate,setRate]=React.useState('1.10')
  const [eur,setEur]=React.useState('')
  const [usd,setUsd]=React.useState('')
  const [info,setInfo]=React.useState('')
  React.useEffect(()=>{
    (async()=>{
      try{
        const res = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD')
        const data = await res.json()
        if(data && data.rates && data.rates.USD){
          const r = Number(data.rates.USD)
          if(isFinite(r) && r>0){
            setRate(r.toFixed(4))
            setInfo('Tasso aggiornato da Frankfurter (BCE)')
          }
        }
      } catch(e){
        setInfo('Tasso manuale (impossibile aggiornare)')
      }
    })()
  },[])
  const r=parseFloat(rate.replace(',','.'))||0
  let eurOut=0,usdOut=0
  if(eur){eurOut=parseFloat(eur.replace(',','.'));usdOut=Math.round(eurOut*r*100)/100}
  if(usd){usdOut=parseFloat(usd.replace(',','.'));eurOut=Math.round(usdOut/r*100)/100}
  return(<Card>
    <LabeledInput id='ratefx' label='Tasso EUR→USD' value={rate} onChange={setRate} hint={info}/>
    <LabeledInput id='eur' label='Euro' value={eur} onChange={setEur}/>
    <LabeledInput id='usd' label='Dollari' value={usd} onChange={setUsd}/>
    <div className='grid grid-cols-2 gap-3 mt-3'><KPI label='EUR' value={eurOut.toFixed(2)}/><KPI label='USD' value={usdOut.toFixed(2)}/></div>
  </Card>)
}

// UI helpers
function Card({children}){return <div className='p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'>{children}</div>}
function LabeledInput({id,label,value,onChange,placeholder, hint, inputMode='decimal', onKeyDown}){return(<div><label className='block text-sm mb-1' htmlFor={id}>{label}</label><input id={id} value={value} onChange={e=>onChange(e.target.value)} onKeyDown={onKeyDown} inputMode={inputMode} placeholder={placeholder} className='w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 placeholder-neutral-400 dark:placeholder-neutral-500'/>{hint && <Small>{hint}</Small>}</div>)}
function Small({children, muted}){return (<p className={'mt-2 text-xs '+(muted?'text-neutral-400':'text-neutral-600 dark:text-neutral-400')}>{children}</p>)}
function KPI({label,value}){return(<div className='text-center p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800'><div className='text-xs text-neutral-600 dark:text-neutral-400'>{label}</div><div className='text-lg font-medium'>{value}</div></div>)}
function ToggleGroup({value,onChange,options}){return(<div className='inline-flex gap-1'>{options.map(o=>(<button key={o.value} onClick={()=>onChange(o.value)} className={'px-3 py-1.5 text-sm rounded-lg border '+(value===o.value?'border-neutral-900 dark:border-neutral-100':'border-neutral-200 dark:border-neutral-700')}>{o.label}</button>))}</div>)}


// — Expression evaluator (shunting-yard) — supports + - * / and parentheses
function evaluateExpression(input) {
  const tokens = tokenize(input)
  const rpn = toRPN(tokens)
  return evalRPN(rpn)
}
function tokenize(s){
  const t=[]; let i=0
  while(i<s.length){
    const c=s[i]
    if(c===' '){i++;continue}
    if('+-*/()'.includes(c)){
      if(c==='-' && (t.length===0 || (t[t.length-1].type!=='number' && t[t.length-1].value!==')'))){ t.push({type:'number',value:0}); t.push({type:'op',value:'-'}); i++; continue }
      t.push({type: c==='('||c===')' ? 'paren':'op', value:c}); i++; continue
    }
    if(/[0-9.]/.test(c)){
      let j=i; while(j<s.length && /[0-9.]/.test(s[j])) j++;
      const num=Number(s.slice(i,j)); if(!isFinite(num)) throw new Error('bad number')
      t.push({type:'number',value:num}); i=j; continue
    }
    if(c==='×'){ t.push({type:'op',value:'*'}); i++; continue }
    if(c==='÷'){ t.push({type:'op',value:'/'}); i++; continue }
    throw new Error('bad token')
  }
  return t
}
function toRPN(tokens){
  const out=[], ops=[], prec={'+':1,'-':1,'*':2,'/':2}
  for(const tt of tokens){
    if(tt.type==='number') out.push(tt)
    else if(tt.type==='op'){
      while(ops.length){ const top=ops[ops.length-1]; if(top.type==='op' && prec[top.value]>=prec[tt.value]) out.push(ops.pop()); else break }
      ops.push(tt)
    } else if(tt.type==='paren' && tt.value==='('){ ops.push(tt) }
      else if(tt.type==='paren' && tt.value===')'){
        while(ops.length && !(ops[ops.length-1].type==='paren' && ops[ops.length-1].value==='(')) out.push(ops.pop())
        if(!ops.length) throw new Error('mismatch'); ops.pop()
      }
  }
  while(ops.length){ const top=ops.pop(); if(top.type==='paren') throw new Error('mismatch'); out.push(top) }
  return out
}
function evalRPN(rpn){
  const st=[]; for(const tt of rpn){ if(tt.type==='number') st.push(tt.value); else if(tt.type==='op'){ const b=st.pop(), a=st.pop(); if(a===undefined||b===undefined) throw new Error('bad'); switch(tt.value){case '+':st.push(a+b);break;case '-':st.push(a-b);break;case '*':st.push(a*b);break;case '/':st.push(a/b);break;default:throw new Error('op');}}}
  if(st.length!==1) throw new Error('bad'); return st[0]
}
