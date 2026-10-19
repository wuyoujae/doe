// Origin: commercial 2026-10-12 features/work/agents/SubAgentAvatar.tsx
import { PixelAnimal, type AnimalVariant } from './PixelAnimal';

const avatarByAgentId: Readonly<Record<string, AnimalVariant>> = {
  'doe-agent': 'slide-agent-doe',
  'outline-agent-traditional': 'outline-agent-traditional',
  'outline-agent-doe': 'outline-agent-doe',
  'social-card-outline-agent': 'social-card-outline-agent',
  'visual-outline-agent': 'visual-outline-agent',
  'slide-agent-traditional': 'slide-agent-traditional',
  'slide-agent-doe': 'slide-agent-doe',
  'social-card-agent': 'social-card-agent',
  'visual-design-agent': 'visual-design-agent',
  'data-processing-agent': 'data-processing-agent',
  'document-agent': 'document-agent',
  'deep-research-agent': 'deep-research-agent',
  'outline-agent': 'outline-agent-traditional',
  'slide-agent': 'slide-agent-traditional',
  'data-agent': 'data-processing-agent',
  'document-generation-agent': 'document-agent',
  'research-agent': 'deep-research-agent',
};

const avatarLabelSpecs = [
  {
    variant: 'outline-agent-traditional',
    identities: ['outline agent', 'outline specialist', '大纲制作专家', '大綱製作專家'],
  },
  {
    variant: 'slide-agent-traditional',
    identities: ['slide agent', 'slide specialist', '幻灯片制作专家', '幻燈片製作專家'],
  },
  {
    variant: 'data-processing-agent',
    identities: ['data agent', 'data specialist', '数据处理师', '數據處理師'],
  },
  {
    variant: 'document-agent',
    identities: ['document agent', 'document specialist', '文档生成专家', '文檔生成專家'],
  },
  {
    variant: 'deep-research-agent',
    identities: [
      'research agent',
      'research specialist',
      '深度搜索专家',
      '深度搜尋專家',
      '数据搜集师',
      '數據搜集師',
    ],
  },
] as const;

function normalizeIdentity(identity: string) {
  return identity.normalize('NFKC').toLocaleLowerCase();
}

function resolveAvatarVariant(agentId: string | undefined, label: string) {
  const agentVariant = agentId ? avatarByAgentId[normalizeIdentity(agentId)] : undefined;
  if (agentVariant) return agentVariant;

  const normalizedLabel = normalizeIdentity(label);
  return avatarLabelSpecs.find((spec) => (
    spec.identities.some((candidate) => normalizedLabel.includes(candidate))
  ))?.variant;
}

export function SubAgentAvatar({
  agentId,
  label,
  isRunning,
}: {
  agentId?: string;
  label: string;
  isRunning: boolean;
}) {
  const variant = resolveAvatarVariant(agentId, label);
  return (
    <span className={`sub-agent-avatar ${isRunning ? 'is-running' : 'is-complete'}`} aria-hidden="true">
      <PixelAnimal variant={variant ?? 'default'} />
    </span>
  );
}
