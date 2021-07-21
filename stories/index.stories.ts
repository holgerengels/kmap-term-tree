import { html, TemplateResult } from 'lit-html';
import '../kmap-term-tree.js';

export default {
  title: 'KmapTermTree',
  component: 'kmap-term-tree',
  argTypes: {
    term: { control: 'text' },
    textColor: { control: 'color' },
    borderColor: { control: 'color' },
    edgeColor: { control: 'color' },
    verticalDistance: { control: 'text' },
  },
};

interface Story<T> {
  (args: T): TemplateResult;
  args?: Partial<T>;
  argTypes?: Record<string, unknown>;
}

interface ArgTypes {
  term?: string;
  textColor?: string;
  borderColor?: string;
  edgeColor?: string;
  verticalDistance?: string;
}

const Template: Story<ArgTypes> = ({
  term = '2a+sin(3b)',
  textColor,
  borderColor,
  edgeColor,
  verticalDistance,
}: ArgTypes) => html`
  <kmap-term-tree
    style="--kmap-term-tree-text-color: ${textColor || 'black'}; --kmap-term-tree-border-color: ${borderColor || '#005b9f'}; --kmap-term-tree-edge-color: ${edgeColor || '#fbc02d'}; --kmap-term-tree-vertical-distance: ${verticalDistance || '2em'}"
    .term=${term}
  >
  </kmap-term-tree>
`;

export const Regular = Template.bind({});
