export type QuizFont = {
  id: string;
  family: string;
  weight: number;
  label: string;
  file: string;
  faceWeight: string;
};

export const QUIZ_FONT_FILES: readonly QuizFont[] = [
  {
    id: "andika-bold",
    family: "Andika",
    weight: 700,
    label: "Andika Bold",
    file: "Andika-Bold.ttf",
    faceWeight: "700",
  },
  {
    id: "jua",
    family: "Jua",
    weight: 400,
    label: "Jua",
    file: "Jua-Regular.ttf",
    faceWeight: "400",
  },
];

export async function loadQuizFonts(): Promise<void> {
  const base = import.meta.env.BASE_URL;
  await Promise.all(
    QUIZ_FONT_FILES.map(async (font) => {
      const face = new FontFace(font.family, `url(${base}fonts/${font.file})`, {
        weight: font.faceWeight,
        style: "normal",
        display: "block",
      });
      await face.load();
      document.fonts.add(face);
    }),
  );
  await document.fonts.ready;
  for (const font of QUIZ_FONT_FILES) {
    const spec = `${font.weight} 120px "${font.family}"`;
    if (!document.fonts.check(spec)) {
      throw new Error(`フォントを確認できません: ${font.label}`);
    }
  }
}
