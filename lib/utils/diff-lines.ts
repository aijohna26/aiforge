export interface DiffChange {
  value: string;
  added?: boolean;
  removed?: boolean;
}

/**
 * Lightweight line diff implementation so we don't depend on the `diff` package.
 * Uses a longest common subsequence pass to detect additions/removals and then
 * groups contiguous segments similar to `diffLines`.
 */
export function diffLines(before: string, after: string): DiffChange[] {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const m = beforeLines.length;
  const n = afterLines.length;

  // LCS dynamic programming matrix
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0)
  );

  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      if (beforeLines[i] === afterLines[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  type Op = { type: "common" | "add" | "remove"; line: string };
  const operations: Op[] = [];
  let i = 0;
  let j = 0;

  while (i < m && j < n) {
    if (beforeLines[i] === afterLines[j]) {
      operations.push({ type: "common", line: beforeLines[i] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      operations.push({ type: "remove", line: beforeLines[i] });
      i += 1;
    } else {
      operations.push({ type: "add", line: afterLines[j] });
      j += 1;
    }
  }

  while (i < m) {
    operations.push({ type: "remove", line: beforeLines[i] });
    i += 1;
  }
  while (j < n) {
    operations.push({ type: "add", line: afterLines[j] });
    j += 1;
  }

  const segments: DiffChange[] = [];
  const appendSegment = (type: Op["type"], line: string) => {
    const value = `${line}\n`;
    const last = segments[segments.length - 1];

    if (
      last &&
      ((type === "common" && !last.added && !last.removed) ||
        (type === "add" && last.added) ||
        (type === "remove" && last.removed))
    ) {
      last.value += value;
      return;
    }

    segments.push({
      value,
      added: type === "add" ? true : undefined,
      removed: type === "remove" ? true : undefined,
    });
  };

  operations.forEach((op) => appendSegment(op.type, op.line));

  return segments;
}
