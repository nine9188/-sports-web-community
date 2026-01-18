import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import PredictionChartNode from '@/domains/prediction/components/PredictionChartNode';
import type { PredictionChartData } from '@/domains/prediction/components/PredictionChart';

export interface PredictionChartOptions {
  HTMLAttributes: Record<string, string | number | boolean>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    predictionChart: {
      /**
       * 예측 차트 삽입
       */
      setPredictionChart: (fixtureId: string, chartData: PredictionChartData) => ReturnType;
    };
  }
}

export const PredictionChartExtension = Node.create<PredictionChartOptions>({
  name: 'predictionChart',

  group: 'block',

  atom: true,

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      fixtureId: {
        default: null,
      },
      chartData: {
        default: null,
        parseHTML: element => {
          const data = element.getAttribute('data-chart');
          if (data) {
            try {
              return JSON.parse(decodeURIComponent(data));
            } catch (e) {
              console.error('예측 차트 데이터 파싱 오류:', e);
              return null;
            }
          }
          return null;
        },
        renderHTML: attributes => {
          if (!attributes.chartData) return {};

          try {
            return {
              'data-chart': encodeURIComponent(JSON.stringify(attributes.chartData))
            };
          } catch (e) {
            console.error('예측 차트 데이터 직렬화 오류:', e);
            return {};
          }
        }
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="prediction-chart"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        { 'data-type': 'prediction-chart' },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PredictionChartNode);
  },

  addCommands() {
    return {
      setPredictionChart: (fixtureId, chartData) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            fixtureId,
            chartData
          }
        });
      },
    };
  },
});

export default PredictionChartExtension;
