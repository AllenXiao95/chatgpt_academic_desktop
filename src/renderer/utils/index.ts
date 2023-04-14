export default function jsonToText(json: Record<string, unknown>): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(json)) {
    if (typeof value === 'object' && value !== null) {
      parts.push(`${key} = {`);

      for (const [subKey, subValue] of Object.entries(value)) {
        const formattedSubValue = JSON.stringify(subValue, null, 2)
          .split('\n')
          .join('\n    ');
        parts.push(`    '${subKey}': '${formattedSubValue}',`);
      }

      parts.push(`}`);
    } else {
      let formattedValue: any = ""
      if (value === "True" || value === 'False') {
        formattedValue = value
      } else if (String(Number(value)) === 'NaN') {
        formattedValue = `'${value}'`
      } else {
        formattedValue = value
      }

      parts.push(`${key} = ${formattedValue}`);
    }
  }

  return parts.join('\n');
}
