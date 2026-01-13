'use client';

import React from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import PredictionChart, { PredictionChartData } from './PredictionChart';

// TipTap 노드 뷰 컴포넌트
const PredictionChartNode: React.FC<NodeViewProps> = ({ node }) => {
  const { fixtureId, chartData } = node.attrs as { fixtureId: string; chartData: PredictionChartData };

  if (!chartData) {
    return (
      <NodeViewWrapper className="prediction-chart-error">
        <div className="p-3 border rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400">
          예측 차트 데이터를 불러올 수 없습니다.
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="prediction-chart-node" data-fixture-id={fixtureId}>
      <PredictionChart data={chartData} />
    </NodeViewWrapper>
  );
};

export default PredictionChartNode;
