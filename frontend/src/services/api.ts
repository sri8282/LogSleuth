/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  HealthResponse,
  LogParseResponse,
  InvestigationReport,
  ReActInvestigationResponse,
} from '../types';

/**
 * Standardized API Error carrying status code and structured detail from FastAPI.
 */
export class ApiError extends Error {
  public status: number;
  public detail?: any;

  constructor(status: number, message: string, detail?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

const DEFAULT_TIMEOUT_MS = 90000; // 90 seconds for AI investigation tasks

/**
 * Bounded fetch with AbortController timeout and clear network error handling.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new ApiError(
        408,
        `Request timed out after ${timeoutMs / 1000} seconds. The backend may still be processing.`
      );
    }
    // Failed to fetch typically means connection refused or offline backend
    throw new ApiError(
      0,
      `Cannot connect to LogSleuth backend at ${url}. Please ensure the FastAPI server is running on http://127.0.0.1:8000.`
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Parses response JSON or extracts meaningful error details.
 */
async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    return (await res.json()) as T;
  }

  let errorMessage = `Server returned HTTP ${res.status}`;
  let errorDetail: any = null;

  try {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const errorJson = await res.json();
      errorDetail = errorJson.detail ?? errorJson;

      if (typeof errorDetail === 'string') {
        errorMessage = errorDetail;
      } else if (Array.isArray(errorDetail)) {
        // FastAPI / Pydantic validation error list
        errorMessage = errorDetail.map((e: any) => `${e.loc?.slice(1).join('.') || 'param'}: ${e.msg}`).join('; ');
      } else if (errorDetail && typeof errorDetail === 'object') {
        errorMessage = errorDetail.message || JSON.stringify(errorDetail);
      }
    } else {
      const text = await res.text();
      if (text) {
        errorMessage = text;
      }
    }
  } catch {
    // Keep fallback message if body is unparseable
  }

  throw new ApiError(res.status, errorMessage, errorDetail);
}

// ---------------------------------------------------------------------------
// Typed Backend API Service Functions
// ---------------------------------------------------------------------------

export const apiService = {
  /**
   * Check backend operational health and Gemini configuration.
   * GET /api/health
   */
  async checkHealth(): Promise<HealthResponse> {
    const res = await fetchWithTimeout('/api/health', { method: 'GET' }, 10000);
    return handleResponse<HealthResponse>(res);
  },

  /**
   * Parse uploaded raw log files via deterministic ingestion engine.
   * POST /api/logs/parse
   */
  async parseLogs(files: File[]): Promise<LogParseResponse> {
    if (!files || files.length === 0) {
      throw new ApiError(400, 'Please select at least one log file to upload.');
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file, file.name);
    });

    // Do NOT set Content-Type header; browser automatically sets multipart/form-data with boundary
    const res = await fetchWithTimeout(
      '/api/logs/parse',
      {
        method: 'POST',
        body: formData,
      },
      60000
    );

    return handleResponse<LogParseResponse>(res);
  },

  /**
   * Run grounded standard AI incident investigation and correlation.
   * POST /api/investigations/analyze
   */
  async analyzeInvestigation(
    files: File[],
    options?: {
      strategy?: 'grounded_analysis' | 'few_shot';
      focusQuery?: string;
    }
  ): Promise<InvestigationReport> {
    if (!files || files.length === 0) {
      throw new ApiError(400, 'Please select at least one log file for AI investigation.');
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file, file.name);
    });

    if (options?.strategy) {
      formData.append('strategy', options.strategy);
    }
    if (options?.focusQuery && options.focusQuery.trim()) {
      formData.append('focus_query', options.focusQuery.trim());
    }

    const res = await fetchWithTimeout(
      '/api/investigations/analyze',
      {
        method: 'POST',
        body: formData,
      },
      120000 // 120 seconds timeout for LLM synthesis
    );

    return handleResponse<InvestigationReport>(res);
  },

  /**
   * Run autonomous controlled ReAct investigation with allowlisted read-only tools.
   * POST /api/investigations/react
   */
  async reactInvestigation(
    files: File[],
    options?: {
      focusQuery?: string;
      maxToolCalls?: number;
    }
  ): Promise<ReActInvestigationResponse> {
    if (!files || files.length === 0) {
      throw new ApiError(400, 'Please select at least one log file for ReAct investigation.');
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file, file.name);
    });

    if (options?.focusQuery && options.focusQuery.trim()) {
      formData.append('focus_query', options.focusQuery.trim());
    }
    if (options?.maxToolCalls) {
      formData.append('max_tool_calls', String(options.maxToolCalls));
    }

    const res = await fetchWithTimeout(
      '/api/investigations/react',
      {
        method: 'POST',
        body: formData,
      },
      150000 // 150 seconds timeout for multi-turn ReAct loop
    );

    return handleResponse<ReActInvestigationResponse>(res);
  },
};
