import { html, TemplateResult } from 'lit-html';
import '../kmap-term-tree.js';

export default {
  title: 'KmapTermTree',
  component: 'kmap-term-tree',
  argTypes: {
    term: { control: 'text' },
    textColor: { control: 'color' },
    backgroundColor: { control: 'color' },
    borderColor: { control: 'color' },
    edgeColor: { control: 'color' },
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
  backgroundColor?: string;
  borderColor?: string;
  edgeColor?: string;
}

const Template: Story<ArgTypes> = ({
  term = '2a+sin(3b)',
  textColor,
  backgroundColor,
  borderColor,
  edgeColor,
}: ArgTypes) => html`
  <kmap-term-tree
    style="--kmap-term-tree-text-color: ${textColor || 'black'}; --kmap-term-tree-background-color: ${backgroundColor || 'white'}; --kmap-term-tree-border-color: ${borderColor || '#005b9f'}; --kmap-term-tree-edge-color: ${edgeColor || '#fbc02d'};"
    .term=${term}
  >
  </kmap-term-tree>
`;

export const Regular = Template.bind({});
