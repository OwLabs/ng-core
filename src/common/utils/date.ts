/**
 * Generates a timestamp for Malaysia Time (GMT+8) in the format:
 * YYYY-MM-DDTHH:mm:ss+08:00
 */
export const getMalaysiaTimestamp = () => {
  const now = new Date();

  // Add 8 hours to current UTC time
  const malaysiaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);

  // Get ISO string (e.g; "2026-01-22T11:38:57.000Z"), split before the '.' to remove ms, and append +08:00
  return malaysiaTime.toISOString().split('.')[0] + '+08:00';
};
