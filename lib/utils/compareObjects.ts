export type DiffType = "added" | "removed" | "changed";

export interface DiffResult {
  path: string;
  leftValue: unknown;
  rightValue: unknown;
  type: DiffType;
}

export function compareObjects(
  left: unknown,
  right: unknown,
  path = "$"
): DiffResult[] {
  const diffs: DiffResult[] = [];
  walk(left, right, path, diffs);
  return diffs;
}

function walk(
  left: unknown,
  right: unknown,
  path: string,
  diffs: DiffResult[]
) {
  if (left === undefined && right === undefined) {
    return;
  }

  if (left === undefined) {
    diffs.push(createDiff("added", path, left, right));
    return;
  }

  if (right === undefined) {
    diffs.push(createDiff("removed", path, left, right));
    return;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    const maxLength = Math.max(left.length, right.length);
    for (let index = 0; index < maxLength; index += 1) {
      const nextPath = `${path}[${index}]`;
      walk(left[index], right[index], nextPath, diffs);
    }
    return;
  }

  const leftIsObject = isPlainObject(left);
  const rightIsObject = isPlainObject(right);

  if (leftIsObject && rightIsObject) {
    const keys = new Set([
      ...Object.keys(left as Record<string, unknown>),
      ...Object.keys(right as Record<string, unknown>),
    ]);
    keys.forEach((key) => {
      const nextPath = buildPath(path, key);
      walk(
        (left as Record<string, unknown>)[key],
        (right as Record<string, unknown>)[key],
        nextPath,
        diffs
      );
    });
    return;
  }

  if (
    (leftIsObject && !rightIsObject) ||
    (!leftIsObject && rightIsObject) ||
    (Array.isArray(left) && !Array.isArray(right)) ||
    (!Array.isArray(left) && Array.isArray(right))
  ) {
    diffs.push(createDiff("changed", path, left, right));
    return;
  }

  if (!Object.is(left, right)) {
    diffs.push(createDiff("changed", path, left, right));
  }
}

function createDiff(
  type: DiffType,
  path: string,
  leftValue: unknown,
  rightValue: unknown
): DiffResult {
  return {
    type,
    path,
    leftValue,
    rightValue,
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === "[object Object]"
  );
}

function buildPath(base: string, key: string) {
  if (!base || base === "$") {
    return `$.${key}`;
  }
  return `${base}.${key}`;
}


