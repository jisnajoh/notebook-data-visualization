export interface RepairResult {
  fixed: boolean;
  code: string;
  explanation: string;
}

const RULES: Array<{
  pattern: RegExp;
  fix: (code: string, match: RegExpMatchArray) => RepairResult;
}> = [
  {
    pattern: /ModuleNotFoundError: No module named '(\w+)'/,
    fix: (code, m) => ({
      fixed: true,
      code: `import micropip\nawait micropip.install('${m[1]}')\n\n${code}`,
      explanation: `Added micropip install for missing module "${m[1]}".`,
    }),
  },
  {
    pattern: /NameError: name '(\w+)' is not defined/,
    fix: (code, m) => ({
      fixed: false,
      code,
      explanation: `Variable "${m[1]}" is not defined. Make sure to run earlier cells first or define "${m[1]}" at the top of this cell.`,
    }),
  },
  {
    pattern: /ValueError: could not convert string to float/,
    fix: (code, _m) => ({
      fixed: true,
      code: code.replace(
        /df\[([^\]]+)\]/g,
        'pd.to_numeric(df[$1], errors="coerce")'
      ),
      explanation: 'Wrapped column access with pd.to_numeric to handle non-numeric values.',
    }),
  },
  {
    pattern: /KeyError: '([^']+)'/,
    fix: (code, m) => ({
      fixed: false,
      code,
      explanation: `Column "${m[1]}" not found. Check your CSV headers — column names are case-sensitive and normalized to lowercase with underscores.`,
    }),
  },
];

export function tryRepair(code: string, error: string): RepairResult {
  for (const rule of RULES) {
    const match = error.match(rule.pattern);
    if (match) return rule.fix(code, match);
  }
  return {
    fixed: false,
    code,
    explanation:
      'Unable to auto-repair. Check the error message above. Common fixes: run cells in order, verify column names, ensure numeric data for math operations.',
  };
}
