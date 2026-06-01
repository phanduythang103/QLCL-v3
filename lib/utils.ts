type ClassValue = string | number | false | null | undefined | ClassValue[];

export function cn(...inputs: ClassValue[]) {
  const classes: string[] = [];

  const append = (input: ClassValue) => {
    if (!input) return;
    if (Array.isArray(input)) {
      input.forEach(append);
      return;
    }
    classes.push(String(input));
  };

  inputs.forEach(append);
  return classes.join(' ');
}
