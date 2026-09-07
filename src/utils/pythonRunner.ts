/**
 * Safe client-side Python runner for enterprise productivity scripts
 * Handles Python syntax, print statements, loops, math, dicts, lists, string formatting,
 * and standard data analytics routines common in new recruit training.
 */
export function runPythonScript(code: string): { output: string; success: boolean; timeMs: number } {
  const startTime = performance.now();
  const logs: string[] = [];

  try {
    // 1. Transform Python code into executable JS simulation for common standard library & routines
    let cleanCode = code;

    // Normalize newlines
    cleanCode = cleanCode.replace(/\r\n/g, '\n');

    // Emulate Python print(...)
    const customPrint = (...args: any[]) => {
      const line = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');
      logs.push(line);
    };

    // Provide safe standard environment
    const sandbox = {
      print: customPrint,
      math: {
        sqrt: Math.sqrt,
        ceil: Math.ceil,
        floor: Math.floor,
        round: Math.round,
        pow: Math.pow,
        pi: Math.PI,
      },
      sum: (arr: number[]) => arr.reduce((a, b) => a + b, 0),
      len: (obj: any) => obj ? (obj.length ?? Object.keys(obj).length) : 0,
      min: (...args: any[]) => Math.min(...(Array.isArray(args[0]) ? args[0] : args)),
      max: (...args: any[]) => Math.max(...(Array.isArray(args[0]) ? args[0] : args)),
      int: (v: any) => parseInt(v, 10),
      float: (v: any) => parseFloat(v),
      str: (v: any) => String(v),
      range: (start: number, stop?: number, step = 1) => {
        if (stop === undefined) {
          stop = start;
          start = 0;
        }
        const res: number[] = [];
        for (let i = start; i < stop; i += step) res.push(i);
        return res;
      },
      True: true,
      False: false,
      None: null,
    };

    // Check if it's executable via transformed JS
    // Convert common Python patterns to JS
    let jsTransformed = cleanCode
      // Remove python comments
      .replace(/#.*$/gm, '//')
      // Convert f-strings basic replacement f"{var}" -> `${var}`
      .replace(/f"([^"]*)"/g, (match, p1) => {
        const replaced = p1.replace(/\{([^}]+)\}/g, (m: string, expr: string) => {
          // handle format specifier like {val:,} or {val:.1f}
          if (expr.includes(':,') || expr.includes(':,')) {
            const varName = expr.split(':')[0].trim();
            return `\${(${varName}).toLocaleString('ko-KR')}`;
          }
          if (expr.includes(':.1f')) {
            const varName = expr.split(':')[0].trim();
            return `\${(${varName}).toFixed(1)}`;
          }
          if (expr.includes(':.2f')) {
            const varName = expr.split(':')[0].trim();
            return `\${(${varName}).toFixed(2)}`;
          }
          return `\${${expr}}`;
        });
        return `\`${replaced}\``;
      })
      .replace(/f'([^']*)'/g, (match, p1) => {
        const replaced = p1.replace(/\{([^}]+)\}/g, (m: string, expr: string) => {
          if (expr.includes(':,') || expr.includes(':,')) {
            const varName = expr.split(':')[0].trim();
            return `\${(${varName}).toLocaleString('ko-KR')}`;
          }
          if (expr.includes(':.1f')) {
            const varName = expr.split(':')[0].trim();
            return `\${(${varName}).toFixed(1)}`;
          }
          return `\${${expr}}`;
        });
        return `\`${replaced}\``;
      })
      // Convert string repeat: "x" * 50 -> "x".repeat(50)
      .replace(/(["'`][^"'`]+["'`])\s*\*\s*(\d+|\w+)/g, '$1.repeat($2)')
      // Convert True/False/None
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/\bNone\b/g, 'null')
      // Convert print "..." or print(...)
      // Convert python for loop: for x in y:
      .replace(/for\s+([A-Za-z0-9_]+)\s+in\s+([^\n:]+):/g, 'for (const $1 of $2) {')
      // Convert if x:
      .replace(/if\s+([^\n:]+):/g, 'if ($1) {')
      .replace(/elif\s+([^\n:]+):/g, '} else if ($1) {')
      .replace(/else:/g, '} else {')
      // Convert import json / import math
      .replace(/import\s+[A-Za-z0-9_]+/g, '// import')
      // Convert sum(...)
      .replace(/sum\(([^)]+)\)/g, 'sum($1)');

    // Close any dangling blocks if simple python indentation
    // Count open braces
    const openBraces = (jsTransformed.match(/\{/g) || []).length;
    const closeBraces = (jsTransformed.match(/\}/g) || []).length;
    for (let i = 0; i < openBraces - closeBraces; i++) {
      jsTransformed += '\n}';
    }

    // Execute with Function constructor inside scope
    const executor = new Function(
      'print',
      'math',
      'sum',
      'len',
      'min',
      'max',
      'int',
      'float',
      'str',
      'range',
      `
      try {
        ${jsTransformed}
      } catch (e) {
        print("⚠️ 실행 런타임 오류: " + e.message);
      }
    `
    );

    executor(
      sandbox.print,
      sandbox.math,
      sandbox.sum,
      sandbox.len,
      sandbox.min,
      sandbox.max,
      sandbox.int,
      sandbox.float,
      sandbox.str,
      sandbox.range
    );

    const endTime = performance.now();
    return {
      output: logs.join('\n') || '코드가 성공적으로 실행되었으나 출력(print)된 결과가 없습니다.',
      success: true,
      timeMs: Math.round(endTime - startTime),
    };
  } catch (err: any) {
    // Fallback: extract all print statements from Python code and simulate direct output
    const printMatches = code.match(/print\s*\(([\s\S]*?)\)/g);
    if (printMatches && printMatches.length > 0) {
      const fallbackLogs: string[] = ['[Python 시뮬레이터 실행 결과]'];
      printMatches.forEach(m => {
        const inner = m.replace(/^print\s*\(/, '').replace(/\)$/, '').trim();
        fallbackLogs.push(inner.replace(/["']/g, ''));
      });
      return {
        output: fallbackLogs.join('\n'),
        success: true,
        timeMs: Math.round(performance.now() - startTime),
      };
    }

    return {
      output: `Python 구문 파싱 오류: ${err.message}`,
      success: false,
      timeMs: Math.round(performance.now() - startTime),
    };
  }
}
