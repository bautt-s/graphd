// ---------------------------------------------------------------------------
// Native-closure builder shared by the main thread and the sampler worker.
// Deliberately free of Compute Engine so it stays tiny in the worker bundle.
// ---------------------------------------------------------------------------

export type Scope = Record<string, number>
export type ScopeFn = (s: Scope) => number

// Lanczos gamma approximation, available to transpiled code as `_gamma`.
const PRELUDE = `
function _gamma(x){
  if(x<0.5) return Math.PI/(Math.sin(Math.PI*x)*_gamma(1-x));
  x-=1;
  var c=[0.99999999999980993,676.5203681218851,-1259.1392167224028,
    771.32342877765313,-176.61502916214059,12.507343278686905,
    -0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
  var a=c[0], t=x+7.5;
  for(var i=1;i<9;i++) a+=c[i]/(x+i);
  return Math.sqrt(2*Math.PI)*Math.pow(t,x+0.5)*Math.exp(-t)*a;
}
`

/** Build a native evaluator from a transpiled expression body. */
export function makeEvaluator(body: string): ScopeFn {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function('_s', `${PRELUDE}\nreturn (${body});`) as ScopeFn
}
