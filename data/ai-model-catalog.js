window.NETCRACKER_AI_MODEL_CATALOG = {
  catalogVersion: '1.0.0',
  officiallyCheckedDate: '2026-07-23',
  providers: [
    {
      providerId: 'gemini',
      label: 'Google Gemini',
      apiFamily: 'gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      modelsEndpoint: '/models',
      defaultModel: 'gemini-3.6-flash',
      defaults: { temperature: 0.35, maxOutputTokens: 1200 },
      discoveryConfig: {
        authHeader: 'x-goog-api-key',
        authInQuery: false,
        supportedMethod: 'generateContent',
        stripPrefix: 'models/'
      },
      models: [
        {
          id: 'gemini-3.6-flash',
          label: 'Gemini 3.6 Flash',
          tier: 'Balanced',
          recommended: true,
          stability: 'stable',
          description: 'Recommended for tutoring, explanations and mock analysis.',
          taskTags: ['teach', 'doubt', 'revision', 'analysis']
        },
        {
          id: 'gemini-3.5-flash',
          label: 'Gemini 3.5 Flash',
          tier: 'Quality',
          recommended: false,
          stability: 'stable',
          description: 'Higher-quality explanations and complex reasoning.',
          taskTags: ['teach', 'analysis']
        },
        {
          id: 'gemini-3.5-flash-lite',
          label: 'Gemini 3.5 Flash-Lite',
          tier: 'Economy',
          recommended: false,
          stability: 'stable',
          description: 'Fast, cost-efficient quizzes, summaries and flashcards.',
          taskTags: ['quiz', 'summary', 'flashcard']
        }
      ]
    },
    {
      providerId: 'openai',
      label: 'OpenAI',
      apiFamily: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      modelsEndpoint: '/models',
      defaultModel: 'gpt-5.6-terra',
      defaults: { temperature: 0.35, maxTokens: 1200 },
      discoveryConfig: {
        authHeader: 'Authorization',
        authScheme: 'Bearer ',
        authInQuery: false
      },
      models: [
        {
          id: 'gpt-5.6-terra',
          label: 'GPT-5.6 Terra',
          tier: 'Balanced',
          recommended: true,
          stability: 'stable',
          description: 'Balanced intelligence and cost for regular study sessions.',
          taskTags: ['teach', 'doubt', 'revision', 'analysis']
        },
        {
          id: 'gpt-5.6-sol',
          label: 'GPT-5.6 Sol',
          tier: 'Maximum quality',
          recommended: false,
          stability: 'stable',
          description: 'Difficult concepts, deep reasoning and detailed analysis.',
          taskTags: ['teach', 'analysis']
        },
        {
          id: 'gpt-5.6-luna',
          label: 'GPT-5.6 Luna',
          tier: 'Economy',
          recommended: false,
          stability: 'stable',
          description: 'Fast, cost-sensitive quizzes, summaries and flashcards.',
          taskTags: ['quiz', 'summary', 'flashcard']
        }
      ]
    },
    {
      providerId: 'xai',
      label: 'xAI Grok',
      apiFamily: 'openai',
      baseUrl: 'https://api.x.ai/v1',
      modelsEndpoint: '/models',
      defaultModel: 'grok-4.5',
      defaults: { temperature: 0.35, maxTokens: 1200 },
      discoveryConfig: {
        authHeader: 'Authorization',
        authScheme: 'Bearer ',
        authInQuery: false
      },
      models: [
        {
          id: 'grok-4.5',
          label: 'Grok 4.5',
          tier: 'Quality',
          recommended: true,
          stability: 'stable',
          description: 'General tutoring, reasoning and technical explanations.',
          taskTags: ['teach', 'doubt', 'revision', 'analysis'],
          reasoningOptions: ['low', 'medium', 'high']
        },
        {
          id: 'grok-4.5-latest',
          label: 'Grok 4.5 Latest',
          tier: 'Rolling alias',
          recommended: false,
          stability: 'alias',
          description: 'Tracks the latest Grok 4.5 revision; behaviour may change.',
          taskTags: ['teach', 'analysis'],
          reasoningOptions: ['low', 'medium', 'high']
        }
      ]
    },
    {
      providerId: 'groq',
      label: 'GroqCloud',
      apiFamily: 'openai',
      baseUrl: 'https://api.groq.com/openai/v1',
      modelsEndpoint: '/models',
      defaultModel: 'llama-3.3-70b-versatile',
      defaults: { temperature: 0.35, maxTokens: 1200 },
      discoveryConfig: {
        authHeader: 'Authorization',
        authScheme: 'Bearer ',
        authInQuery: false
      },
      models: [
        {
          id: 'llama-3.3-70b-versatile',
          label: 'Llama 3.3 70B Versatile',
          tier: 'Balanced',
          recommended: true,
          stability: 'stable',
          description: 'Fast, capable general tutoring.',
          taskTags: ['teach', 'doubt', 'revision', 'analysis']
        },
        {
          id: 'openai/gpt-oss-120b',
          label: 'GPT-OSS 120B',
          tier: 'Quality',
          recommended: false,
          stability: 'stable',
          description: 'Strong reasoning and detailed explanations.',
          taskTags: ['teach', 'analysis']
        },
        {
          id: 'openai/gpt-oss-20b',
          label: 'GPT-OSS 20B',
          tier: 'Economy',
          recommended: false,
          stability: 'stable',
          description: 'Cost-efficient study assistance.',
          taskTags: ['quiz', 'summary', 'flashcard']
        },
        {
          id: 'llama-3.1-8b-instant',
          label: 'Llama 3.1 8B Instant',
          tier: 'Fast',
          recommended: false,
          stability: 'stable',
          description: 'Very fast lightweight quizzes and summaries.',
          taskTags: ['quiz', 'summary']
        }
      ]
    },
    {
      providerId: 'custom',
      label: 'Custom OpenAI-compatible',
      apiFamily: 'openai',
      baseUrl: '',
      modelsEndpoint: '/models',
      defaultModel: '',
      defaults: { temperature: 0.35, maxTokens: 1200 },
      discoveryConfig: {
        authHeader: 'Authorization',
        authScheme: 'Bearer ',
        authInQuery: false,
        optional: true
      },
      supportsCustomModelId: true,
      models: []
    }
  ]
};
