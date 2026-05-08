export const TRANSFER_LEAGUE_OPTIONS = [
  { value: '39', label: '프리미어리그' },
  { value: '140', label: '라리가' },
  { value: '135', label: '세리에A' },
  { value: '78', label: '분데스리가' },
  { value: '61', label: '리그1' },
  { value: '292', label: 'K리그1' },
  { value: '293', label: 'K리그2' },
  { value: '40', label: '챔피언십' },
  { value: '88', label: '에레디비시' },
  { value: '94', label: '프리메이라리가' },
  { value: '98', label: 'J1리그' },
  { value: '253', label: 'MLS' },
  { value: '307', label: '사우디 프로리그' },
  { value: '71', label: '브라질레이랑' },
  { value: '119', label: '덴마크 수페르리가' },
  { value: '169', label: '중국 슈퍼리그' },
  { value: '262', label: '리가MX' },
  { value: '179', label: '스코틀랜드 프리미어십' },
] as const;

export const TRANSFER_LEAGUE_IDS = TRANSFER_LEAGUE_OPTIONS.map((league) => Number(league.value));
