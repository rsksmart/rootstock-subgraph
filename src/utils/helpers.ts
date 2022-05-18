export const stringToArray = (str: string): string[] => {
  return str
    .slice(1, str.length - 1)
    .split(', ')
    .map<string>((item) => item.toLowerCase())
}