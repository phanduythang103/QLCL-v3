export interface Assessment83Criterion {
  phan?: string | null;
  chuong?: string | null;
  tieu_chi?: string | null;
  muc?: string | number | null;
  ma_tieu_muc?: string | null;
}

export interface Assessment83Result {
  ma_tieu_muc: string;
  dat_muc?: string | null;
  nhom?: string | null;
  muc_dat_duoc?: number | null;
}

export interface Assessment83ScoreSummary {
  parts: Array<{
    name: string;
    average: number | null;
    chapters: Array<{
      name: string;
      average: number | null;
      criteria: Array<{ name: string; level: number | null }>;
    }>;
  }>;
  average: number | null;
}

const average = (values: number[]) =>
  values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

const getLevel = (value?: string | number | null) => {
  const match = String(value ?? '1').match(/\d+/);
  return match ? Number(match[0]) : 1;
};

const isPassing = (status?: string | null) =>
  status === 'Đạt' || status === 'Không đánh giá';

export const calculateAssessment83Scores = (
  criteria: Assessment83Criterion[],
  results: Assessment83Result[],
  options: { includeUnevaluatedAsLevelOne?: boolean } = {}
): Assessment83ScoreSummary => {
  const resultByCode = new Map(results.map(result => [result.ma_tieu_muc, result]));
  const hierarchy = new Map<string, Map<string, Map<string, Assessment83Criterion[]>>>();

  criteria.forEach(item => {
    if (!item.ma_tieu_muc) return;
    const partName = item.phan || 'Khác';
    const chapterName = item.chuong || 'Khác';
    const criterionName = item.tieu_chi || 'Khác';

    if (!hierarchy.has(partName)) hierarchy.set(partName, new Map());
    const chapters = hierarchy.get(partName)!;
    if (!chapters.has(chapterName)) chapters.set(chapterName, new Map());
    const criterionGroups = chapters.get(chapterName)!;
    if (!criterionGroups.has(criterionName)) criterionGroups.set(criterionName, []);
    criterionGroups.get(criterionName)!.push(item);
  });

  const parts = Array.from(hierarchy.entries()).map(([partName, chapterGroups]) => {
    const chapters = Array.from(chapterGroups.entries()).map(([chapterName, criterionGroups]) => {
      const criterionScores = Array.from(criterionGroups.entries()).map(([criterionName, items]) => {
        const evaluatedItems = items.filter(item => resultByCode.get(item.ma_tieu_muc!)?.dat_muc);
        if (evaluatedItems.length === 0) {
          return {
            name: criterionName,
            level: options.includeUnevaluatedAsLevelOne ? 1 : null
          };
        }

        let achievedLevel = 1;
        for (let level = 2; level <= 5; level++) {
          const levelItems = items.filter(item => getLevel(item.muc) === level);
          if (levelItems.length === 0) continue;
          if (!levelItems.every(item => isPassing(resultByCode.get(item.ma_tieu_muc!)?.dat_muc))) break;
          achievedLevel = level;
        }

        return { name: criterionName, level: achievedLevel };
      });
      const levels = criterionScores
        .map(item => item.level)
        .filter((level): level is number => level !== null);

      return { name: chapterName, criteria: criterionScores, average: average(levels) };
    });
    const chapterAverages = chapters
      .map(chapter => chapter.average)
      .filter((value): value is number => value !== null);

    return { name: partName, chapters, average: average(chapterAverages) };
  });
  const partAverages = parts
    .map(part => part.average)
    .filter((value): value is number => value !== null);

  return { parts, average: average(partAverages) };
};
