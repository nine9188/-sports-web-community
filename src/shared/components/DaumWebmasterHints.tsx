type DaumWebmasterHintsProps = {
  title?: string | null;
  content?: string | null;
  datetime?: string | Date | null;
};

function compactText(value?: string | null): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function formatDaumDatetime(value?: string | Date | null): string {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return compactText(String(value));
  }

  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${get('year')}.${get('month')}.${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

export default function DaumWebmasterHints({
  title,
  content,
  datetime,
}: DaumWebmasterHintsProps) {
  const safeTitle = compactText(title);
  const safeContent = compactText(content);
  const safeDatetime = formatDaumDatetime(datetime);

  if (!safeTitle && !safeContent && !safeDatetime) return null;

  return (
    <div className="sr-only" aria-hidden="true" data-daum-webmaster-hints>
      {safeTitle ? <div className="daum-wm-title">{safeTitle}</div> : null}
      {safeDatetime ? <div className="daum-wm-datetime">{safeDatetime}</div> : null}
      {safeContent ? <div className="daum-wm-content">{safeContent}</div> : null}
    </div>
  );
}
