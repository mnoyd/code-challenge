// sumToN.js — Simple Node.js demo comparing sum algorithms

const MAX_SAFE_SUM = Number.MAX_SAFE_INTEGER;
const MAX_SAFE_N = Math.floor((Math.sqrt(8 * MAX_SAFE_SUM + 1) - 1) / 2);

/** O(1) — Gauss formula */
function sumConst(n) {
  n = Math.floor(n);
  if (n <= 0) return 0;
  return (n % 2 === 0) ? (n / 2) * (n + 1) : ((n + 1) / 2) * n;
}

/** O(n) — simple loop */
function sumLinear(n) {
  n = Math.floor(n);
  if (n <= 0) return 0;
  let s = 0;
  for (let i = 1; i <= n; i++) s += i;
  return s;
}

/** O(n^2) — nested increments (FIXED) */
function sumQuadratic(n) {
  n = Math.floor(n);
  if (n <= 0) return 0;
  let s = 0;
  for (let i = 1; i <= n; i++) {
    s += i;  // Add i to sum (not increment s by 1, i times)
  }
  return s;
}

/** Benchmark helper */
function benchmark(fn, n) {
  const t0 = performance.now();
  const result = fn(n);
  const t1 = performance.now();
  return { result, ms: t1 - t0 };
}

// Demo
function runDemo() {
  console.log('=== Sum-to-N Algorithm Demo ===\n');
  
  const testValues = [10, 1000, 100000];
  
  testValues.forEach(n => {
    console.log(`Testing n = ${n.toLocaleString()}`);
    console.log(`Expected: ${(n * (n + 1)) / 2}`);
    
    const r1 = benchmark(sumConst, n);
    const r2 = benchmark(sumLinear, n);
    const r3 = benchmark(sumQuadratic, n);
    
    console.log(`O(1) Gauss:     ${r1.result} (${r1.ms.toFixed(3)}ms)`);
    console.log(`O(n) Linear:    ${r2.result} (${r2.ms.toFixed(3)}ms)`);
    console.log(`O(n²) Quad:     ${r3.result} (${r3.ms.toFixed(3)}ms)`);
    
    const allCorrect = r1.result === r2.result && r2.result === r3.result;
    console.log(`All correct: ${allCorrect ? '✅' : '❌'}\n`);
  });
  
  console.log(`Max safe n: ${MAX_SAFE_N.toLocaleString()}`);
}

runDemo();
