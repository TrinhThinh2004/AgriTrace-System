import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

export interface GenerateResult {
  content: string;
  model: string;
  tokensUsed: number;
  latencyMs: number;
}

@Injectable()
export class GeminiClient implements OnModuleInit {
  private readonly logger = new Logger(GeminiClient.name);
  private client!: GoogleGenAI;
  private model!: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY chưa được set — mọi request AI sẽ fail. Lấy key tại https://aistudio.google.com/apikey',
      );
    }
    this.client = new GoogleGenAI({ apiKey: apiKey ?? '' });
    this.model =
      this.config.get<string>('GEMINI_MODEL') || 'gemini-2.5-flash';
  }

  /**
   * Sinh nội dung từ Gemini. Retry 1 lần nếu rate-limited (429).
   * Timeout do SDK Google quản lý (~60s default).
   */
  async generate(prompt: string): Promise<GenerateResult> {
    const start = Date.now();
    try {
      const result = await this.callOnce(prompt);
      return { ...result, latencyMs: Date.now() - start };
    } catch (err) {
      const msg = (err as Error).message ?? '';
      if (this.isRateLimit(msg)) {
        this.logger.warn('Gemini rate-limited, retrying once after 1s...');
        await new Promise((r) => setTimeout(r, 1000));
        const result = await this.callOnce(prompt);
        return { ...result, latencyMs: Date.now() - start };
      }
      throw err;
    }
  }

  private async callOnce(prompt: string): Promise<Omit<GenerateResult, 'latencyMs'>> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
    });

    const content = (response.text ?? '').trim();
    if (!content) {
      throw new Error('Gemini trả về nội dung rỗng');
    }
    const tokensUsed =
      (response.usageMetadata?.totalTokenCount as number | undefined) ?? 0;

    return { content, model: this.model, tokensUsed };
  }

  private isRateLimit(msg: string): boolean {
    return /429|rate[\s_-]?limit|RESOURCE_EXHAUSTED/i.test(msg);
  }
}
