export type LineDiffResult = {
  leftLines: (string | null)[];
  rightLines: (string | null)[];
  leftMap: number[]; // original index -> aligned index
  rightMap: number[]; // original index -> aligned index
};

export function computeLineDiff(text1: string, text2: string): LineDiffResult {
  const lines1 = text1.split("\n");
  const lines2 = text2.split("\n");

  // Helper to extract comparison token
  // If line has a key "key": ..., use the key.
  // Otherwise use the whole line.
  const getAlignmentToken = (line: string) => {
    const match = line.match(/^\s*"((?:[^"\\]|\\.)*)"\s*:/);
    if (match) {
      return match[1];
    }
    return line.trim(); // Use trimmed line for non-key lines to ignore indentation diffs if any
  };

  const tokens1 = lines1.map(getAlignmentToken);
  const tokens2 = lines2.map(getAlignmentToken);

  const matrix: number[][] = [];
  for (let i = 0; i <= lines1.length; i++) {
    matrix[i] = new Array(lines2.length + 1).fill(0);
  }

  for (let i = 1; i <= lines1.length; i++) {
    for (let j = 1; j <= lines2.length; j++) {
      if (tokens1[i - 1] === tokens2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1;
      } else {
        matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
      }
    }
  }

  const leftLines: (string | null)[] = [];
  const rightLines: (string | null)[] = [];
  const leftMap: number[] = new Array(lines1.length).fill(-1);
  const rightMap: number[] = new Array(lines2.length).fill(-1);

  let i = lines1.length;
  let j = lines2.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && tokens1[i - 1] === tokens2[j - 1]) {
      leftLines.unshift(lines1[i - 1]);
      rightLines.unshift(lines2[j - 1]);
      i--;
      j--;
    } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
      leftLines.unshift(null);
      rightLines.unshift(lines2[j - 1]);
      j--;
    } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
      leftLines.unshift(lines1[i - 1]);
      rightLines.unshift(null);
      i--;
    }
  }

  // Build maps
  let originalLeftIndex = 0;
  let originalRightIndex = 0;
  for (let k = 0; k < leftLines.length; k++) {
    if (leftLines[k] !== null) {
      leftMap[originalLeftIndex] = k;
      originalLeftIndex++;
    }
    if (rightLines[k] !== null) {
      rightMap[originalRightIndex] = k;
      originalRightIndex++;
    }
  }

  return { leftLines, rightLines, leftMap, rightMap };
}
