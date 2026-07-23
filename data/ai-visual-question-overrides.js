window.NETCRACKER_AI_VISUAL_QUESTION_OVERRIDES = {};

(function() {
  'use strict';

  function optionTextValid(o) {
    return o && !/^(?:Option\s*)?[A-D1-4](?:\s*\(.*vector.*\))?$/i.test(String(o).trim());
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
    const hasHtmlTable = Boolean((q.question && q.question.includes('<table')) || (q.passage && q.passage.includes('<table')));

    const st = String(q.transcriptionStatus || '');
    const cv = String(q.contentVerification || '');

    const visualTypes = [];
    if (hasStemSvg) visualTypes.push('stem-svg');
    if (hasOptionSvgs) visualTypes.push('option-svg');
    if (hasSourceVectors) visualTypes.push('source-vector');
    if (hasHtmlTable) visualTypes.push('html-table');
    if (q.visualType && !visualTypes.includes(q.visualType)) {
      visualTypes.push(q.visualType);
    }

    const isVisual = hasStemSvg || hasOptionSvgs || hasSourceVectors || hasHtmlTable;

    if (!isVisual) {
      return {
        visualRequirement: 'none',
        visualTypes: [],
        textFallbackQuality: 'complete',
        aiVisualCaptureRequired: false,
        semanticVisualDescription: null
      };
    }

    const isVectorPrimary = st.includes('vector-primary') || st.includes('vector-options-primary') || st.startsWith('quarantined');
    const isOptionVector = hasOptionSvgs;
    const isStemVector = hasStemSvg;
    const hasBadOptions = q.options && q.options.some(o => !optionTextValid(o));

    let requirement = 'none';
    let fallback = 'complete';
    let captureRequired = false;

    if (isOptionVector || isVectorPrimary || hasBadOptions || (isStemVector && (isVectorPrimary || !cv.includes('clean-native')))) {
      requirement = 'essential';
    } else if (hasStemSvg || hasSourceVectors || hasHtmlTable) {
      requirement = 'supplementary';
    } else {
      requirement = 'none';
    }

    if (requirement === 'essential') {
      if (hasBadOptions || st.startsWith('quarantined')) {
        fallback = 'insufficient';
        captureRequired = true;
      } else if (isVectorPrimary || isOptionVector) {
        fallback = 'partial';
        captureRequired = true;
      } else if (cv.includes('clean-native') || st.includes('semantic-svg')) {
        fallback = 'complete';
        captureRequired = false;
      } else {
        fallback = 'partial';
        captureRequired = true;
      }
    } else {
      fallback = 'complete';
      captureRequired = false;
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
