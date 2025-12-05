import { describe, it, expect, vi } from 'vitest';
import { runDealTool } from './geminiService';
import { DepartmentView } from '../types';

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      constructor(_apiKey: string) {}
      models = {
        generateContent: vi.fn().mockResolvedValue({
          text: 'Mocked AI response',
        }),
      };
    },
  };
});

describe('geminiService', () => {
  const mockContext = {
    roadmap: { deals: [] },
    taskStatus: {},
    documents: [],
    checklist: [],
    monday: [],
    currentDealFilter: 'All',
    currentDeptView: 'All' as DepartmentView,
  };

  it('should runDealTool with verifyTitle', async () => {
    const res = await runDealTool('verifyTitle', 'Test Deal', mockContext);
    expect(res.text).toBe('Mocked AI response');
  });

  it('should runDealTool with risk_analysis', async () => {
    const res = await runDealTool('risk_analysis', 'Test Deal', mockContext);
    expect(res.text).toBe('Mocked AI response');
  });
});
