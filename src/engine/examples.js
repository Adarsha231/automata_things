// Example problems shown in the input panel and on the home page.

export const EXAMPLES = [
  { id: 'ends01', label: 'Binary strings ending with 01', inputType: 'language', text: 'All binary strings ending with 01', alphabet: '0, 1' },
  { id: 'contains101', label: 'Binary strings containing 101', inputType: 'language', text: 'All binary strings containing 101', alphabet: '0, 1' },
  { id: 'even0', label: 'Strings with an even number of 0s', inputType: 'language', text: 'Binary strings with an even number of 0s', alphabet: '0, 1' },
  { id: 'starts1', label: 'Strings starting with 1', inputType: 'language', text: 'Binary strings starting with 1', alphabet: '0, 1' },
  { id: 'even1', label: 'Strings containing an even number of 1s', inputType: 'language', text: 'Binary strings containing an even number of 1s', alphabet: '0, 1' },
];

export const REGEX_EXAMPLES = [
  { id: 'rx-end01', label: '(0|1)*01', inputType: 'regex', text: '(0|1)*01', alphabet: '' },
  { id: 'rx-abb', label: '(a|b)*abb', inputType: 'regex', text: '(a|b)*abb', alphabet: '' },
  { id: 'rx-ab', label: 'a(b|c)*', inputType: 'regex', text: 'a(b|c)*', alphabet: '' },
  { id: 'rx-opt', label: '(ab)+c?', inputType: 'regex', text: '(ab)+c?', alphabet: '' },
];
