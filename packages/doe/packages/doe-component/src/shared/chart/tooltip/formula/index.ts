export type Datum = { value: number; category: string; series: string; seriesIndex: number; index: number; x?: number; y?: number };
export type Metric = { label: string; formula: string; format: 'number' | 'percent'; decimals?: number };
type Value = number | number[] | string | null;
type Node = { kind: 'literal'; value: Value } | { kind: 'name'; name: string } | { kind: 'call'; name: string; args: Node[] };
const names = new Set(['VALUE','PREVIOUS','SERIES','CATEGORY','ALL','INDEX','X','Y']);
const functions = new Set(['SUM','AVG','MIN','MAX','COUNT','MEDIAN','STDEV','ABS','ROUND','RANK','CUMSUM','CELL']);
export function parseFormula(source: string): Node {
  if (typeof source !== 'string' || !source.trim() || source.length > 256) throw Error('Formula must contain 1–256 characters.');
  const input = source.replace(/^\s*=/, '');
  const tokens = input.match(/\s+|(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|"(?:[^"\\]|\\["\\])*"|[A-Za-z_]+|[()+*/^,%-]/gi) || [];
  if (tokens.join('') !== input) throw Error('Unsupported formula syntax.');
  const parts = tokens.filter(x => x.trim());
  if (parts.length > 128) throw Error('Formula is too complex.');
  let position = 0;
  const literal = (value: Value): Node => ({ kind: 'literal', value });
  function expression(min = 0, depth = 0): Node {
    if (depth > 20) throw Error('Formula nesting is too deep.');
    const token = parts[position++]; let node: Node;
    if (token === '+' || token === '-') node = { kind: 'call', name: token === '+' ? 'POS' : 'NEG', args: [expression(3, depth + 1)] };
    else if (token === '(') { node = expression(0, depth + 1); if (parts[position++] !== ')') throw Error('Missing closing parenthesis.'); }
    else if (/^(?:\d|\.)/.test(token || '')) node = literal(Number(token));
    else if (token?.startsWith('"')) node = literal(JSON.parse(token));
    else {
      const name = token?.toUpperCase();
      if (parts[position] === '(' && functions.has(name)) {
        position++; const args: Node[] = [];
        if (parts[position] !== ')') do { args.push(expression(0, depth + 1)); } while (parts[position] === ',' && position++);
        if (parts[position++] !== ')') throw Error('Missing closing parenthesis.');
        const expected = name === 'CELL' ? 2 : name === 'ROUND' ? [1,2] : 1;
        if (!(Array.isArray(expected) ? expected.includes(args.length) : args.length === expected)) throw Error('Wrong function argument count.');
        node = { kind: 'call', name, args };
      } else if (names.has(name)) node = { kind: 'name', name };
      else throw Error(`Unknown formula name: ${token || ''}`);
    }
    const precedence: Record<string, number> = { '+':1, '-':1, '*':2, '/':2, '^':4 };
    while (true) {
      if (parts[position] === '%') { position++; node = { kind: 'call', name:'/', args:[node,literal(100)] }; continue; }
      const op = parts[position], priority = precedence[op];
      if (!priority || priority < min) break;
      position++; node = { kind: 'call', name:op, args:[node,expression(priority + (op === '^' ? 0 : 1), depth + 1)] };
    }
    return node;
  }
  const tree = expression();
  if (position !== parts.length) throw Error('Unexpected formula input.');
  function type(node: Node): string {
    if (node.kind === 'literal') return typeof node.value;
    if (node.kind === 'name') return ['SERIES','CATEGORY','ALL'].includes(node.name) ? 'array' : 'number';
    const args = node.args.map(type);
    const expected = node.name === 'CELL' ? 'string' : ['SUM','AVG','MIN','MAX','COUNT','MEDIAN','STDEV','RANK','CUMSUM'].includes(node.name) ? 'array' : 'number';
    if (args.some(value => value !== expected)) throw Error(`Invalid argument type for ${node.name}.`);
    return 'number';
  }
  if (type(tree) !== 'number') throw Error('Formula must return a number.');
  return tree;
}

export function evaluateFormula(source: string, current: Datum, data: Datum[]): number | null {
  const series = data.filter(x => x.seriesIndex === current.seriesIndex);
  const env: Record<string, Value> = { VALUE:current.value, PREVIOUS:series.find(x => x.index === current.index - 1)?.value ?? null,
    SERIES:series.map(x=>x.value), CATEGORY:data.filter(x=>x.index===current.index).map(x=>x.value), ALL:data.map(x=>x.value), INDEX:current.index+1, X:current.x ?? null, Y:current.y ?? null };
  function visit(node: Node): Value {
    if (node.kind === 'literal') return node.value;
    if (node.kind === 'name') return env[node.name];
    const args = node.args.map(visit), [a,b] = args, name = node.name;
    if (name === 'CELL') { const matches=data.filter(x=>x.series===a&&x.category===b);return matches.length===1?matches[0].value:null; }
    if (args.some(x => x === null)) return null;
    if (['SUM','AVG','MIN','MAX','COUNT','MEDIAN','STDEV','RANK','CUMSUM'].includes(name)) {
      if (!Array.isArray(a) || !a.length) return null;
      const sum = a.reduce((x,y)=>x+y,0), avg = sum/a.length;
      if (name==='SUM') return sum; if(name==='AVG') return avg;
      if(name==='MIN')return Math.min(...a); if(name==='MAX')return Math.max(...a); if(name==='COUNT')return a.length;
      if(name==='RANK')return a.filter(x=>x>current.value).length+1;
      if(name==='CUMSUM'){
        const input=node.args[0];
        const rows=input.kind==='name'&&input.name==='CATEGORY'?data.filter(x=>x.index===current.index):input.kind==='name'&&input.name==='ALL'?data:series;
        const end=rows.findIndex(x=>x.seriesIndex===current.seriesIndex&&x.index===current.index);
        return a.slice(0,end+1).reduce((x,y)=>x+y,0);
      }
      if(name==='STDEV')return Math.sqrt(a.reduce((x,y)=>x+(y-avg)**2,0)/a.length);
      const sorted=[...a].sort((x,y)=>x-y), middle=Math.floor(a.length/2);return a.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2;
    }
    if(typeof a!=='number'||(b!==undefined&&typeof b!=='number'))return null;
    const second=b as number;
    switch(name){case '+':return a+second;case '-':return a-second;case '*':return a*second;case '/':return second===0?null:a/second;case '^':return a**second;case 'NEG':return -a;case 'POS':return a;case 'ABS':return Math.abs(a);case 'ROUND':{const factor=10**Math.max(-10,Math.min(10,second||0));return Math.round(a*factor)/factor;}default:return null;}
  }
  try { const value=visit(parseFormula(source));return typeof value==='number'&&Number.isFinite(value)?value:null; } catch { return null; }
}

export const presets = [
  ['change','VALUE-PREVIOUS','number'], ['growth','(VALUE-PREVIOUS)/ABS(PREVIOUS)','percent'],
  ['average','AVG(SERIES)','number'], ['vsAverage','VALUE/AVG(SERIES)-1','percent'],
  ['share','VALUE/SUM(SERIES)','percent'], ['categoryShare','VALUE/SUM(CATEGORY)','percent'],
  ['rank','RANK(SERIES)','number'], ['cumulative','CUMSUM(SERIES)','number'],
  ['minimum','MIN(SERIES)','number'], ['maximum','MAX(SERIES)','number'],
  ['median','MEDIAN(SERIES)','number'], ['deviation','STDEV(SERIES)','number'],
] as const;

export function validateTooltip(value: unknown): string | null {
  if(value===undefined)return null;
  if(!value||typeof value!=='object'||Array.isArray(value))return 'Invalid tooltip configuration.';
  const config=value as { enabled?:boolean; metrics?:Metric[] };
  if(Object.keys(config).some(key=>!['enabled','metrics'].includes(key)))return 'Unknown tooltip setting.';
  if(config.enabled!==undefined&&typeof config.enabled!=='boolean')return 'Invalid tooltip visibility.';
  if(config.metrics!==undefined&&(!Array.isArray(config.metrics)||config.metrics.length>6))return 'Use up to 6 metrics.';
  for(const metric of config.metrics||[]){
    if(!metric||typeof metric.label!=='string'||!metric.label.trim()||metric.label.length>80||!['number','percent'].includes(metric.format))return 'Each metric needs a label and format.';
    if(Object.keys(metric).some(key=>!['label','formula','format','decimals'].includes(key)))return 'Unknown metric setting.';
    if(metric.decimals!==undefined&&(!Number.isInteger(metric.decimals)||metric.decimals<0||metric.decimals>6))return 'Decimals must be between 0 and 6.';
    try{parseFormula(metric.formula);}catch(error){return (error as Error).message;}
  }
  return null;
}
