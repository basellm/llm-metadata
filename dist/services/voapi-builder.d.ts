import { type PlaneRates } from '../billing/plane.js';
import type { NormalizedData, VoAPIApiSyncPayload } from '../types/index.js';
/** VoAPI 构建服务（价格换算到 USD 平面输出；无汇率的货币留空） */
export declare class VoAPIBuilder {
    private readonly rates;
    constructor(rates: PlaneRates);
    /** 构建 VoAPI 模型供应商格式数据（标签仅保留显式标签，不含能力/模态/上下文窗口） */
    buildFirms(allModelsData: NormalizedData, tagMap?: Record<string, string>): VoAPIApiSyncPayload;
}
//# sourceMappingURL=voapi-builder.d.ts.map