window.NETCRACKER_AI_VISUAL_QUESTION_OVERRIDES = {};

(function() {
  'use strict';

  function optionTextValid(o) {
    return o && !/^(?:Option\s*)?[A-D1-4](?:\s*\(.*vector.*\))?$/i.test(String(o).trim()) && !/^Option\s+[A-D1-4]\s*—\s*select\s+from\s+exact\s+vector\s+reconstruction/i.test(String(o).trim());
  }

  window.classifyVisualQuestion = function classifyVisualQuestion(q) {
    if (!q) {
      return {
        visualRequirement: 'none',
        visualTypes: [],
        textFallbackQuality: 'complete',
        aiVisualCaptureRequired: false,
        semanticVisualDescription: null
      };
    }

    const overrides = window.NETCRACKER_AI_VISUAL_QUESTION_OVERRIDES || {};
    const key = q.id || q.questionId;
    if (key && overrides[key]) {
      const ov = overrides[key];
      return {
        visualRequirement: ov.visualRequirement || 'none',
        visualTypes: Array.isArray(ov.visualTypes) ? ov.visualTypes : [],
        textFallbackQuality: ov.textFallbackQuality || 'complete',
        aiVisualCaptureRequired: Boolean(ov.aiVisualCaptureRequired),
        semanticVisualDescription: ov.semanticVisualDescription || null
      };
    }

    const hasStemSvg = Boolean(q.stemVectorSvg);
    const hasOptionSvgs = Array.isArray(q.optionVectorSvgs) && q.optionVectorSvgs.some(Boolean);
    const hasSourceVectors = Array.isArray(q.sourceVectorSvgs) && q.sourceVectorSvgs.some(Boolean);
    const hasHtmlTable = Boolean((q.question && q.question.includes('<table')) || (q.passage && q.passage.includes('<table')) || q.tableHtml);

    const visualTypes = [];
    if (hasStemSvg) visualTypes.push('stem-svg');
    if (hasOptionSvgs) visualTypes.push('option-svg');
    if (hasSourceVectors) visualTypes.push('source-vector');
    if (hasHtmlTable) visualTypes.push('html-table');
    if (q.visualType && !visualTypes.includes(q.visualType)) {
      visualTypes.push(q.visualType);
    }

    let requirement = 'none';
    let fallback = 'complete';
    let captureRequired = false;

    const pres = (typeof window !== 'undefined' && window.resolveQuestionPresentation) ? window.resolveQuestionPresentation(q) : null;

    if (pres) {
      if (pres.primaryMode === 'native-text') {
        requirement = pres.sourceVectorRole === 'supplementary' ? 'supplementary' : 'none';
        fallback = 'complete';
        captureRequired = false;
      } else if (pres.primaryMode === 'native-text-with-stem-diagram' || pres.primaryMode === 'native-text-with-option-diagrams') {
        requirement = 'essential';
        fallback = 'complete';
        captureRequired = true;
      } else if (pres.primaryMode === 'semantic-table') {
        requirement = 'supplementary';
        fallback = 'complete';
        captureRequired = false;
      } else if (pres.primaryMode === 'native-stem-with-source-options' || pres.primaryMode === 'native-options-with-source-stem') {
        requirement = 'essential';
        fallback = 'partial';
        captureRequired = true;
      } else {
        requirement = 'essential';
        fallback = 'insufficient';
        captureRequired = true;
      }
    } else {
      const isVisual = hasStemSvg || hasOptionSvgs || hasSourceVectors || hasHtmlTable;
      if (!isVisual) {
        requirement = 'none';
        fallback = 'complete';
        captureRequired = false;
      } else if (hasOptionSvgs || hasStemSvg) {
        requirement = 'essential';
        fallback = 'complete';
        captureRequired = true;
      } else if (hasSourceVectors) {
        requirement = 'supplementary';
        fallback = 'complete';
        captureRequired = false;
      }
    }

    return {
      visualRequirement: requirement,
      visualTypes: visualTypes.length ? visualTypes : ['other'],
      textFallbackQuality: fallback,
      aiVisualCaptureRequired: captureRequired,
      semanticVisualDescription: q.reviewNotes || q.explanation || null
    };
  };
})();
