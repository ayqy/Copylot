const COPY_BUTTON_LINE_REGEX = /^(Copy|COPY|Copy to clipboard|复制|复制代码|Clone|克隆|拷贝)$/;

function isCopyButtonLine(line: string): boolean {
  return COPY_BUTTON_LINE_REGEX.test(line.trim());
}

function unescapeMarkdownCharacters(text: string): string {
  return text
    .replace(/\\#/g, '#')
    .replace(/\\=/g, '=')
    .replace(/\\\*/g, '*')
    .replace(/\\\[/g, '[')
    .replace(/\\\]/g, ']')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')');
}

/**
 * 保守清理代码块文本：仅移除首/末端连续段中的“复制按钮文案”行，严禁做行内子串替换。
 */
export function cleanCodeBlockText(text: string): string {
  if (!text) return text;

  const lines = text.split(/\r?\n/);

  let start = 0;
  while (start < lines.length && isCopyButtonLine(lines[start] || '')) {
    start++;
  }

  let end = lines.length - 1;
  while (end >= start && isCopyButtonLine(lines[end] || '')) {
    end--;
  }

  const cleaned = lines.slice(start, end + 1).join('\n');
  return unescapeMarkdownCharacters(cleaned);
}
