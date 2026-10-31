import { html, TemplateResult } from 'lit-html';
import '../src/kmap-term-tree.js';

export default {
  title: 'KmapTermTree',
  component: 'kmap-term-tree',
  argTypes: {
    term: { control: 'text' },
    showLabels: { control: 'boolean' },
    showDetails: { control: 'boolean' },
    tension: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
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
  showLabels?: boolean;
  showDetails?: boolean;
  tension?: number;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  edgeColor?: string;
}

const Template: Story<ArgTypes> = ({
  term = '(2+a)(3-b)',
  showLabels = false,
  showDetails = true,
  tension = 0.5,
  textColor,
  backgroundColor,
  borderColor,
  edgeColor,
}: ArgTypes) => html`
  <kmap-term-tree
    style="--kmap-term-tree-text-color: ${textColor ||
    '#1f2937'}; --kmap-term-tree-background-color: ${backgroundColor ||
    '#ffffff'}; --kmap-term-tree-border-color: ${borderColor ||
    '#005b9f'}; --kmap-term-tree-edge-color: ${edgeColor || '#cbd5e1'};"
    .term=${term}
    .showLabels=${showLabels}
    .showDetails=${showDetails}
    .tension=${tension}
  >
  </kmap-term-tree>
`;

export const Regular = Template.bind({});
Regular.args = {
  term: '(2+a)(3-b)',
};

export const Fraction = Template.bind({});
Fraction.args = {
  term: '(a+b)/(c+d)',
};

export const Trigonometry = Template.bind({});
Trigonometry.args = {
  term: '2a + sin(3b)',
};

export const Mitternachtsformel = Template.bind({});
Mitternachtsformel.args = {
  term: 'sqrt(b^2 - 4ac)',
};
