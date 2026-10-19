import { compilePresentationMarkdown } from '../../../doe-document/src/document/presentation/schema/markdown/index.js';

const statement = 'Every original fact must remain readable. Export must reject a page that cannot contain its complete content.';
const compile = overflow => {
  const content = overflow
    ? Array.from({ length: 40 }, (_, i) => `## section-heading\ntext=Original fact ${i + 1}`).join('\n')
    : `## section-heading\ntext=Capacity regression\n## text-paragraph\n### text\n${statement}`;
  const result = compilePresentationMarkdown(`theme=yrkie-botanical\n# slide\n${content}`);
  if (result.diagnostics.length) throw new Error(JSON.stringify(result.diagnostics));
  return result.value;
};
process.stdout.write(JSON.stringify({ overflow: compile(true), fitting: compile(false) }));
